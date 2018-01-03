// Copyright IBM Corp. 2017,2018. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

const loopback = require('../');
const supertest = require('supertest');
const strongErrorHandler = require('strong-error-handler');
const loggers = require('./helpers/error-loggers');

const logAllServerErrors = loggers.logAllServerErrors;
const logServerErrorsOtherThan = loggers.logServerErrorsOtherThan;

describe('Authorization scopes', () => {
  const CUSTOM_SCOPE = 'read:custom';

  let app, request, User, testUser, regularToken, scopedToken;
  beforeEach(givenAppAndRequest);
  beforeEach(givenRemoteMethodWithCustomScope);
  beforeEach(givenUser);
  beforeEach(givenDefaultToken);
  beforeEach(givenScopedToken);

  it('denies regular token to invoke custom-scoped method', () => {
    logServerErrorsOtherThan(401, app);
    return request.get('/users/scoped')
      .set('Authorization', regularToken.id)
      .expect(401);
  });

  it('allows regular tokens to invoke default-scoped method', () => {
    logAllServerErrors(app);
    return request.get('/users/' + testUser.id)
      .set('Authorization', regularToken.id)
      .expect(200);
  });

  it('allows scoped token to invoke custom-scoped method', () => {
    logAllServerErrors(app);
    return request.get('/users/scoped')
      .set('Authorization', scopedToken.id)
      .expect(204);
  });

  it('denies scoped token to invoke default-scoped method', () => {
    logServerErrorsOtherThan(401, app);
    return request.get('/users/' + testUser.id)
      .set('Authorization', scopedToken.id)
      .expect(401);
  });

  describe('token granted both default and custom scope', () => {
    beforeEach('given token with default and custom scope',
      () => givenScopedToken(['DEFAULT', CUSTOM_SCOPE]));
    beforeEach(() => logAllServerErrors(app));

    it('allows invocation of default-scoped method', () => {
      return request.get('/users/' + testUser.id)
        .set('Authorization', scopedToken.id)
        .expect(200);
    });

    it('allows invocation of custom-scoped method', () => {
      return request.get('/users/scoped')
        .set('Authorization', scopedToken.id)
        .expect(204);
    });
  });

  it('allows invocation when at least one method scope is matched', () => {
    givenRemoteMethodWithCustomScope(['read', 'write']);
    return givenScopedToken(['read', 'execute']).then(() => {
      return request.get('/users/scoped')
        .set('Authorization', scopedToken.id)
        .expect(204);
    });
  });

  function givenAppAndRequest() {
    app = loopback({localRegistry: true, loadBuiltinModels: true});
    app.set('remoting', {rest: {handleErrors: false}});
    app.dataSource('db', {connector: 'memory'});
    app.enableAuth({dataSource: 'db'});
    request = supertest(app);

    app.use(loopback.rest());

    User = app.models.User;
  }

  function givenRemoteMethodWithCustomScope() {
    // Delete any previously registered instance of the method "scoped"
    User.sharedClass._methods = User.sharedClass._methods
      .filter(m => m.name !== 'scoped');

    const accessScopes = arguments[0] || [CUSTOM_SCOPE];
    User.scoped = function(cb) { cb(); };
    User.remoteMethod('scoped', {
      accessScopes,
      http: {verb: 'GET', path: '/scoped'},
    });
    User.settings.acls.push({
      principalType: 'ROLE',
      principalId: '$authenticated',
      permission: 'ALLOW',
      property: 'scoped',
      accessType: 'EXECUTE',
    });
  }

  function givenUser() {
    return User.create({email: 'test@example.com', password: 'pass'})
      .then(u => testUser = u);
  }

  function givenDefaultToken() {
    return testUser.createAccessToken(60)
      .then(t => regularToken = t);
  }

  function givenScopedToken() {
    const scopes = arguments[0] || [CUSTOM_SCOPE];
    return testUser.accessTokens.create({ttl: 60, scopes})
      .then(t => scopedToken = t);
  }
});
