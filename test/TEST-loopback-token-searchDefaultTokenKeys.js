'use strict';

var debug = require('debug')('AccessToken.app');
var inspect = require('util').inspect;
/*
  TEST:Middleware:loopback.token.searchDefaultTokenKeys
*/
module.exports = {
  api : {
    loopback: {
      token: {
        optionsUndefined: optionsUndefined,
        options: {
          searchDefaultTokenKeys: searchDefaultTokenKeys,
        }
      }
    }
  }
};
var loopback = require('../');
var tokenId; // FIXME: a 'global' until some other method is found

function optionsUndefined(testOptions) {
  var done = testOptions.done;
  var tokenOptions = {};
  createTokenStartApp(testOptions, tokenOptions);
}
function searchDefaultTokenKeys(testOptions, tokenOptions) {
  createTokenStartApp(testOptions, tokenOptions);
}

function createTokenStartApp(testOptions, tokenOptions) {
  var extend = require('util')._extend;
  var Token = loopback.AccessToken.extend('MyToken');
  var tokenDataSource = loopback.createDataSource({connector: loopback.Memory});
  var tokenCreate = {userId: '123'};
  Token.attachTo(tokenDataSource);
  tokenOptions['model'] = Token;
  tokenOptions['currentUserLiteral'] = 'me';

  Token.create(tokenCreate, function(err, token) {
    if (err) return done(err);
    testOptions['tokenId'] = token.id;
    tokenId = testOptions['tokenId']; //FIXME: another way than 'global'?
    testOptions['get'] = '/';
    var done = testOptions.done;
    var expect = testOptions.expect;
    var header = testOptions.header;
    var get = testOptions.get;
    var tokendId = testOptions.tokenId;
    var app = startApp(testOptions, tokenOptions);
    request(app)
      .get(get)
      .set(header, tokenId)
      .expect(expect)
      .end(done);
  });
}

function attachAndReturnModel() {
  var ACL = loopback.ACL;
  var acl = {
    principalType: 'ROLE',
    principalId: '$everyone',
    accessType: ACL.ALL,
    permission: ACL.DENY,
    property: 'deleteById'
  };
  var modelOptions = {acls: [acl]};
  var TestModel = loopback.PersistedModel.extend('test', {}, modelOptions);
  TestModel.attachTo(loopback.memory());
  return TestModel;
}

// FIXME: try/catch does not support searchDefaultTokenKeys = false and headers = []
function appGet(req, res) {
  debug('appGet req.headers:\n' + inspect(req.headers) + '\n');
  debug('appGet req.accessToken:\n' + inspect(req.accessToken) + '\n');
  debug('appGet tokenId:\n' + tokenId + '\n');
  var send = '200';
  try {
    assert(req.accessToken, 'req should have accessToken');
    assert(req.accessToken.id === tokenId);
    // FIXME: ok the req HAS accessToken.id but if loopback is not 'looking' for it === 401
  } catch (error) {
    debug('app.get error:\n' + error + '\n');
    send = '401';
  }
  debug('app.get send:\n' + send + '\n');
  res.send(send);
}

function startApp(testOptions, tokenOptions) {
  debug('createApp tokenOptions.headers:\n' + inspect(tokenOptions.headers));
  var get = testOptions.get;
  var app = loopback();
  var TestModel = attachAndReturnModel();
  app.model(TestModel);
  app.use(loopback.token(tokenOptions)); // The subject of all this work
  app.get(get, appGet);
  app.use(loopback.rest());
  app.enableAuth();
  return app;
}
