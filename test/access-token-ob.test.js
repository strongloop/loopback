var loopback = require('../');
var extend = require('util')._extend;
var util = require('util'); 
var debug = require('debug')('AccessToken.test'); 
var Token = loopback.AccessToken.extend('MyToken');
var ds = loopback.createDataSource({connector: loopback.Memory});
Token.attachTo(ds);
var ACL = loopback.ACL;

describe('API:loopback.token(options)', function() {
  beforeEach(createTestingToken);
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
        createTestAppAndRequest(this.token, tokenOptions, done)
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

function createTestingToken(done) { //TODO: why repeat for all tests ...?
  var test = this;
  Token.create({userId: '123'}, function(err, token) {
    if (err) return done(err);
    test.token = token;
    done();
  });
}

function createTestAppAndRequest(testToken, settings, done) {
  var app = createTestApp(testToken, settings, done);
  return request(app);
}

function createTestApp(testToken, settings, done) {
  done = arguments[arguments.length - 1]; // TODO: are these 3 lines "good"?
  if (settings == done) settings = {};
  settings = settings || {};
 
  var appSettings = settings.app || {}; 
  
  var modelSettings = settings.model || {}; 
  var modelOptions = {
    acls: [
      {
        principalType: 'ROLE',
        principalId: '$everyone',
        accessType: ACL.ALL,
        permission: ACL.DENY,
        property: 'deleteById'
      }
    ]
  };
  Object.keys(modelSettings).forEach(function(key) { modelOptions[key] = modelSettings[key];});
  
  var tokenSettings = {
    defaultTokenKeys : true,
    model: Token,
    currentUserLiteral: 'me'
  }; 

  var app = loopback();
  
  app.use(loopback.cookieParser('secret'));
  app.use(loopback.token(tokenSettings));

  app.get('/', function(req, res) {
    var send = '200';
    try { // TODO: this is a bad test for defaultTokenKey = false and no options for placement of token
      assert(req.accessToken, 'req should have accessToken'); // this fails the defaultTokenKeys=false test
      assert(req.accessToken.id === testToken.id);
    } catch (e) {
      debug('app.get e:'+e);
      send = '401'
    }
    debug('app.get send:'+send);
    res.send(send);
  });
  app.use(loopback.rest());
  app.enableAuth();

  Object.keys(appSettings).forEach(function(key) {app.set(key, appSettings[key]);});

  var TestModel = loopback.PersistedModel.extend('test', {}, modelOptions);
  TestModel.attachTo(loopback.memory());
  app.model(TestModel);

  return app;
}
