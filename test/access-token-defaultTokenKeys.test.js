'use strict';
/*
* API:loopback.token(options)
* - test options.defaultTokenKeys: [true|false|undefined]
*/ 
var 
  debug = require('debug')('AccessToken.test'),
  inspect = require('util').inspect; 

var
  createTokenId = require('./app-access-token').createTokenId,
  createAppAndRequest = require('./app-access-token').createAppAndRequest;

before(createTokenId); //NOTE: not beforeEach :: side effects?
  
describe('API:loopback.token(options)', function() {
  describe('option defaultTokenKeys true or false', function(){
    describe('header authorization', function(){
      var
        get = '/',
        header = 'authorization';

      it('sets defaultTokenKeys=false, header contains token and expect 200', function(done) {
        var
          defaultTokenKeys = false,
          expect = 200,
          tokenOptions = {
            token: {
              headers: [header],
              defaultTokenKeys: defaultTokenKeys
            }
          };
        createAppAndRequest(this.tokenId, tokenOptions, done) // FIXME: I hate this
          .get(get)
          .set(header, this.tokenId)
          .expect(expect)
          .end(done);
      });
      
      it('sets defaultTokenKeys=true, header contains token and expect 200', function(done) {
        var
          defaultTokenKeys = true,
          expect = 200,
          tokenOptions = {
            token: {
              headers: [header],
              defaultTokenKeys: defaultTokenKeys
            }
          };
        createAppAndRequest(this.tokenId, tokenOptions, done)
          .get(get)
          .set(header, this.tokenId)
          .expect(expect)
          .end(done);
      });

      it('sets defaultTokenKeys=false with no alternatives and expect 401', function(done) {     
        // FIXME: the original master get route in the original test does not support this.
        var
          get = '/',
          defaultTokenKeys = false,
          expect = 401,
          header = 'authorization',
          tokenOptions = {
            token: {
              defaultTokenKeys: defaultTokenKeys
            }
          };
        createAppAndRequest(this.tokenId, tokenOptions, done)
          .get(get)
          .set(header, this.tokenId)
          .expect(expect)
          .end(done);
      });    
    });
  });
});