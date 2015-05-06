var loopback = require('../');
var extend = require('util')._extend;
var Token = loopback.AccessToken.extend('MyToken');
var ds = loopback.createDataSource({connector: loopback.Memory});
Token.attachTo(ds);
var ACL = loopback.ACL;

describe('loopback.token(options)', function() {
  beforeEach(createTestingToken);

  it('should populate req.token from the query string', function(done) {
    createTestAppAndRequest(this.token, done)
      .get('/?access_token=' + this.token.id)
      .expect(200)
      .end(done);
  });

  it('should populate req.token from an authorization header', function(done) {
    createTestAppAndRequest(this.token, done)
      .get('/')
      .set('authorization', this.token.id)
      .expect(200)
      .end(done);
  });

  it('should populate req.token from an X-Access-Token header', function(done) {
    createTestAppAndRequest(this.token, done)
      .get('/')
      .set('X-Access-Token', this.token.id)
      .expect(200)
      .end(done);
  });

  it('should populate req.token from an authorization header with bearer token', function(done) {
    var token = this.token.id;
    token = 'Bearer ' + new Buffer(token).toString('base64');
    createTestAppAndRequest(this.token, done)
      .get('/')
      .set('authorization', token)
      .expect(200)
      .end(done);
  });

  describe('populating req.toen from HTTP Basic Auth formatted authorization header', function() {
    it('parses "standalone-token"', function(done) {
      var token = this.token.id;
      token = 'Basic ' + new Buffer(token).toString('base64');
      createTestAppAndRequest(this.token, done)
        .get('/')
        .set('authorization', this.token.id)
        .expect(200)
        .end(done);
    });

    it('parses "token-and-empty-password:"', function(done) {
      var token = this.token.id + ':';
      token = 'Basic ' + new Buffer(token).toString('base64');
      createTestAppAndRequest(this.token, done)
        .get('/')
        .set('authorization', this.token.id)
        .expect(200)
        .end(done);
    });

    it('parses "ignored-user:token-is-password"', function(done) {
      var token = 'username:' + this.token.id;
      token = 'Basic ' + new Buffer(token).toString('base64');
      createTestAppAndRequest(this.token, done)
        .get('/')
        .set('authorization', this.token.id)
        .expect(200)
        .end(done);
    });

    it('parses "token-is-username:ignored-password"', function(done) {
      var token = this.token.id + ':password';
      token = 'Basic ' + new Buffer(token).toString('base64');
      createTestAppAndRequest(this.token, done)
        .get('/')
        .set('authorization', this.token.id)
        .expect(200)
        .end(done);
    });
  });

  it('should populate req.token from a secure cookie', function(done) {
    var app = createTestApp(this.token, done);

    request(app)
      .get('/token')
      .end(function(err, res) {
        request(app)
          .get('/')
          .set('Cookie', res.header['set-cookie'])
          .end(done);
      });
  });

  it('should populate req.token from a header or a secure cookie', function(done) {
    var app = createTestApp(this.token, done);
    var id = this.token.id;
    request(app)
      .get('/token')
      .end(function(err, res) {
        request(app)
          .get('/')
          .set('authorization', id)
          .set('Cookie', res.header['set-cookie'])
          .end(done);
      });
  });

  it('should rewrite url for the current user literal at the end without query',
    function(done) {
      var app = createTestApp(this.token, done);
      var id = this.token.id;
      var userId = this.token.userId;
      request(app)
        .get('/users/me')
        .set('authorization', id)
        .end(function(err, res) {
          assert(!err);
          assert.deepEqual(res.body, {userId: userId});
          done();
        });
    });

  it('should rewrite url for the current user literal at the end with query',
    function(done) {
      var app = createTestApp(this.token, done);
      var id = this.token.id;
      var userId = this.token.userId;
      request(app)
        .get('/users/me?state=1')
        .set('authorization', id)
        .end(function(err, res) {
          assert(!err);
          assert.deepEqual(res.body, {userId: userId, state: 1});
          done();
        });
    });

  it('should rewrite url for the current user literal in the middle',
    function(done) {
      var app = createTestApp(this.token, done);
      var id = this.token.id;
      var userId = this.token.userId;
      request(app)
        .get('/users/me/1')
        .set('authorization', id)
        .end(function(err, res) {
          assert(!err);
          assert.deepEqual(res.body, {userId: userId, state: 1});
          done();
        });
    });

  it('should skip when req.token is already present', function(done) {
    var tokenStub = { id: 'stub id' };
    app.use(function(req, res, next) {
      req.accessToken = tokenStub;
      next();
    });
    app.use(loopback.token({ model: Token }));
    app.get('/', function(req, res, next) {
      res.send(req.accessToken);
    });

    request(app).get('/')
      .set('Authorization', this.token.id)
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        expect(res.body).to.eql(tokenStub);
        done();
      });
  });
});

describe('AccessToken', function() {
  beforeEach(createTestingToken);

  it('should auto-generate id', function() {
    assert(this.token.id);
    assert.equal(this.token.id.length, 64);
  });

  it('should auto-generate created date', function() {
    assert(this.token.created);
    assert(Object.prototype.toString.call(this.token.created), '[object Date]');
  });

  it('should be validateable', function(done) {
    this.token.validate(function(err, isValid) {
      assert(isValid);
      done();
    });
  });

  describe('.findForRequest()', function() {
    beforeEach(createTestingToken);

    it('supports two-arg variant with no options', function(done) {
      var expectedTokenId = this.token.id;
      var req = mockRequest({
        headers: { 'authorization': expectedTokenId }
      });

      Token.findForRequest(req, function(err, token) {
        if (err) return done(err);
        expect(token.id).to.eql(expectedTokenId);
        done();
      });
    });

    function mockRequest(opts) {
      return extend(
        {
          method: 'GET',
          url: '/a-test-path',
          headers: {},
          _params: {},

          // express helpers
          param: function(name) { return this._params[name]; },
          header: function(name) { return this.headers[name]; }
        },
        opts);
    }
  });
});

describe('app.enableAuth()', function() {
  beforeEach(createTestingToken);

  it('prevents remote call with 401 status on denied ACL', function(done) {
    createTestAppAndRequest(this.token, done)
      .del('/tests/123')
      .expect(401)
      .set('authorization', this.token.id)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }
        var errorResponse = res.body.error;
        assert(errorResponse);
        assert.equal(errorResponse.code, 'AUTHORIZATION_REQUIRED');
        done();
      });
  });

  it('prevent remote call with app setting status on denied ACL', function(done) {
    createTestAppAndRequest(this.token, {app:{aclErrorStatus:403}}, done)
      .del('/tests/123')
      .expect(403)
      .set('authorization', this.token.id)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }
        var errorResponse = res.body.error;
        assert(errorResponse);
        assert.equal(errorResponse.code, 'ACCESS_DENIED');
        done();
      });
  });

  it('prevent remote call with app setting status on denied ACL', function(done) {
    createTestAppAndRequest(this.token, {model:{aclErrorStatus:404}}, done)
      .del('/tests/123')
      .expect(404)
      .set('authorization', this.token.id)
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

  it('prevent remote call if the accessToken is missing and required', function(done) {
    createTestAppAndRequest(null, done)
      .del('/tests/123')
      .expect(401)
      .set('authorization', null)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }
        var errorResponse = res.body.error;
        assert(errorResponse);
        assert.equal(errorResponse.code, 'AUTHORIZATION_REQUIRED');
        done();
      });
  });

  it('stores token in the context', function(done) {
    var TestModel = loopback.createModel('TestModel', { base: 'Model' });
    TestModel.getToken = function(cb) {
      cb(null, loopback.getCurrentContext().get('accessToken') || null);
    };
    TestModel.remoteMethod('getToken', {
      returns: { arg: 'token', type: 'object' },
      http: { verb: 'GET', path: '/token' }
    });

    var app = loopback();
    app.model(TestModel, { dataSource: null });

    app.enableAuth();
    app.use(loopback.context());
    app.use(loopback.token({ model: Token }));
    app.use(loopback.rest());

    var token = this.token;
    request(app)
      .get('/TestModels/token?_format=json')
      .set('authorization', token.id)
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) return done(err);
        expect(res.body.token.id).to.eql(token.id);
        done();
      });
  });
});

function createTestingToken(done) {
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
  done = arguments[arguments.length - 1];
  if (settings == done) settings = {};
  settings = settings || {};

  var appSettings = settings.app || {};
  var modelSettings = settings.model || {};

  var app = loopback();

  app.use(loopback.cookieParser('secret'));
  app.use(loopback.token({model: Token, currentUserLiteral: 'me'}));
  app.get('/token', function(req, res) {
    res.cookie('authorization', testToken.id, {signed: true});
    res.end();
  });
  app.get('/', function(req, res) {
    try {
      assert(req.accessToken, 'req should have accessToken');
      assert(req.accessToken.id === testToken.id);
    } catch (e) {
      return done(e);
    }
    res.send('ok');
  });
  app.use('/users/:uid', function(req, res) {
    var result = {userId: req.params.uid};
    if (req.query.state) {
      result.state = req.query.state;
    } else if (req.url !== '/') {
      result.state = req.url.substring(1);
    }
    res.status(200).send(result);
  });
  app.use(loopback.rest());
  app.enableAuth();

  Object.keys(appSettings).forEach(function(key) {
    app.set(key, appSettings[key]);
  });

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

  Object.keys(modelSettings).forEach(function(key) {
    modelOptions[key] = modelSettings[key];
  });

  var TestModel = loopback.PersistedModel.extend('test', {}, modelOptions);

  TestModel.attachTo(loopback.memory());
  app.model(TestModel);

  return app;
}
