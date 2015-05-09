'use strict';
var debug = require('debug')('api:loopback:middleware:token');
var inspect = require('util').inspect;
var extend = require('util')._extend;
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
var testOptions; //FIXME: ??? heavy use of these 'global's
var tokenOptions;
var app;
var Token;
var tokenId;  
var TestModel; 

function optionsUndefined(theTestOptions) {
  testOptions = theTestOptions;
  tokenOptions = {};
  createTokenModleStartAppSendReq();
}

function searchDefaultTokenKeys(theTestOptions, theTokenOptions) {
  testOptions = theTestOptions;
  tokenOptions = theTokenOptions;
  createTokenModleStartAppSendReq();
}

function sendRequest() {
  debug('sendRequest get header tokenId expect:\n' + testOptions.get + '\n' + testOptions.header + '\n' + tokenId + '\n' + testOptions.expect + '\n');
  request(app)
    .get(testOptions.get)
    .set(testOptions.header, tokenId)
    .expect(testOptions.expect)
    .end(testOptions.done);
}

function createTokenModleStartAppSendReq() {
  Token = loopback.AccessToken.extend('MyToken');
  var tokenDataSource = loopback.createDataSource({connector: loopback.Memory});
  var tokenCreate = {userId: '123'};
  testOptions['get'] = '/';

  Token.attachTo(tokenDataSource);
  tokenOptions['model'] = Token;
  tokenOptions['currentUserLiteral'] = 'me';

  Token.create(tokenCreate, function(err, token) {
    if (err) return done(err);
    tokenId = token.id;
    createTestModel();
    startApp();
    sendRequest();      
  });
}

function createTestModel() {
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
  // NOTE: The appGet should used .findForRequest and not just check if there is a req with token
  debug('appget tokenOptions:\n' + tokenOptions + '\n');
  debug('appget req:\n' + req + '\n');
  Token.findForRequest(req, tokenOptions, function(err, token) { // the test of all this work
    if (token) {
      res.sendStatus(200);
    } else {
      debug('appGet err:\n' + err + '\n');
      res.sendStatus(401);
    }
  });
}

function startApp() {
  app = loopback();
  app.model(TestModel);
  app.use(loopback.token(tokenOptions)); // The subject of all this work
  app.get(testOptions['get'], appGet);
  app.use(loopback.rest());
  app.enableAuth();
}
