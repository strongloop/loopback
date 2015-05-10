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
var testOptions; //FIXME: ??? heavy use of these 'global's ?==>Object's
var tokenOptions; 
var app;
var AccessToken;

function optionsUndefined(theTestOptions) {
  testOptions = theTestOptions; // FIXME : go to Objects and this and new
  tokenOptions = {};
  createToken(startAppSendRequest);
}

function searchDefaultTokenKeys(theTestOptions, theTokenOptions) {
  testOptions = theTestOptions; // FIXME : go to Objects and this and new
  tokenOptions = theTokenOptions;
  createToken(startAppSendRequest);
}

function sendRequest() {
  debug('sendRequest testOptions:\n' + inspect(testOptions) + '\n');
  request(app)
    .get(testOptions.get)
    .set(testOptions.header, testOptions.tokenId)
    .expect(testOptions.expect)
    .end(testOptions.done);
}

function createToken(cb) {
  AccessToken = loopback.AccessToken;
  var tokenDataSource = loopback.createDataSource({connector: loopback.Memory});
  AccessToken.attachTo(tokenDataSource);
  AccessToken.create({}, cb);
}

function startAppSendRequest(err, token){
  if (err) return testOptions.done(err);
  testOptions['tokenId'] = token.id;
  testOptions['get'] = '/';
  startApp();
  sendRequest();  
}

function appGet(req, res) {
  debug('appget req:\n' + inspect(req) + '\n');
  AccessToken.findForRequest(req, tokenOptions, function(err, token) { // the test of all this work
    if (err) {
      debug('appGet err:\n' + inspect(err) + '\n');
      res.sendStatus(500);
    } else if (token) {
      debug('appGet token:\n' + inspect(token) + '\n');
      res.sendStatus(200);
    }else {
      debug('appGet err token:\n' + inspect(err) + '\n' + inspect(token) + '\n');
      res.sendStatus(401);
    }
  });
}

function startApp() {
  app = loopback();
  app.use(loopback.token(tokenOptions)); // The subject of all this work
  app.get(testOptions['get'], appGet);
}
