'use strict';
var debug = require('debug')('api:loopback:middleware:token');
var inspect = require('util').inspect;
var LOOPBACK_REQURE = '../../';
var loopback = require(LOOPBACK_REQURE);

module.exports = TestEnvironment;

var defTokenOptions = {};
var header = 'authorization';
var defTestOptions = {expect: 200, header: header, get: '/'}; 

function TestEnvironment(testOptions, tokenOptions){
  testOptions = testOptions || defTestOptions;
  this.testOptions = testOptions;
  debug('TestEnvironment testOptions:\n' + inspect(this.testOptions));
  
  tokenOptions = tokenOptions || defTokenOptions;
  this.tokenOptions = tokenOptions;
  debug('TestEnvironment tokenOptions:\n' + inspect(this.tokenOptions));
  
  this.testOptions.app = this.testOptions.app || null;
  if (this.testOptions.app === null){
    debug('TestEnvironment startApp');
    this.startApp();
  }
};

TestEnvironment.prototype.runTest = function(done){
  var that = this;
  this.testOptions.done = done;
  if (! this.testOptions.tokenId){
    debug('runTest createTokenId sendReq');
    this.createTokenId(function(){
      debug('runTest createTokenId:\n' + inspect(that.testOptions.tokenId));
      that.sendReq();
      //that.testOptions.done();
    }); // createToken will call done iff error
  }else{
    debug('runTest sendReq for tokenId\n' + inspect(that.testOptions.tokenId));
    this.sendReq();
  } 
}

TestEnvironment.prototype.sendReq = function (testOptions){
  var testOptions = testOptions || this.testOptions; 
  debug('sendReq header tokenId:\n' + inspect(testOptions.header) + '\n' + inspect(testOptions.tokenId));
  request(testOptions.app)
    .get(testOptions.get)
    .set(testOptions.header, testOptions.tokenId)
    .expect(testOptions.expect)
    .end(testOptions.done);
}

TestEnvironment.prototype.createTokenId = function(cb) {
  var that = this;
  var accessToken = loopback.AccessToken;
  this.testOptions.accessToken = accessToken;
  var tokenDataSource = loopback.createDataSource({connector: loopback.Memory});
  accessToken.attachTo(tokenDataSource);
  accessToken.create({}, function(err, token){
    if (err) return that.testOptions.done(err); // TODO: review if done or cb is best
    that.testOptions.token = token;
    that.testOptions.tokenId = token.id;
    if (cb && typeof cb === 'function') {
      cb();
    } // TODO: else how would one return tokenId to the caller...
  });
}

TestEnvironment.prototype.startApp = function(){
 var that = this;
 var app = loopback();
 this.testOptions.app = app;
 var tokenOptions = this.tokenOptions;
 var get = this.testOptions.get;
 var getFn = this.testOptions.getFn;
 app.use(loopback.token(tokenOptions));
 debug("FIXME FIXME: dies after this");
 app.get(get, function(req, res){
  debug('appget req.headers:\n' + inspect(req.headers));
  var testOptions = that.testOptions;
  var tokenOptions = that.tokenOptions;
  testOptions.accessToken.findForRequest(req, tokenOptions, function(err, token){
    if (err) {
      debug('appGet 500 err:\n' + inspect(err));
      res.sendStatus(500);
    } else if (token) {
      debug('appGet 200 token:\n' + inspect(token));
      res.sendStatus(200);
    }else {
      debug('appGet 401 err token:\n' + inspect(err) + '\n' + inspect(token));
      res.sendStatus(401);
    }    
  });
 });
 debug('startApp started');
}

