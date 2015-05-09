'use strict';
var debug = require('debug')('api:loopback:middleware:token');
var inspect = require('util').inspect;
module.exports = {
  lib: {
    loopback: {
      token: {
        searchDefaultTokenKeys: searchDefaultTokenKeys,
        optionsUndefined: optionsUndefined,
      }
    }
  }
};

var loopback = require('../../');
var tokenId;  //FIXME: another way than this 'global'
var testOptions;
var tokenOptions;
var TestModel;

function optionsUndefined(testOptions) {
  debug('optionsUndefined testOptions:\n' + inspect(testOptions) + '\n');
  tokenOptions = {};
  var app = createTokenStartApp(testOptions, tokenOptions);
}

function searchDefaultTokenKeys(testOptions, tokenOptions) {
  debug(inspect(testOptions));
  var done = testOptions['done'];
  done();
  debug('optionsUndefined searchDefaultTokenKeys:\n' + inspect(testOptions) + '\n');
  var app = createTokenStartApp(testOptions, tokenOptions);
}

function sendRequest(app, testOptions) {
  debug('sendRequest testOptions.tokenId:\n' + inspect(testOptions.tokenId) + '\n');
  request(app)
    .get(testOptions.get)
    .set(testOptions.header, testOptions.tokenId)
    .expect(testOptions.expect)
    .end(testOptions.done);
}

function createTokenStartApp(testOptions, tokenOptions) {
  var extend = require('util')._extend;
  var Token = loopback.AccessToken.extend('MyToken');
  var tokenDataSource = loopback.createDataSource({connector: loopback.Memory});
  var tokenCreate = {userId: '123'};
  var done = testOptions.done;
  testOptions['get'] = '/';

  Token.attachTo(tokenDataSource);
  tokenOptions['model'] = Token;
  tokenOptions['currentUserLiteral'] = 'me';

  Token.create(tokenCreate, function(err, token) {
    if (err) return done(err);
    testOptions['tokenId'] = token.id;
    var app = startApp(testOptions, tokenOptions);
    sendRequest(app, testOptions);
  });
}

function attachAndReturnModel() {
  var ACL = loopback.ACL;
  var acl = {
    principalType: 'ROLE',
    principalId: '$everyone',
    accessType: ACL.ALL,
    permission: ACL.DENY,
    property: '*'
  };
  var modelOptions = {acls: [acl]};
  TestModel = loopback.PersistedModel.extend('test', {}, modelOptions);
  TestModel.attachTo(loopback.memory());
}

function appGet(req, res) {
  // NOTE: we do not use assert for the presence of a token but findForRequest
  TestModel.findForRequest(req, tokenOptions, function(err, token) {
    if (token) {
      res.send(200);
    } else {
      debug('appGet err:\n' + err + '\n');
      res.send(401);
    }
  });
}

function startApp(testOptions, tokenOptions) {
  var get = testOptions.get;
  var app = loopback();
  TestModel = attachAndReturnModel();
  app.model(TestModel);
  app.use(loopback.token(tokenOptions)); // The subject of all this work
  app.get(get, appGet);
  app.use(loopback.rest());
  app.enableAuth();
  return app;
}
