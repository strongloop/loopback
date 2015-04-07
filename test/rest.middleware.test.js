describe('loopback.rest', function() {
  var MyModel;
  beforeEach(function() {
    var ds = app.dataSource('db', { connector: loopback.Memory });
    MyModel = ds.createModel('MyModel', {name: String});
    loopback.autoAttach();
  });

  it('works out-of-the-box', function(done) {
    app.model(MyModel);
    app.use(loopback.rest());
    request(app).get('/mymodels')
      .expect(200)
      .end(done);
  });

  it('should report 404 for GET /:id not found', function(done) {
    app.model(MyModel);
    app.use(loopback.rest());
    request(app).get('/mymodels/1')
      .expect(404)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }
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
        expect(res.body).to.eql({exists: false});
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
          expect(res.body).to.eql({exists: true});
          done();
        });
    });
  });

  it('should honour `remoting.rest.supportedTypes`', function(done) {
    var app = loopback();

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
    var ds = app.dataSource('db', { connector: loopback.Memory });
    var CustomModel = ds.createModel('CustomModel',
      { name: String },
      { http: { 'path': 'domain1/CustomModelPath' }
    });

    app.model(CustomModel);
    app.use(loopback.rest());

    request(app).get('/domain1/CustomModelPath').expect(200).end(done);
  });

  it('should report 200 for url-encoded HTTP path', function(done) {
    var ds = app.dataSource('db', { connector: loopback.Memory });
    var CustomModel = ds.createModel('CustomModel',
      { name: String },
      { http: { path: 'domain%20one/CustomModelPath' }
    });

    app.model(CustomModel);
    app.use(loopback.rest());

    request(app).get('/domain%20one/CustomModelPath').expect(200).end(done);
  });

  it('includes loopback.token when necessary', function(done) {
    givenUserModelWithAuth();
    app.enableAuth();
    app.use(loopback.rest());

    givenLoggedInUser(function(err, token) {
      if (err) return done(err);
      expect(token).instanceOf(app.models.accessToken);
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
      app.enableAuth();
      app.use(loopback.rest());

      invokeGetToken(done);
    });

    it('should enable context with loopback.rest', function(done) {
      app.enableAuth();
      app.set('remoting', { context: { enableHttpContext: true } });
      app.use(loopback.rest());

      invokeGetToken(done);
    });

    it('should support explicit context', function(done) {
      app.enableAuth();
      app.use(loopback.context());
      app.use(loopback.token(
        { model: loopback.getModelByType(loopback.AccessToken) }));
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
    // NOTE(bajtos) It is important to create a custom AccessToken model here,
    // in order to overwrite the entry created by previous tests in
    // the global model registry
    app.model('accessToken', {
      options: {
        base: 'AccessToken'
      },
      dataSource: 'db'
    });
    return app.model('user', {
      options: {
        base: 'User',
        relations: {
          accessTokens: {
            model: 'accessToken',
            type: 'hasMany',
            foreignKey: 'userId'
          }
        }
      },
      dataSource: 'db'
    });
  }
  function givenLoggedInUser(cb, done) {
    var credentials = { email: 'user@example.com', password: 'pwd' };
    var User = app.models.user;
    User.create(credentials,
      function(err, user) {
        if (err) return done(err);
        User.login(credentials, cb);
      });
  }
});
