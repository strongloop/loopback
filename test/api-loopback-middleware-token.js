'use strict';
var DESCRIBE = 'api:loopback:middleware:token(options)';
var DEBUG = 'api:loopback:middleware:token';
var TEST_LIB = './lib/lib-loopback-middleware-token';

var debug = require('debug')('DEBUG');
var inspect = require('util').inspect;
var TestEnvironment = require(TEST_LIB);

describe(DESCRIBE, function() {
  describe('loopback.token({})', function() {
    it('header', function(done) {
      var tstEnv = new TestEnvironment();
      tstEnv.runTest(done);
    });
    describe('Breaking change', function() {
      it('None', function(done) {
        done();
      });
    });
  });
  describe('options', function() {
    describe('searchDefaultTokenKeys:[true|false]', function() {
      describe('Normal usage: false for use case, restrict location of token', function() {
        describe('Example, token in header', function() {
          var header = 'authorization';
          it('options.headers is empty, true', function(done) {
            var testOptions = {expect: 200, header: header};
            var tokenOptions = {searchDefaultTokenKeys: true, headers: []};
            var tstEnv = new TestEnvironment(testOptions, tokenOptions);
            tstEnv.runTest(done);
          });
          it('options.headers has header, false', function(done) {
            var testOptions = {expect: 200, header: header};
            var tokenOptions = {searchDefaultTokenKeys: false, headers: [header]};
            var tstEnv = new TestEnvironment(testOptions, tokenOptions);
            tstEnv.runTest(done);
          });
        });
      });
      describe('Unormal usage: testing or unknown usage', function() {
        describe('Example, token in header', function() {
          var header = 'authorization';
          it('options.headers is empty, false', function(done) {
            var header = 'authorization';
            var testOptions = {expect: 401, header: header};
            var tokenOptions = {searchDefaultTokenKeys: false, headers: []};
            var tstEnv = new TestEnvironment(testOptions, tokenOptions);
            tstEnv.runTest(done);
          });
        });
      });
      describe('Breaking change', function() {
        it('None', function(done) {
          done();
        });
      });
    });
  });
});
