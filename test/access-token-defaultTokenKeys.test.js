var util = require('util'); 
var debug = require('debug')('AccessToken.test');
var accessTokenApp = require('./app-access-token'); 

describe('API:loopback.token(options)', function() {
  beforeEach(accessTokenApp.createTestingToken);
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