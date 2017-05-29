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
var tokenId;  //FIXME: another way than this 'global'


function optionsUndefined(testOptions) {
  debug('optionsUndefined testOptions:\n' + inspect(testOptions) + '\n');
  var tokenOptions = {};
  var app = createTokenStartApp(testOptions, tokenOptions);
}

function searchDefaultTokenKeys(testOptions, tokenOptions) {
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
  var TestModel = loopback.PersistedModel.extend('test', {}, modelOptions);
  TestModel.attachTo(loopback.memory());
  return TestModel;
}

// FIXME: try/catch does not support searchDefaultTokenKeys = false and headers = []
function appGet(req, res) {
  debug('appeget req:\n' + inspect(req) + '\n' );
  debug('appeget res:\n' + inspect(res) + '\n' );
/*
  debug('appGet req.headers:\n' + inspect(req.headers) + '\n');
  debug('appGet req.accessToken:\n' + inspect(req.accessToken) + '\n');
  debug('appGet tokenId:\n' + tokenId + '\n');
 */  
  var send = '200';
  try {
    assert(req.accessToken, 'req should have accessToken');
    assert(req.accessToken.id === tokenId); //FIXME: another way than this 'global'
    // FIXME: ok the req HAS accessToken.id but this is not a good test
    
  } catch (error) {
    debug('app.get error:\n' + error + '\n');
    send = '401';
  }
  debug('app.get send:\n' + send + '\n');
  res.send(send);
}

function startApp(testOptions, tokenOptions) {
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
