'use strict';
var debug = require('debug')('loopback.token');
var inspect = require('util').inspect;
/*
* API::middleware::loopback.token:searchDefaultTokenKeys
*/
var SEARCHDEFAULTKEYS_LIB = './lib/lib-loopback-token-searchDefaultTokenKeys';
var test = require(SEARCHDEFAULTKEYS_LIB);

describe('AccessToken api::middleware:loopback.token:searchDefaultTokenKeys:[true|false]', function() {
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
    test.lib.loopback.token.searchDefaultTokenKeys(testOptions, tokenOptions);
  });

  // describe('Specific enabelment of searchDefaultTokenKeys')
  searchDefaultTokenKeys = true;
  headers = [];
  itTxt = 'Test header=' + header + ' searchDefaultTokenKeys=' + searchDefaultTokenKeys + ' and expect ' + expect;
  it(itTxt, function(done) {
    testOptions['done'] = done;
    testOptions['headers'] = headers;
    test.lib.loopback.token.searchDefaultTokenKeys(testOptions, tokenOptions);
  });

  // describe('A test case for regression')
  searchDefaultTokenKeys = undefined;
  headers = [];
  itTxt = 'Test header=' + header + ' searchDefaultTokenKeys=' + searchDefaultTokenKeys + ' and expect ' + expect;
  it(itTxt, function(done) {
    testOptions['searchDefaultTokenKeys'] = undefined; //FIXME: is this a good way
    testOptions['headers'] = headers;
    testOptions['done'] = done;
    test.lib.loopback.token.searchDefaultTokenKeys(testOptions, tokenOptions);
  });

  // describe('A non-normal use case to check that default token headers are not used')
  searchDefaultTokenKeys = false; // any defaults are not concated ...
  headers = []; // ... and the empty array for token areas ...
  expect = 401; // ... gives the expected result.
  itTxt = 'Test header=' + header + ' searchDefaultTokenKeys=' + searchDefaultTokenKeys + ' no headers and expect ' + expect;
  it(itTxt, function(done) {
    testOptions['done'] = done;
    testOptions['searchDefaultTokenKeys'] = searchDefaultTokenKeys;
    testOptions['expect'] = expect;
    testOptions['headers'] = headers;
    test.lib.loopback.token.searchDefaultTokenKeys(testOptions, tokenOptions);
  });
});
