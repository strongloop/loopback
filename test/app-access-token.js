'use strict';
/*
* An app for access-token tests
* - note 'request' seems to come from test/support.js
*/
module.exports = {
  createTokenId: createTokenId,
  createAppAndRequest: createAppAndRequest
}
var 
  debug = require('debug')('AccessToken.app'),
  inspect = require('util').inspect;
var  
  loopback = require('../'),
  extend = require('util')._extend, //WHY: the _
  Token = loopback.AccessToken.extend('MyToken'),
  createToken = {userId: '123'},
  lbDataSource = loopback.createDataSource({connector: loopback.Memory}),
  ACL = loopback.ACL;

Token.attachTo(lbDataSource);

function createTokenId(done) {
  var
    test = this; // FIXME: I hate this
  Token.create(createToken, function(err, token) {
    if (err) {
      debug('createTokenId err:\n'+inspect(err)+'\n');
      return done(err);
    }
    debug('createTokenId tokenId:\n'+inspect(token.id)+'\n');
    test.tokenId = token.id;
    done();
  });
}

function createAppAndRequest(tokenId, settings, done) {
  return request(createApp(tokenId, settings, done));
}

function createApp(tokenId, settings, done) {
  var appSettings = settings.app || {}; 
  
  var modelSettings = settings.model || {}; 
  var modelOptions = {
    acls: [
      {
        principalType: 'ROLE',
        principalId: '$everyone',
        accessType: ACL.ALL,
        permission: ACL.DENY,
        property: 'deleteById'
      }
    ]
  };
  Object.keys(modelSettings).forEach(function(key) { modelOptions[key] = modelSettings[key];});
  
  var tokenSettings = {
    defaultTokenKeys : true,
    model: Token,
    currentUserLiteral: 'me'
  }; 

  var app = loopback();
  
  app.use(loopback.cookieParser('secret'));
  app.use(loopback.token(tokenSettings));

  app.get('/', function(req, res) {
    var send = '200';
    try { // TODO: this is a bad test for defaultTokenKey = false and no options for placement of token
      assert(req.accessToken, 'req should have accessToken'); // this fails the defaultTokenKeys=false test
      assert(req.accessToken.id === tokenId);
    } catch (e) {
      debug('app.get e:'+e);
      send = '401'
    }
    debug('app.get send:'+send);
    res.send(send);
  });
  app.use(loopback.rest());
  app.enableAuth();

  Object.keys(appSettings).forEach(function(key) {app.set(key, appSettings[key]);});

  var TestModel = loopback.PersistedModel.extend('test', {}, modelOptions);
  TestModel.attachTo(loopback.memory());
  app.model(TestModel);

  return app;
}
