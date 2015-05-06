'use strict';
var
  debug = require('debug')('AccessToken.test'),
  inspect = require('util').inspect;
/*
* API:Middleware:loopback.token(options)
*/
var
  api = {
    loopback: {
      token: {
        searchDefaultTokenKeys: require('./TEST-loopback-token-searchDefaultTokenKeys').api.loopback.token.searchDefaultTokenKeys
      }
    }
  }

describe('API:Middleware:loopback.token(options)', function() {
  describe('options.searchDefaultTokenKeys: [true|false]', function() {
    var
      itTxt,
      expect = 200,
      searchDefaultTokenKeys = false,
      header = 'authorization',
      testOptions = {
        expect: expect,
        header: header,
      },
      headers = ['header'],
      tokenOptions = {
        searchDefaultTokenKeys: searchDefaultTokenKeys,
        headers: headers,
      };

    // describe('The normal use case for searchDefaultTokenKeys')
    itTxt = 'Test header=' + header + ' searchDefaultTokenKeys=' + searchDefaultTokenKeys + ' and expect ' + expect;
    it(itTxt, function(done) {
      testOptions['done'] = done;
      api.loopback.token.searchDefaultTokenKeys(testOptions, tokenOptions);
    });

    // describe('A test case for regression')
    searchDefaultTokenKeys = undefined;
    headers = [];
    itTxt = 'Test header=' + header + ' searchDefaultTokenKeys=' + searchDefaultTokenKeys + ' and expect ' + expect;
    it(itTxt, function(done) {
      testOptions['searchDefaultTokenKeys'] = undefined; //FIXME: is this a good way
      testOptions['headers'] = headers;
      testOptions['done'] = done;
      api.loopback.token.searchDefaultTokenKeys(testOptions, tokenOptions);
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
