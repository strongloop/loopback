'use strict';
var debug = require('debug')('api:loopback:middleware:token');
var inspect = require('util').inspect;
var SEARCHDEFAULTKEYS_LIB = './lib/lib-loopback-token-searchDefaultTokenKeys';
var test = require(SEARCHDEFAULTKEYS_LIB);
var loopbackToken = test.lib.loopback.token.loopbackToken;
var testOptions = {}; //TODO: cleaner usage
var tokenOptions = {}; //TODO: cleaner usage

describe('api:loopback:middleware:token(options)', function() {
  describe('loopback.token({})', function() {
    it('header authorization', function(done) {
      testOptions = {};
      testOptions['expect'] = 200;
      testOptions['done'] = done;
      testOptions['header'] = 'authorization';
      loopbackToken(testOptions);
    });
    /* SKIP
    it.skip('query access_token', function(done) {
      testOptions = {};
      testOptions['expect'] = 200;
      testOptions['done'] = done;
      testOptions['query'] = 'access_token';
      loopbackToken(testOptions);
    });
    it.skip('cookie access_token', function(done) {
      testOptions = {};
      testOptions['expect'] = 200;
      testOptions['done'] = done;
      testOptions['cookie'] = 'access_token';
      loopbackToken(testOptions);
    });
    */
    describe('options', function() {
      describe('searchDefaultTokenKeys:[true|false]', function() {
        describe('normal usage', function() {
          it('header, headers has header, false', function(done) {
            testOptions = {};
            testOptions['expect'] = 200;
            testOptions['done'] = done;
            testOptions['header'] = 'authorization';
            tokenOptions = {};
            tokenOptions['searchDefaultTokenKeys'] = false;
            tokenOptions['headers'] = [testOptions['header']];
            loopbackToken(testOptions, tokenOptions);
          });
          it('header, headers is empty, true', function(done) {
            testOptions = {};
            testOptions['expect'] = 200;
            testOptions['done'] = done;
            testOptions['header'] = 'authorization';
            tokenOptions = {};
            tokenOptions['searchDefaultTokenKeys'] = true;
            tokenOptions['headers'] = [testOptions['header']];
            loopbackToken(testOptions, tokenOptions);
          });
        });
        describe('unnormal usage: for testing, or other strange usages', function() {
          it('header, headers is empty, false', function(done) {
            testOptions['done'] = done;
            testOptions['expect'] = 401;
            testOptions['header'] = 'authorization';
            tokenOptions['searchDefaultTokenKeys'] = false;
            tokenOptions['headers'] = [];
            loopbackToken(testOptions, tokenOptions);
          });
        });
      });
    });
  });
});
