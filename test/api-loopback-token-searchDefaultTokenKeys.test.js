'use strict';
var debug = require('debug')('api:loopback:middleware:token');
var inspect = require('util').inspect;
var SEARCHDEFAULTKEYS_LIB = './lib/lib-loopback-token-searchDefaultTokenKeys';
var test = require(SEARCHDEFAULTKEYS_LIB);
var testOptions = {}; //TODO: cleaner usage
var tokenOptions = {}; //TODO: cleaner usage

describe('AccessToken api:loopback:middleware:token(options)', function() {
  describe('loopback.token({})', function() {
    it('header authorization', function(done) {
      testOptions = {};
      testOptions['expect'] = 200;
      testOptions['done'] = done;
      testOptions['header'] = 'authorization';
      test.lib.loopback.token.optionsUndefined(testOptions);
    });
    it.skip('query access_token', function(done) {
      testOptions = {};
      testOptions['expect'] = 200;
      testOptions['done'] = done;
      testOptions['query'] = 'access_token';
      test.lib.loopback.token.optionsUndefined(testOptions);
    });
    it.skip('cookie access_token', function(done) {
      testOptions = {};
      testOptions['expect'] = 200;
      testOptions['done'] = done;
      testOptions['cookie'] = 'access_token';
      test.lib.loopback.token.optionsUndefined(testOptions);
    });
  });
  describe('options.searchDefaultTokenKeys:[true|false]', function() {
    describe('normal usage for options.searchDefaultTokenKeys', function() {
      it('header, headers has header, searchDefaultTokenKeys is false', function(done) {
        testOptions = {};
        testOptions['expect'] = 200;
        testOptions['done'] = done;
        testOptions['header'] = 'authorization';
        tokenOptions = {};
        tokenOptions['searchDefaultTokenKeys'] = false;
        tokenOptions['headers'] = [testOptions['header']];
        test.lib.loopback.token.searchDefaultTokenKeys(testOptions, tokenOptions);
      });
      it('header, headers is empty, searchDefaultTokenKeys is true', function(done) {
        testOptions = {};
        testOptions['expect'] = 200;
        testOptions['done'] = done;
        testOptions['header'] = 'authorization';
        tokenOptions = {};
        tokenOptions['searchDefaultTokenKeys'] = true;
        tokenOptions['headers'] = [testOptions['header']];
        test.lib.loopback.token.searchDefaultTokenKeys(testOptions, tokenOptions);
      });
    });
    describe('normal usage when not using options.searchDefaultTokenKeys', function() {
      it('header, headers is empty, searchDefaultTokenKeys is undefined', function(done) {
        testOptions = {};
        testOptions['expect'] = 200;
        testOptions['done'] = done;
        testOptions['header'] = 'authorization';
        tokenOptions = {};
        tokenOptions['searchDefaultTokenKeys'] = undefined;
        tokenOptions['headers'] = [testOptions['header']];
        test.lib.loopback.token.searchDefaultTokenKeys(testOptions, tokenOptions);
      });
    });
    describe('unnormal usage: for testing purposes, or other strange usages', function() {
      it('header, headers is empty, searchDefaultTokenKeys is false', function(done) {
        testOptions['done'] = done;
        testOptions['expect'] = 401;
        testOptions['header'] = 'authorization';
        tokenOptions['searchDefaultTokenKeys'] = undefined;
        tokenOptions['headers'] = [];
        test.lib.loopback.token.searchDefaultTokenKeys(testOptions, tokenOptions);
      });
    });
  });
});
