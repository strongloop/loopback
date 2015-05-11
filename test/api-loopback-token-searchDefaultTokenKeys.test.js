'use strict';
var debug = require('debug')('api:loopback:middleware:token');
var inspect = require('util').inspect;
var SEARCHDEFAULTKEYS_LIB = './lib/lib-loopback-token-searchDefaultTokenKeys';
var TestEnvironment = require(SEARCHDEFAULTKEYS_LIB);

describe('api:loopback:middleware:token(options)', function() {
  describe('loopback.token({})', function() {
    it('header', function(done) {
      var tstEnv = new TestEnvironment();
      tstEnv.runTest(done);
    });
  });
  describe('options', function(){
    describe('searchDefaultTokenKeys:[true|false]', function() {
      describe('normal usage', function(){
        it('header, headers is empty, true', function(done) {          
          var header = 'authorization';
          var testOptions = {expect: 200, header: header,};              
          var tokenOptions = {searchDefaultTokenKeys: true, headers: []};
          var tstEnv = new TestEnvironment(testOptions, tokenOptions);
          tstEnv.runTest(done);          
        });        
        it('header, headers has header, false', function(done) {          
          var header = 'authorization';
          var testOptions = {expect: 200, header: header,};              
          var tokenOptions = {searchDefaultTokenKeys: false, headers: [header]};
          var tstEnv = new TestEnvironment(testOptions, tokenOptions);
          tstEnv.runTest(done);
        });        
      });
      describe('unormal usage: testing or unknown usage', function(){
        it('header, headers is empty, false', function(done) {                  
          var header = 'authorization';
          var testOptions = {expect: 401, header: header,};              
          var tokenOptions = {searchDefaultTokenKeys: false, headers: []};
          var tstEnv = new TestEnvironment(testOptions, tokenOptions);
          tstEnv.runTest(done);
        });
      });
    });  
  });
});