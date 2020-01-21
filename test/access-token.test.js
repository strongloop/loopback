// Copyright IBM Corp. 2013,2019. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
const assert = require('assert');
const expect = require('./helpers/expect');
const cookieParser = require('cookie-parser');
const LoopBackContext = require('loopback-context');
const contextMiddleware = require('loopback-context').perRequest;
const loopback = require('../');
const extend = require('util')._extend;
const session = require('express-session');
const request = require('supertest');

let Token, ACL, User, TestModel;

describe('loopback.token(options)', function() {
  let app;
  beforeEach(function(done) {
    app = loopback({localRegistry: true, loadBuiltinModels: true});
    app.dataSource('db', {connector: 'memory'});

    ACL = app.registry.getModel('ACL');
    app.model(ACL, {dataSource: 'db'});

    User = app.registry.getModel('User');
    app.model(User, {dataSource: 'db'});

    Token = app.registry.createModel({
      name: 'MyToken',
      base: 'AccessToken',
    });
    app.model(Token, {dataSource: 'db'});

    TestModel = app.registry.createModel({
      name: 'TestModel',
      base: 'Model',
    });
    TestModel.getToken = function(options, cb) {
      cb(null, options && options.accessToken || null);
    };
    TestModel.remoteMethod('getToken', {
      accepts: {arg: 'options', type: 'object', http: 'optionsFromRequest'},
      returns: {arg: 'token', type: 'object'},
      http: {verb: 'GET', path: '/token'},
    });
    app.model(TestModel, {dataSource: 'db'});

    createTestingToken.call(this, done);
  });

  it('defaults to built-in AccessToken model', function() {
    const BuiltInToken = app.registry.getModel('AccessToken');
    app.model(BuiltInToken, {dataSource: 'db'});

    app.enableAuth({dataSource: 'db'});
    app.use(loopback.token());
    app.use(loopback.rest());

    return BuiltInToken.create({userId: 123}).then(function(token) {
      return request(app)
        .get('/TestModels/token?_format=json')
        .set('authorization', token.id)
        .expect(200)
        .expect('Content-Type', /json/)
        .then(res => {
          expect(res.body.token.id).to.eql(token.id);
        });
    });
  });

  it('uses correct custom AccessToken model from model class param', function() {
    User.hasMany(Token, {
      as: 'accessTokens',
      options: {disableInclude: true},
    });

    app.enableAuth();
    app.use(loopback.token({model: Token}));
    app.use(loopback.rest());

    return Token.create({userId: 123}).then(function(token) {
      return request(app)
        .get('/TestModels/token?_format=json')
        .set('authorization', token.id)
        .expect(200)
        .expect('Content-Type', /json/)
        .then(res => {
          expect(res.body.token.id).to.eql(token.id);
        });
    });
  });

  it('uses correct custom AccessToken model from string param', function() {
    User.hasMany(Token, {
      as: 'accessTokens',
      options: {disableInclude: true},
    });

    app.enableAuth();
    app.use(loopback.token({model: Token.modelName}));
    app.use(loopback.rest());

    return Token.create({userId: 123}).then(function(token) {
      return request(app)
        .get('/TestModels/token?_format=json')
        .set('authorization', token.id)
        .expect(200)
        .expect('Content-Type', /json/)
        .then(res => {
          expect(res.body.token.id).to.eql(token.id);
        });
    });
  });

  it('populates req.token from the query string', function(done) {
    createTestAppAndRequest(this.token, done)
      .get('/?access_token=' + this.token.id)
      .expect(200)
      .end(done);
  });

  it('populates req.token from an authorization header', function(done) {
    createTestAppAndRequest(this.token, done)
      .get('/')
      .set('authorization', this.token.id)
      .expect(200)
      .end(done);
  });

  it('populates req.token from an X-Access-Token header', function(done) {
    createTestAppAndRequest(this.token, done)
      .get('/')
      .set('X-Access-Token', this.token.id)
      .expect(200)
      .end(done);
  });

  it('does not search default keys when searchDefaultTokenKeys is false',
    function(done) {
      const tokenId = this.token.id;
      const app = createTestApp(
        this.token,
        {token: {searchDefaultTokenKeys: false}},
        done,
      );
      const agent = request.agent(app);

      // Set the token cookie
      agent.get('/token').expect(200).end(function(err, res) {
        if (err) return done(err);

        // Make a request that sets the token in all places searched by default
        agent.get('/check-access?access_token=' + tokenId)
          .set('X-Access-Token', tokenId)
          .set('authorization', tokenId)
        // Expect 401 because there is no (non-default) place configured where
        // the middleware should load the token from
          .expect(401)
          .end(done);
      });
    });

  it('populates req.token from an authorization header with bearer token with base64',
    function(done) {
      let token = this.token.id;
      token = 'Bearer ' + new Buffer(token).toString('base64');
      createTestAppAndRequest(this.token, done)
        .get('/')
        .set('authorization', token)
        .expect(200)
        .end(done);
    });

  it('populates req.token from an authorization header with bearer token', function(done) {
    let token = this.token.id;
    token = 'Bearer ' + token;
    createTestAppAndRequest(this.token, {token: {bearerTokenBase64Encoded: false}}, done)
      .get('/')
      .set('authorization', token)
      .expect(200)
      .end(done);
  });

  describe('populating req.token from HTTP Basic Auth formatted authorization header', function() {
    it('parses "standalone-token"', function(done) {
      let token = this.token.id;
      token = 'Basic ' + new Buffer(token).toString('base64');
      createTestAppAndRequest(this.token, done)
        .get('/')
        .set('authorization', this.token.id)
        .expect(200)
        .end(done);
    });

    it('parses "token-and-empty-password:"', function(done) {
      let token = this.token.id + ':';
      token = 'Basic ' + new Buffer(token).toString('base64');
      createTestAppAndRequest(this.token, done)
        .get('/')
        .set('authorization', this.token.id)
        .expect(200)
        .end(done);
    });

    it('parses "ignored-user:token-is-password"', function(done) {
      let token = 'username:' + this.token.id;
      token = 'Basic ' + new Buffer(token).toString('base64');
      createTestAppAndRequest(this.token, done)
        .get('/')
        .set('authorization', this.token.id)
        .expect(200)
        .end(done);
    });

    it('parses "token-is-username:ignored-password"', function(done) {
      let token = this.token.id + ':password';
      token = 'Basic ' + new Buffer(token).toString('base64');
      createTestAppAndRequest(this.token, done)
        .get('/')
        .set('authorization', this.token.id)
        .expect(200)
        .end(done);
    });
  });

  it('populates req.token from a secure cookie', function(done) {
    const app = createTestApp(this.token, done);

    request(app)
      .get('/token')
      .end(function(err, res) {
        request(app)
          .get('/')
          .set('Cookie', res.header['set-cookie'])
          .end(done);
      });
  });

  it('populates req.token from a header or a secure cookie', function(done) {
    const app = createTestApp(this.token, done);
    const id = this.token.id;
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

  it('rewrites url for the current user literal at the end without query',
    function(done) {
      const app = createTestApp(this.token, done);
      const id = this.token.id;
      const userId = this.token.userId;
      request(app)
        .get('/users/me')
        .set('authorization', id)
        .end(function(err, res) {
          assert(!err);
          assert.deepEqual(res.body, {userId: userId});

          done();
        });
    });

  it('rewrites url for the current user literal at the end with query',
    function(done) {
      const app = createTestApp(this.token, done);
      const id = this.token.id;
      const userId = this.token.userId;
      request(app)
        .get('/users/me?state=1')
        .set('authorization', id)
        .end(function(err, res) {
          assert(!err);
          assert.deepEqual(res.body, {userId: userId, state: 1});

          done();
        });
    });

  it('rewrites url for the current user literal in the middle',
    function(done) {
      const app = createTestApp(this.token, done);
      const id = this.token.id;
      const userId = this.token.userId;
      request(app)
        .get('/users/me/1')
        .set('authorization', id)
        .end(function(err, res) {
          assert(!err);
          assert.deepEqual(res.body, {userId: userId, state: 1});

          done();
        });
    });

  it('generates a 401 on a current user literal route without an authToken',
    function(done) {
      const app = createTestApp(null, done);
      request(app)
        .get('/users/me')
        .set('authorization', null)
        .expect(401)
        .end(done);
    });

  it('generates a 401 on a current user literal route with empty authToken',
    function(done) {
      const app = createTestApp(null, done);
      request(app)
        .get('/users/me')
        .set('authorization', '')
        .expect(401)
        .end(done);
    });

  it('generates a 401 on a current user literal route with invalid authToken',
    function(done) {
      const app = createTestApp(this.token, done);
      request(app)
        .get('/users/me')
        .set('Authorization', 'invald-token-id')
        .expect(401)
        .end(done);
    });

  it('skips when req.token is already present', function(done) {
    const tokenStub = {id: 'stub id'};
    app.use(function(req, res, next) {
      req.accessToken = tokenStub;

      next();
    });
    app.use(loopback.token({model: Token}));
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

  describe('loading multiple instances of token middleware', function() {
    it('skips when req.token is already present and no further options are set',
      function(done) {
        const tokenStub = {id: 'stub id'};
        app.use(function(req, res, next) {
          req.accessToken = tokenStub;

          next();
        });
        app.use(loopback.token({model: Token}));
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

    it('does not overwrite valid existing token (has "id" property) ' +
      ' when overwriteExistingToken is falsy',
    function(done) {
      const tokenStub = {id: 'stub id'};
      app.use(function(req, res, next) {
        req.accessToken = tokenStub;

        next();
      });
      app.use(loopback.token({
        model: Token,
        enableDoublecheck: true,
      }));
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

    it('overwrites invalid existing token (is !== undefined and has no "id" property) ' +
      ' when enableDoublecheck is true',
    function(done) {
      const token = this.token;
      app.use(function(req, res, next) {
        req.accessToken = null;
        next();
      });

      app.use(loopback.token({
        model: Token,
        enableDoublecheck: true,
      }));

      app.get('/', function(req, res, next) {
        res.send(req.accessToken);
      });

      request(app).get('/')
        .set('Authorization', token.id)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.body).to.eql({
            id: token.id,
            ttl: token.ttl,
            userId: token.userId,
            created: token.created.toJSON(),
          });
          done();
        });
    });

    it('overwrites existing token when enableDoublecheck ' +
      'and overwriteExistingToken options are truthy',
    function(done) {
      const token = this.token;
      const tokenStub = {id: 'stub id'};
      app.use(function(req, res, next) {
        req.accessToken = tokenStub;

        next();
      });
      app.use(loopback.token({
        model: Token,
        enableDoublecheck: true,
        overwriteExistingToken: true,
      }));
      app.get('/', function(req, res, next) {
        res.send(req.accessToken);
      });

      request(app).get('/')
        .set('Authorization', token.id)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);

          expect(res.body).to.eql({
            id: token.id,
            ttl: token.ttl,
            userId: token.userId,
            created: token.created.toJSON(),
          });

          done();
        });
    });
  });
});

describe('AccessToken', function() {
  beforeEach(createTestingToken);

  it('has getIdForRequest method', function() {
    expect(typeof Token.getIdForRequest).to.eql('function');
  });

  it('has resolve method', function() {
    expect(typeof Token.resolve).to.eql('function');
  });

  it('generates id automatically', function() {
    assert(this.token.id);
    assert.equal(this.token.id.length, 64);
  });

  it('generates created date automatically', function() {
    assert(this.token.created);
    assert(Object.prototype.toString.call(this.token.created), '[object Date]');
  });

  describe('.validate()', function() {
    it('accepts valid tokens', function(done) {
      this.token.validate(function(err, isValid) {
        assert(isValid);
        done();
      });
    });

    it('rejects eternal TTL by default', function(done) {
      this.token.ttl = -1;
      this.token.validate(function(err, isValid) {
        if (err) return done(err);
        expect(isValid, 'isValid').to.equal(false);
        done();
      });
    });

    it('allows eternal tokens when enabled by User.allowEternalTokens',
      function(done) {
        const Token = givenLocalTokenModel();

        // Overwrite User settings - enable eternal tokens
        Token.app.models.User.settings.allowEternalTokens = true;

        Token.create({userId: '123', ttl: -1}, function(err, token) {
          if (err) return done(err);
          token.validate(function(err, isValid) {
            if (err) return done(err);
            expect(isValid, 'isValid').to.equal(true);
            done();
          });
        });
      });
  });

  describe('.findForRequest()', function() {
    beforeEach(createTestingToken);

    it('supports two-arg variant with no options', function(done) {
      const expectedTokenId = this.token.id;
      const req = mockRequest({
        headers: {'authorization': expectedTokenId},
      });

      Token.findForRequest(req, function(err, token) {
        if (err) return done(err);

        expect(token.id).to.eql(expectedTokenId);

        done();
      });
    });

    it('allows getIdForRequest() to be overridden', function(done) {
      const expectedTokenId = this.token.id;
      const current = Token.getIdForRequest;
      let called = false;
      Token.getIdForRequest = function(req, options) {
        called = true;
        return expectedTokenId;
      };
      const req = mockRequest({
        headers: {'authorization': 'dummy'},
      });

      Token.findForRequest(req, function(err, token) {
        Token.getIdForRequest = current;
        if (err) return done(err);

        expect(token.id).to.eql(expectedTokenId);
        expect(called).to.be.true();

        done();
      });
    });

    it('allows resolve() to be overridden', function(done) {
      const expectedTokenId = this.token.id;
      const current = Token.resolve;
      let called = false;
      Token.resolve = function(id, cb) {
        called = true;
        process.nextTick(function() {
          cb(null, {id: expectedTokenId});
        });
      };
      const req = mockRequest({
        headers: {'authorization': expectedTokenId},
      });

      Token.findForRequest(req, function(err, token) {
        Token.validate = current;
        if (err) return done(err);

        expect(token.id).to.eql(expectedTokenId);
        expect(called).to.be.true();

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
          header: function(name) { return this.headers[name]; },
        },
        opts,
      );
    }
  });
});

describe('app.enableAuth()', function() {
  let app;
  beforeEach(function setupAuthWithModels() {
    app = loopback({localRegistry: true, loadBuiltinModels: true});
    app.dataSource('db', {connector: 'memory'});

    Token = app.registry.createModel({
      name: 'MyToken',
      base: 'AccessToken',
    });
    app.model(Token, {dataSource: 'db'});

    ACL = app.registry.getModel('ACL');

    // Fix User's "hasMany accessTokens" relation to use our new MyToken model
    const User = app.registry.getModel('User');
    User.settings.relations.accessTokens.model = 'MyToken';

    app.enableAuth({dataSource: 'db'});
  });
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

        const errorResponse = res.body.error;
        assert(errorResponse);
        assert.equal(errorResponse.code, 'AUTHORIZATION_REQUIRED');

        done();
      });
  });

  it('denies remote call with app setting status 403', function(done) {
    createTestAppAndRequest(this.token, {app: {aclErrorStatus: 403}}, done)
      .del('/tests/123')
      .expect(403)
      .set('authorization', this.token.id)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }

        const errorResponse = res.body.error;
        assert(errorResponse);
        assert.equal(errorResponse.code, 'ACCESS_DENIED');

        done();
      });
  });

  it('denies remote call with app setting status 404', function(done) {
    createTestAppAndRequest(this.token, {model: {aclErrorStatus: 404}}, done)
      .del('/tests/123')
      .expect(404)
      .set('authorization', this.token.id)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }

        const errorResponse = res.body.error;
        assert(errorResponse);
        assert.equal(errorResponse.code, 'MODEL_NOT_FOUND');

        done();
      });
  });

  it('prevents remote call if the accessToken is missing and required', function(done) {
    createTestAppAndRequest(null, done)
      .del('/tests/123')
      .expect(401)
      .set('authorization', null)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }

        const errorResponse = res.body.error;
        assert(errorResponse);
        assert.equal(errorResponse.code, 'AUTHORIZATION_REQUIRED');

        done();
      });
  });

  it('stores token in the context', function(done) {
    const TestModel = app.registry.createModel('TestModel', {base: 'Model'});
    TestModel.getToken = function(cb) {
      const ctx = LoopBackContext.getCurrentContext();
      cb(null, ctx && ctx.get('accessToken') || null);
    };
    TestModel.remoteMethod('getToken', {
      returns: {arg: 'token', type: 'object'},
      http: {verb: 'GET', path: '/token'},
    });

    app.model(TestModel, {dataSource: null});

    app.enableAuth();
    app.use(contextMiddleware());
    app.use(loopback.token({model: Token}));
    app.use(loopback.rest());

    const token = this.token;
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

  // See https://github.com/strongloop/loopback-context/issues/6
  it('checks whether context is active', function(done) {
    app.enableAuth();
    app.use(contextMiddleware());
    app.use(session({
      secret: 'kitty',
      saveUninitialized: true,
      resave: true,
    }));
    app.use(loopback.token({model: Token}));
    app.get('/', function(req, res) { res.send('OK'); });
    app.use(loopback.rest());

    request(app)
      .get('/')
      .set('authorization', this.token.id)
      .set('cookie', 'connect.sid=s%3AFTyno9_MbGTJuOwdh9bxsYCVxlhlulTZ.' +
        'PZvp85jzLXZBCBkhCsSfuUjhij%2Fb0B1K2RYZdxSQU0c')
      .expect(200, 'OK')
      .end(done);
  });
});

function createTestingToken(done) {
  const test = this;
  Token.create({userId: '123'}, function(err, token) {
    if (err) return done(err);

    test.token = token;

    done();
  });
}

function createTestAppAndRequest(testToken, settings, done) {
  const app = createTestApp(testToken, settings, done);
  return request(app);
}

function createTestApp(testToken, settings, done) {
  if (!done && typeof settings === 'function') {
    done = settings;
    settings = {};
  }

  const appSettings = settings.app || {};
  const modelSettings = settings.model || {};
  const tokenSettings = extend({
    model: Token,
    currentUserLiteral: 'me',
  }, settings.token);

  const app = loopback({localRegistry: true, loadBuiltinModels: true});
  app.dataSource('db', {connector: 'memory'});

  app.use(cookieParser('secret'));
  app.use(loopback.token(tokenSettings));
  app.set('remoting', {errorHandler: {debug: true, log: false}});
  app.get('/token', function(req, res) {
    res.cookie('authorization', testToken.id, {signed: true});
    res.cookie('access_token', testToken.id, {signed: true});
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
  app.get('/check-access', function(req, res) {
    res.status(req.accessToken ? 200 : 401).end();
  });
  app.use('/users/:uid', function(req, res) {
    const result = {userId: req.params.uid};
    if (req.query.state) {
      result.state = req.query.state;
    } else if (req.url !== '/') {
      result.state = req.url.substring(1);
    }
    res.status(200).send(result);
  });
  app.use(loopback.rest());
  app.enableAuth({dataSource: 'db'});

  Object.keys(appSettings).forEach(function(key) {
    app.set(key, appSettings[key]);
  });

  const modelOptions = {
    acls: [
      {
        principalType: 'ROLE',
        principalId: '$everyone',
        accessType: ACL.ALL,
        permission: ACL.DENY,
        property: 'deleteById',
      },
    ],
  };

  Object.keys(modelSettings).forEach(function(key) {
    modelOptions[key] = modelSettings[key];
  });

  const TestModel = app.registry.createModel('test', {}, modelOptions);
  app.model(TestModel, {dataSource: 'db'});

  return app;
}

function givenLocalTokenModel() {
  const app = loopback({localRegistry: true, loadBuiltinModels: true});
  app.dataSource('db', {connector: 'memory'});

  const User = app.registry.getModel('User');
  app.model(User, {dataSource: 'db'});

  const Token = app.registry.getModel('AccessToken');
  app.model(Token, {dataSource: 'db'});

  return Token;
}
