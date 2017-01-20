// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var path = require('path');

describe('loopback.rest', function() {
  this.timeout(10000);
  var app, MyModel;

  beforeEach(function() {
    // override the global app object provided by test/support.js
    // and create a local one that does not share state with other tests
    app = loopback({ localRegistry: true, loadBuiltinModels: true });
    app.set('logoutSessionsOnSensitiveChanges', true);
    var db = app.dataSource('db', { connector: 'memory' });
    MyModel = app.registry.createModel('MyModel');
    MyModel.attachTo(db);
  });

  it('works out-of-the-box', function(done) {
    app.model(MyModel);
    app.use(loopback.rest());
    request(app).get('/mymodels')
      .expect(200)
      .end(done);
  });

  it('should report 200 for DELETE /:id found', function(done) {
    app.set('legacyExplorer', false);
    app.model(MyModel);
    app.use(loopback.rest());
    MyModel.create({name: 'm1'}, function(err, inst) {
      request(app)
        .del('/mymodels/' + inst.id)
        .expect(200, function(err, res) {
          expect(res.body.count).to.equal(1);

          done();
        });
    });
  });

  it('should report 404 for GET /:id not found', function(done) {
    app.model(MyModel);
    app.use(loopback.rest());
    request(app).get('/mymodels/1')
      .expect(404)
      .end(function(err, res) {
        if (err) return done(err);

        var errorResponse = res.body.error;
        assert(errorResponse);
        assert.equal(errorResponse.code, 'MODEL_NOT_FOUND');

        done();
      });
  });

  it('should report 404 for HEAD /:id not found', function(done) {
    app.model(MyModel);
    app.use(loopback.rest());
    request(app).head('/mymodels/1')
      .expect(404)
      .end(done);
  });

  it('should report 200 for GET /:id/exists not found', function(done) {
    app.model(MyModel);
    app.use(loopback.rest());
    request(app).get('/mymodels/1/exists')
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);

        expect(res.body).to.eql({ exists: false });

        done();
      });
  });

  it('should report 200 for GET /:id found', function(done) {
    app.model(MyModel);
    app.use(loopback.rest());
    MyModel.create({name: 'm1'}, function(err, inst) {
      request(app).get('/mymodels/' + inst.id)
        .expect(200)
        .end(done);
    });
  });

  it('should report 200 for HEAD /:id found', function(done) {
    app.model(MyModel);
    app.use(loopback.rest());
    MyModel.create({name: 'm2'}, function(err, inst) {
      request(app).head('/mymodels/' + inst.id)
        .expect(200)
        .end(done);
    });
  });

  it('should report 200 for GET /:id/exists found', function(done) {
    app.model(MyModel);
    app.use(loopback.rest());
    MyModel.create({name: 'm2'}, function(err, inst) {
      request(app).get('/mymodels/' + inst.id + '/exists')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);

          expect(res.body).to.eql({ exists: true });

          done();
        });
    });
  });

  it('should honour `remoting.rest.supportedTypes`', function(done) {
    var app = loopback({ localRegistry: true });

    // NOTE it is crucial to set `remoting` before creating any models
    var supportedTypes = ['json', 'application/javascript', 'text/javascript'];
    app.set('remoting', { rest: { supportedTypes: supportedTypes } });

    app.model(MyModel);
    app.use(loopback.rest());

    request(app).get('/mymodels')
      .set('Accept', 'text/html,application/xml;q= 0.9,*/*;q= 0.8')
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect(200, done);
  });

  it('allows models to provide a custom HTTP path', function(done) {
    var CustomModel = app.registry.createModel('CustomModel',
      { name: String },
      { http: { 'path': 'domain1/CustomModelPath' }
    });

    app.model(CustomModel, { dataSource: 'db' });
    app.use(loopback.rest());

    request(app).get('/domain1/CustomModelPath').expect(200).end(done);
  });

  it('should report 200 for url-encoded HTTP path', function(done) {
    var CustomModel = app.registry.createModel('CustomModel',
      { name: String },
      { http: { path: 'domain%20one/CustomModelPath' }
    });

    app.model(CustomModel, { dataSource: 'db' });
    app.use(loopback.rest());

    request(app).get('/domain%20one/CustomModelPath').expect(200).end(done);
  });

  it('includes loopback.token when necessary', function(done) {
    givenUserModelWithAuth();
    app.enableAuth({ dataSource: 'db' });
    app.use(loopback.rest());

    givenLoggedInUser(function(err, token) {
      if (err) return done(err);
      expect(token).instanceOf(app.models.AccessToken);
      request(app).get('/users/' + token.userId)
        .set('Authorization', token.id)
        .expect(200)
        .end(done);
    }, done);
  });

  it('does not include loopback.token when auth not enabled', function(done) {
    var User = givenUserModelWithAuth();
    User.getToken = function(req, cb) {
      cb(null, req.accessToken ? req.accessToken.id : null);
    };
    loopback.remoteMethod(User.getToken, {
      accepts: [{ type: 'object', http: { source: 'req' } }],
      returns: [{ type: 'object', name: 'id' }]
    });

    app.use(loopback.rest());
    givenLoggedInUser(function(err, token) {
      if (err) return done(err);

      request(app).get('/users/getToken')
        .set('Authorization', token.id)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);

          expect(res.body.id).to.equal(null);

          done();
        });
    }, done);
  });

  it('should report 200 for legacy explorer route /routes', function(done) {
    app.use(loopback.rest());
    request(app).get('/routes')
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);

        expect(res.body).to.eql([]);

        done();
      });
  });

  it('should report 200 for legacy explorer route /models', function(done) {
    app.use(loopback.rest());
    request(app).get('/models')
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);

        expect(res.body).to.eql({});

        done();
      });
  });

  it('should report 404 for disabled legacy explorer route /routes', function(done) {
    app.set('legacyExplorer', false);
    app.use(loopback.rest());
    request(app).get('/routes')
      .expect(404)
      .end(done);
  });

  it('should report 404 for disabled legacy explorer route /models', function(done) {
    app.set('legacyExplorer', false);
    app.use(loopback.rest());
    request(app).get('/models')
      .expect(404)
      .end(done);
  });

  describe('context propagation', function() {
    var User;

    beforeEach(function() {
      User = givenUserModelWithAuth();
      User.getToken = function(cb) {
        var context = loopback.getCurrentContext();
        var req = context.get('http').req;
        expect(req).to.have.property('accessToken');

        var juggler = require('loopback-datasource-juggler');
        expect(juggler.getCurrentContext().get('http').req)
          .to.have.property('accessToken');

        var remoting = require('strong-remoting');
        expect(remoting.getCurrentContext().get('http').req)
          .to.have.property('accessToken');

        cb(null, req && req.accessToken ? req.accessToken.id : null);
      };
      // Set up the ACL
      User.settings.acls.push({principalType: 'ROLE',
        principalId: '$authenticated', permission: 'ALLOW',
        property: 'getToken'});

      loopback.remoteMethod(User.getToken, {
        accepts: [],
        returns: [
          { type: 'object', name: 'id' }
        ]
      });
    });

    function invokeGetToken(done) {
      givenLoggedInUser(function(err, token) {
        if (err) return done(err);

        request(app).get('/users/getToken')
          .set('Authorization', token.id)
          .expect(200)
          .end(function(err, res) {
            if (err) return done(err);

            expect(res.body.id).to.equal(token.id);

            done();
          });
      });
    }

    it('should enable context using loopback.context', function(done) {
      app.use(loopback.context({ enableHttpContext: true }));
      app.enableAuth({ dataSource: 'db' });
      app.use(loopback.rest());

      invokeGetToken(done);
    });

    it('should enable context with loopback.rest', function(done) {
      app.enableAuth({ dataSource: 'db' });
      app.set('remoting', { context: { enableHttpContext: true }});
      app.use(loopback.rest());

      invokeGetToken(done);
    });

    it('should support explicit context', function(done) {
      app.enableAuth({ dataSource: 'db' });
      app.use(loopback.context());
      app.use(loopback.token(
        { model: app.registry.getModelByType('AccessToken') }));
      app.use(function(req, res, next) {
        loopback.getCurrentContext().set('accessToken', req.accessToken);

        next();
      });
      app.use(loopback.rest());

      User.getToken = function(cb) {
        var context = loopback.getCurrentContext();
        var accessToken = context.get('accessToken');
        expect(context.get('accessToken')).to.have.property('id');

        var juggler = require('loopback-datasource-juggler');
        context = juggler.getCurrentContext();
        expect(context.get('accessToken')).to.have.property('id');

        var remoting = require('strong-remoting');
        context = remoting.getCurrentContext();
        expect(context.get('accessToken')).to.have.property('id');

        cb(null, accessToken ? accessToken.id : null);
      };

      loopback.remoteMethod(User.getToken, {
        accepts: [],
        returns: [
          { type: 'object', name: 'id' }
        ]
      });

      invokeGetToken(done);
    });
  });

  function givenUserModelWithAuth() {
    var AccessToken = app.registry.getModel('AccessToken');
    app.model(AccessToken, { dataSource: 'db' });
    var User = app.registry.getModel('User');
    app.model(User, { dataSource: 'db' });

    // NOTE(bajtos) This is puzzling to me. The built-in User & AccessToken
    // models should come with both relations already set up, i.e. the
    // following two lines should not be neccessary.
    // And it does behave that way when only tests in this file are run.
    // However, when I run the full test suite (all files), the relations
    // get broken.
    AccessToken.belongsTo(User, { as: 'user', foreignKey: 'userId' });
    User.hasMany(AccessToken, { as: 'accessTokens', foreignKey: 'userId' });

    return User;
  }

  function givenLoggedInUser(cb, done) {
    var credentials = { email: 'user@example.com', password: 'pwd' };
    var User = app.models.User;
    User.create(credentials,
      function(err, user) {
        if (err) return done(err);

        User.login(credentials, cb);
      });
  }

  describe('shared methods', function() {
    function getFixturePath(dirName) {
      return path.join(__dirname, 'fixtures/shared-methods/' + dirName +
          '/server/server.js');
    }

    describe('with specific definitions in model-config.json', function() {
      it('should not be exposed when the definition value is false',
          function(done) {
        var app = require(getFixturePath('model-config-defined-false'));
        request(app)
          .get('/todos')
          .expect(404, done);
      });

      it('should be exposed when the definition value is true', function(done) {
        var app = require(getFixturePath('model-config-defined-true'));
        request(app)
          .get('/todos')
          .expect(200, done);
      });
    });

    describe('with default definitions in model-config.json', function() {
      it('should not be exposed when the definition value is false',
          function(done) {
        var app = require(getFixturePath('model-config-default-false'));
        request(app)
          .get('/todos')
          .expect(404, done);
      });

      it('should be exposed when the definition value is true', function(done) {
        var app = require(getFixturePath('model-config-default-true'));
        app.models.Todo.create([
          {content: 'a'},
          {content: 'b'},
          {content: 'c'}
        ], function() {
          request(app)
            .del('/todos')
            .expect(200)
            .end(function(err, res) {
              if (err) return done(err);

              expect(res.body.count).to.equal(3);

              done();
            });
        });
      });
    });

    describe('with specific definitions in config.json', function() {
      it('should not be exposed when the definition value is false',
          function(done) {
        var app = require(getFixturePath('config-defined-false'));
        request(app)
          .get('/todos')
          .expect(404, done);
      });

      it('should be exposed when the definition value is true',
          function(done) {
        var app = require(getFixturePath('config-defined-true'));
        request(app)
          .get('/todos')
          .expect(200, done);
      });
    });

    describe('with default definitions in config.json', function() {
      it('should not be exposed when the definition value is false',
          function(done) {
        var app = require(getFixturePath('config-default-false'));
        request(app)
          .get('/todos')
          .expect(404, done);
      });

      it('should be exposed when the definition value is true', function(done) {
        var app = require(getFixturePath('config-default-true'));
        app.models.Todo.create([
          {content: 'a'},
          {content: 'b'},
          {content: 'c'}
        ], function() {
          request(app)
            .del('/todos')
            .expect(200)
            .end(function(err, res) {
              if (err) return done(err);

              expect(res.body.count).to.equal(3);

              done();
            });
        });
      });
    });

    // The fixture in `shared-method/both-configs-set/config.json` has `*:false`
    // set which disables the REST endpoints for built-in models such as User as
    // a side effect since tests share the same loopback instance. As a
    // consequence, this causes the tests in user.integration to fail.
    describe.skip('with definitions in both config.json and model-config.json',
        function() {
      it('should prioritize the settings in model-config.json', function(done) {
        var app = require(getFixturePath('both-configs-set'));
        request(app)
          .del('/todos')
          .expect(404, done);
      });

      it('should fall back to config.json settings if setting is not found in' +
          'model-config.json', function(done) {
        var app = require(getFixturePath('both-configs-set'));
        request(app)
          .get('/todos')
          .expect(404, done);
      });
    });
  });
});
