var loopback = require(('../'));
var assert = require('assert');
var ApplicationCredential = loopback.ApplicationCredential;

var Application = loopback.Application;

before(function (done) {
  Application.destroyAll(done);
});

describe('ApplicationCredential', function () {
  var appId = null;
  before(function (done) {
    var ds = loopback.createDataSource({
      connector: 'memory'
    });

    ApplicationCredential.attachTo(ds);
    Application.attachTo(ds);
    ApplicationCredential.belongsTo(Application, {foreignKey: 'appId'});

    Application.create({
      name: 'MyApp'
    }, function (err, app) {
      appId = app.id;
      done(err);
    });
  });

  it('supports linked 3rd party accounts', function (done) {
    ApplicationCredential.link(appId, 'facebook', 'oAuth 2.0', {
        clientID: 'facebook-client-id-1',
        clientSecret: 'facebook-client-secret-1',
        callbackURL: 'http://localhost:3000/auth/facebook/callback'},
      function (err, cred) {
        assert(!err, 'No error should be reported');

        assert.equal(cred.provider, 'facebook');
        assert.equal(cred.authScheme, 'oAuth 2.0');
        assert.deepEqual(cred.credentials, {
          clientID: 'facebook-client-id-1',
          clientSecret: 'facebook-client-secret-1',
          callbackURL: 'http://localhost:3000/auth/facebook/callback'});

        assert.equal(appId, cred.appId);

        // Follow the belongsTo relation
        cred.application(function (err, app) {
          assert(!err, 'No error should be reported');
          assert.equal(app.name, 'MyApp');
          done();
        });
      });
  });

  it('supports linked 3rd party accounts if exists', function (done) {
    ApplicationCredential.create({
      provider: 'facebook',
      authScheme: 'oAuth 2.0',
      appId: appId,
      credentials: {
        clientID: 'facebook-client-id-1',
        clientSecret: 'facebook-client-secret-1',
        callbackURL: 'http://localhost:3000/auth/facebook/callback'}
    }, function (err, cred) {
      ApplicationCredential.link(appId, 'facebook', 'oAuth 2.0', {
        clientID: 'facebook-client-id-1',
        clientSecret: 'facebook-client-secret-2',
        callbackURL: 'http://localhost:3000/auth/facebook/callback'}, function (err, cred) {
        assert(!err, 'No error should be reported');

        assert.equal(cred.provider, 'facebook');
        assert.equal(cred.authScheme, 'oAuth 2.0');
        assert.deepEqual(cred.credentials, {
          clientID: 'facebook-client-id-1',
          clientSecret: 'facebook-client-secret-2',
          callbackURL: 'http://localhost:3000/auth/facebook/callback'});

        assert.equal(appId, cred.appId);
        // Follow the belongsTo relation
        cred.application(function (err, app) {
          assert(!err, 'No error should be reported');
          assert.equal(app.name, 'MyApp');
          assert.equal(app.id, appId);
          done();
        });
      });
    });
  });

});

