var loopback = require('../');
var extend = require('util')._extend;
var util = require('util'); 
var debug = require('debug')('AccessToken.test'); 
var Token = loopback.AccessToken.extend('MyToken');
var ds = loopback.createDataSource({connector: loopback.Memory});
Token.attachTo(ds);
var ACL = loopback.ACL;


module.exports = function createTestingToken(done) { //TODO: why repeat for all tests ...?
  var test = this;
  Token.create({userId: '123'}, function(err, token) {
    if (err) return done(err);
    test.token = token;
    done();
  });
}

module.exports = function createTestAppAndRequest(testToken, settings, done) {
  var app = createTestApp(testToken, settings, done);
  return request(app);
}

module.exports = function createTestApp(testToken, settings, done) {
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
