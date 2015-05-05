var util = require('util'); 
var debug = require('debug')('AccessToken.defaultTokenKeys');
var createTestingToken = require('./app-access-token').createTestingToken;
var createTestAppAndRequest = require('./app-access-token').createTestAppAndRequest;

/*
The above means that the below means that the tests are tests with very little code
There was too much app in the previous test(s) which meant debug/test of an app in a test

The rather large files are now getting broken into managable sizes

Maybe now I have a chance :)
*/


describe('API:loopback.token(options)', function() {
  before(createTestingToken); // TODO make token only once instead of beforeEach is "better"
  describe('option defaultTokenKeys true or false', function(){
    describe('header authorization', function(){
      var
        get = '/',
        header = 'authorization';
      it('sets defaultTokenKeys=false, header contains token and expect 200', function(done) {
        var
          token = this.token.id, // TODO: where did that come from
          defaultTokenKeys = false,
          expect = 200,
          tokenOptions = {
            token: {
              headers: [header],
              defaultTokenKeys: defaultTokenKeys
            }
          };
        accessTokenApp.createTestAppAndRequest(this.token, tokenOptions, done)
          .get(get)
          .set(header, token)
          .expect(expect)
          .end(done);
      });
      
      it('sets defaultTokenKeys=true, header contains token and expect 200', function(done) {
        var
          defaultTokenKeys = true,
          expect = 200,
          token = this.token.id;
          tokenOptions = {
            token: {
              headers: [header],
              defaultTokenKeys: defaultTokenKeys
            }
          };
        createTestAppAndRequest(this.token, tokenOptions, done)
          .get(get)
          .set(header, token)
          .expect(expect)
          .end(done);
      });

      it('sets defaultTokenKeys=false with no alternatives and expect 401', function(done) {     
        var
          get = '/',
          defaultTokenKeys = false,
          expect = 401,
          header = 'authorization',
          token = this.token.id;
          tokenOptions = {
            token: {
              defaultTokenKeys: defaultTokenKeys
            }
          };
        createTestAppAndRequest(this.token, tokenOptions, done)
          .get(get)
          .set(header, token)
          .expect(expect)
          .end(done);
      });    
    });
  });
});