'use strict';
var debug = require('debug')('api:loopback:middleware:token');
var inspect = require('util').inspect;
var SEARCHDEFAULTKEYS_LIB = './lib/lib-loopback-token-searchDefaultTokenKeys';
var test = require(SEARCHDEFAULTKEYS_LIB);
var testOptions = {};
var tokenOptions = {};

describe('AccessToken api:loopback:middleware:token', function() {
  describe('options.searchDefaultTokenKeys:[true|false]', function() {
        testOptions['expect'] = 200;
        testOptions['header'] = 'authorization';
        tokenOptions['searchDefaultTokenKeys'] = false;
        tokenOptions['headers'] = [testOptions['header']];
    describe('normal usage for options.searchDefaultTokenKeys', function() {
      it('header, headers has header, searchDefaultTokenKeys is false', function(done) {
        testOptions['done'] = done;
        test.lib.loopback.token.searchDefaultTokenKeys(testOptions, tokenOptions);
      });
      it('header, headers is empty, searchDefaultTokenKeys is true', function(done) {
        testOptions['done'] = done;
        tokenOptions['searchDefaultTokenKeys'] = true;
        test.lib.loopback.token.searchDefaultTokenKeys(testOptions, tokenOptions);
      });
    });
    describe('normal usage when not using options.searchDefaultTokenKeys', function() {
      it('header, headers is empty, searchDefaultTokenKeys is undefined', function(done) {
        testOptions['done'] = done;
        tokenOptions['searchDefaultTokenKeys'] = undefined;
        test.lib.loopback.token.searchDefaultTokenKeys(testOptions, tokenOptions);
      });
    });
    describe('unnormal usage: for testing purposes, or other strange usages', function() {
      it('header, headers is empty, searchDefaultTokenKeys is false', function(done) {
        testOptions['done'] = done;
        testOptions['expect'] = 401;
        testOptions['header'] = 'authorization';
        tokenOptions['searchDefaultTokenKeys'] = false;
        tokenOptions['headers'] = [];
        test.lib.loopback.token.searchDefaultTokenKeys(testOptions, tokenOptions);
      });
    });
  });
});
