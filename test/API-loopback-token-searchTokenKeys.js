'use strict';
var debug = require('debug')('AccessToken.test');
var inspect = require('util').inspect;
/*
* API:Middleware:loopback.token(options)
*/
var api = {
  loopback: {
    token: {
      noOptions: require('./TEST-loopback-token-searchDefaultTokenKeys').api.loopback.token.noOptions,
      options:{
        searchDefaultTokenKeys: require('./TEST-loopback-token-searchDefaultTokenKeys').api.loopback.token.options.searchDefaultTokenKeys
      }
    }
  }
};

describe('API:Middleware:loopback.token(options)', function() {
  describe('options = {} --- DEMO --- DEMO ---', function() {
    var itTxt;
    var expect = 200;
    var header = 'authorization';
    var testOptions = {
      expect: expect,
      header: header,
    };
    // describe('A normal use case, where a well-known header is used with no other options needed');
    itTxt = 'Test header=' + header + ' and expect ' + expect;
    it(itTxt, function(done) {
      done(); // TODO: implement in api.loopback.token.noOptions(testOptions)
    });
  });
  describe('options.searchDefaultTokenKeys: [true|false]', function() {
    var itTxt;
    var expect = 200;
    var searchDefaultTokenKeys = false;
    var header = 'authorization';
    var testOptions = {
      expect: expect,
      header: header,
    };
    var headers = ['header'];
    var tokenOptions = {
      searchDefaultTokenKeys: searchDefaultTokenKeys,
      headers: headers,
    };

    // describe('The normal use case for searchDefaultTokenKeys')
    itTxt = 'Test header=' + header + ' searchDefaultTokenKeys=' + searchDefaultTokenKeys + ' and expect ' + expect;
    it(itTxt, function(done) {
      testOptions['done'] = done;
      api.loopback.token.options.searchDefaultTokenKeys(testOptions, tokenOptions);
    });

    // describe('A test case for regression')
    searchDefaultTokenKeys = undefined;
    headers = [];
    itTxt = 'Test header=' + header + ' searchDefaultTokenKeys=' + searchDefaultTokenKeys + ' and expect ' + expect;
    it(itTxt, function(done) {
      testOptions['searchDefaultTokenKeys'] = undefined; //FIXME: is this a good way
      testOptions['headers'] = headers;
      testOptions['done'] = done;
      api.loopback.token.options.searchDefaultTokenKeys(testOptions, tokenOptions);
    });

    /*
      FIXME: TEST appGet try/catch does not support this test
    // describe('A non-normal use case to check that default token headers are not used')
    searchDefaultTokenKeys = false; // any defaults ...
    headers = []; // ... are not concated, and the empty array for token areas ...
    expect = 401; // ... gives the expected result.
    itTxt = 'Test header='+ header +' searchDefaultTokenKeys='+ searchDefaultTokenKeys +' no headers and expect '+ expect;
    it(itTxt, function(done) {
      testOptions['done'] = done;
      testOptions['searchDefaultTokenKeys'] = searchDefaultTokenKeys;
      testOptions['expect'] = expect;
      testOptions['headers'] = headers;
      api.loopback.token.searchDefaultTokenKeys(testOptions, tokenOptions);
    });
    */
  });
});
