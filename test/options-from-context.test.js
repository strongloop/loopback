// Copyright IBM Corp. 2013,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var expect = require('chai').expect;
var loopback = require('..');
var supertest = require('supertest');

var optionsFromContext = loopback.optionsFromContext;

describe('loopback.optionsFromContext', function() {
  var app, request, TestModel, User, accessToken, userId, actualOptions;

  before(setupAppAndRequest);
  before(createUserAndAccessToken);

  it('sets options.remotingContext', function(done) {
    request.get('/TestModels/saveOptions')
      .expect(204, function(err) {
        if (err) return done(err);
        expect(actualOptions).to.have.property('remotingContext');
        expect(actualOptions.remotingContext).to.have.property('req');
        expect(actualOptions.remotingContext).to.have.property('res');
        expect(actualOptions.remotingContext)
          .to.have.deep.property('constructor.name', 'HttpContext');
        done();
      });
  });

  it('sets options.accessToken for authorized requests', function(done) {
    request.get('/TestModels/saveOptions')
      .set('Authorization', accessToken.id)
      .expect(204, function(err) {
        if (err) return done(err);
        expect(actualOptions).to.have.property('accessToken');
        expect(actualOptions.accessToken.toObject())
          .to.eql(accessToken.toObject());
        done();
      });
  });

  it('sets options.currentUserId for authorized requests', function(done) {
    request.get('/TestModels/saveOptions')
      .set('Authorization', accessToken.id)
      .expect(204, function(err) {
        if (err) return done(err);
        expect(actualOptions).to.have.property('currentUserId', userId);
        done();
      });
  });

  it('handles anonymous requests', function(done) {
    request.get('/TestModels/saveOptions')
      .expect(204, function(err) {
        if (err) return done(err);
        expect(actualOptions).to.have.property('accessToken', null);
        expect(actualOptions).to.have.property('currentUserId', null);
        done();
      });
  });

  it('allows "beforeRemote" hooks to contribute options', function(done) {
    TestModel.beforeRemote('saveOptions', function(ctx, unused, next) {
      ctx.args.options.hooked = true;
      next();
    });

    request.get('/TestModels/saveOptions')
      .expect(204, function(err) {
        if (err) return done(err);
        expect(actualOptions).to.have.property('hooked', true);
        done();
      });
  });

  function setupAppAndRequest() {
    app = loopback({ localRegistry: true, loadBuiltinModels: true });

    app.dataSource('db', { connector: 'memory' });

    TestModel = app.registry.createModel('TestModel', { base: 'Model' });
    TestModel.saveOptions = function(options, cb) {
      actualOptions = options;
      cb();
    };

    TestModel.remoteMethod('saveOptions', {
      accepts: { arg: 'options', type: 'object', http: optionsFromContext },
      http: { verb: 'GET', path: '/saveOptions' },
    });

    app.model(TestModel, { dataSource: null });

    User = app.registry.getModel('User');
    app.model(User, { dataSource: 'db' });
    app.enableAuth({ dataSource: 'db' });

    app.use(loopback.token());
    app.use(loopback.rest());
    request = supertest(app);
  }

  function createUserAndAccessToken() {
    var CREDENTIALS = { email: 'context@example.com', password: 'pass' };
    return User.create(CREDENTIALS)
      .then(function(u) {
        return User.login(CREDENTIALS);
      }).then(function(token) {
        accessToken = token;
        userId = token.userId;
      });
  }
});
