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
var testOptions;
var tokenOptions;
var app;
var tokenId;  //FIXME: ??? heavy use of these 'global's
var TestModel; //FIXME: TypeError prototype of undefined for TestModel.findForRequest

function optionsUndefined(theTestOptions) {
  testOptions = theTestOptions;
  tokenOptions = {};
  debug('optionsUndefined:\n' + inspect(testOptions) + '\n' + inspect(tokenOptions) + '\n');  
  createTokenModleStartAppSendReq();
}

function searchDefaultTokenKeys(theTestOptions, theTokenOptions) {
  testOptions = theTestOptions;
  tokenOptions = theTokenOptions;
  debug('options.searchDefaultTokenKeys:\n' + inspect(testOptions) + '\n' + inspect(tokenOptions) + '\n');
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
  var extend = require('util')._extend;
  var Token = loopback.AccessToken.extend('MyToken');
  var tokenDataSource = loopback.createDataSource({connector: loopback.Memory});
  var tokenCreate = {userId: '123'};
  testOptions['get'] = '/';

  Token.attachTo(tokenDataSource);
  tokenOptions['model'] = Token;
  tokenOptions['currentUserLiteral'] = 'me';

  Token.create(tokenCreate, function(err, token) {
    if (err) return done(err);
    tokenId = token.id;
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
  // FIXME: TypeError undefined is not a function: Work in progress, IT has to happen
  // debug('appget FIXME TypeError undefined for TestModel.findForRequest:\n' + '\n' + inspect(TestModel) + '\n');
  // debug('appget tokenOptions:\n' + tokenOptions + '\n');
  // debug('appget req:\n' + req + '\n');
  TestModel.findForRequest(req, tokenOptions, function(err, token) {
    if (token) {
      res.send(200);
    } else {
      debug('appGet err:\n' + err + '\n');
      res.send(401);
    }
  });
}

function startApp() {
  app = loopback();
  createTestModel(); //IS: this placed at the correct place: can it be done before startApp
  app.model(TestModel);
  app.use(loopback.token(tokenOptions)); // The subject of all this work
  app.get(testOptions['get'], appGet);
  app.use(loopback.rest());
  app.enableAuth();
}
