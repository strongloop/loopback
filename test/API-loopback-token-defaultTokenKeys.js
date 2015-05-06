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
        defaultTokenKeys: require('./TEST-loopback-token-defaultTokenKeys').api.loopback.token.defaultTokenKeys
      }
    }
  }

describe('API:Middleware:loopback.token(options)', function() {
  describe('options.defaultTokenKeys: [true|false]', function(){    
    var
      itTxt,
      expect = 200,
      defaultTokenKeys = false,
      header = 'authorization',
      testOptions = {
        expect: expect,
        header: header,
      },
      headers = ['header'],
      tokenOptions = {
        defaultTokenKeys: defaultTokenKeys,
        headers: headers,
      };
      
    // describe('The normal use case for defaultTokenKeys')
    itTxt = 'Test header='+header+' defaultTokenKeys='+defaultTokenKeys+' and expect '+expect; 
    it( itTxt, function(done) {
      testOptions['done'] = done;
      api.loopback.token.defaultTokenKeys(testOptions, tokenOptions);
    });

    // describe('A test case for regression')
    defaultTokenKeys = undefined;
    headers = [];
    itTxt = 'Test header='+header+' defaultTokenKeys='+defaultTokenKeys+' and expect '+expect;
    it(itTxt, function(done) {
      testOptions['defaultTokenKeys'] = undefined; //FIXME: is this a good way
      testOptions['headers'] = headers;
      testOptions['done'] = done;
      api.loopback.token.defaultTokenKeys(testOptions, tokenOptions);
    });
    
    // describe('A non-normal use case to check that default token headers are not used')
    defaultTokenKeys = false; // any defaults ...
    headers = []; // ... are not concated, and the empty array for token areas ...
    expect = 401; // ... gives the expected result.
    /*
    * FIXME: But the try catch in the appGet is not the test needed
    */
    itTxt = 'Test header='+header+' defaultTokenKeys='+defaultTokenKeys+' no headers and expect '+expect;
    it(itTxt, function(done) {
      testOptions['done'] = done;
      testOptions['defaultTokenKeys'] = defaultTokenKeys;
      testOptions['expect'] = expect;
      testOptions['headers'] = headers;
      api.loopback.token.defaultTokenKeys(testOptions, tokenOptions);
    });
  });
});