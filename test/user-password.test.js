// Copyright IBM Corp. 2017,2019. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

const expect = require('./helpers/expect');
const errorHandler = require('strong-error-handler');
const loopback = require('../');
const Promise = require('bluebird');
const request = require('supertest');
const waitForEvent = require('./helpers/wait-for-event');

describe('User.password', () => {
  const credentials = {email: 'test@example.com', password: 'pass'};

  let app, User, testUser, regularToken, resetToken;

  context('restrict reset password token scope', () => {
    beforeEach(givenAppWithRestrictionEnabled);

    context('using regular access token', () => {
      beforeEach(givenRegularAccessToken);

      it('allows patching user name', () => {
        return changeName(regularToken).expect(200);
      });

      it('allows patching user password', () => {
        return patchPassword(regularToken).expect(200);
      });

      it('allows changing user password', () => {
        return changePassword(regularToken).expect(204);
      });

      it('denies resetting user password', () => {
        return resetPassword(regularToken).expect(401);
      });
    });

    context('using password-reset token', () => {
      beforeEach(givenResetPasswordToken);

      it('denies patching user name', () => {
        return changeName(resetToken).expect(401);
      });

      it('denies patching user password', () => {
        return patchPassword(resetToken).expect(401);
      });

      it('denies changing user password', () => {
        return changePassword(resetToken).expect(401);
      });

      it('allows resetting user password', () => {
        return resetPassword(resetToken).expect(204);
      });
    });

    function givenAppWithRestrictionEnabled() {
      return givenAppWithUser({restrictResetPasswordTokenScope: true});
    }
  });

  context('reject password changes via patch or replace', () => {
    beforeEach(givenAppWithRejectionEnabled);
    beforeEach(givenRegularAccessToken);

    it('allows patching user name', () => {
      return changeName(regularToken).expect(200);
    });

    it('denies patching user password', () => {
      return patchPassword(regularToken).expect(401);
    });

    it('allows changing user password', () => {
      return changePassword(regularToken).expect(204);
    });

    it('denies setPassword-like call with non-password changes', () => {
      return patchNameAndPasswordDirectly().then(
        function onSuccess() {
          throw new Error('patchAttributes() should have failed');
        },
        function onError(err) {
          expect(err.message).to.match(/Invalid use.*options.setPassword/);
        },
      );
    });

    function givenAppWithRejectionEnabled() {
      return givenAppWithUser({rejectPasswordChangesViaPatchOrReplace: true});
    }
  });

  context('all feature flags disabled', () => {
    beforeEach(givenAppWithNoRestrictions);

    context('using regular access token', () => {
      beforeEach(givenRegularAccessToken);

      it('allows changing user name', () => {
        return changeName(regularToken).expect(200);
      });

      it('allows patching user password', () => {
        return patchPassword(regularToken).expect(200);
      });

      it('allows changing user password', () => {
        return changePassword(regularToken).expect(204);
      });

      it('allows resetting user password', () => {
        return resetPassword(regularToken).expect(204);
      });
    });

    context('using password-reset token', () => {
      beforeEach(givenResetPasswordToken);

      it('allows changing user name', () => {
        return changeName(resetToken).expect(200);
      });

      it('allows patching user password', () => {
        return patchPassword(resetToken).expect(200);
      });

      it('allows changing user password', () => {
        return changePassword(resetToken).expect(204);
      });

      it('allows resetting user password', () => {
        return resetPassword(resetToken).expect(204);
      });
    });

    it('allows setPassword-like call with non-password changes', () => {
      return patchNameAndPasswordDirectly().then(() => {
        // test passed
      });
    });

    function givenAppWithNoRestrictions() {
      return givenAppWithUser({
        rejectPasswordChangesViaPatchOrReplace: false,
        restrictResetPasswordTokenScope: false,
      });
    }
  });

  function givenAppWithUser(userSettings) {
    app = loopback({localRegistry: true, loadBuiltinModels: true});
    app.set('remoting', {rest: {handleErrors: false}});
    app.dataSource('db', {connector: 'memory'});

    userSettings = Object.assign({
      name: 'PwdUser',
      base: 'User',
      properties: {
        name: 'string',
      },

      // Speed up the password hashing algorithm for tests
      saltWorkFactor: 4,

      http: {path: '/users'},
    }, userSettings);

    User = app.registry.createModel(userSettings);
    app.model(User, {dataSource: 'db'});

    const AccessToken = app.registry.getModel('AccessToken');
    AccessToken.settings.relations.user.model = User.modelName;

    app.enableAuth({dataSource: 'db'});

    app.use(loopback.token());
    app.use(loopback.rest());
    app.use(function logUnexpectedError(err, req, res, next) {
      const statusCode = err.statusCode || err.status;
      if (statusCode > 400 && statusCode !== 401) {
        console.log('Unexpected error for %s %s: %s %s',
          req.method, req.path, statusCode, err.stack || err);
      }
      next(err);
    });
    app.use(errorHandler({debug: true, log: false}));

    return User.create(credentials)
      .then(u => {
        testUser = u;
        return u.setAttribute('emailVerified', true);
      });
  }

  function givenRegularAccessToken() {
    return User.login(credentials).then(t => regularToken = t);
  }

  function givenResetPasswordToken() {
    return Promise.all([
      User.resetPassword({email: credentials.email}),
      waitForEvent(User, 'resetPasswordRequest'),
    ])
      .spread((reset, info) => resetToken = info.accessToken);
  }

  function changeName(token) {
    return request(app).patch(`/users/${testUser.id}`)
      .set('Authorization', token.id)
      .send({name: 'New Name'});
  }

  function patchPassword(token) {
    return request(app).patch(`/users/${testUser.id}`)
      .set('Authorization', token.id)
      .send({password: 'new-pass'});
  }

  function changePassword(token) {
    return request(app).post('/users/change-password')
      .set('Authorization', token.id)
      .send({oldPassword: credentials.password, newPassword: 'new-pass'});
  }

  function resetPassword(token) {
    return request(app).post('/users/reset-password')
      .set('Authorization', token.id)
      .send({newPassword: 'new-pass'});
  }

  function patchNameAndPasswordDirectly() {
    return testUser.patchAttributes(
      {password: 'new-pass', name: 'New Name'},
      {setPassword: true},
    );
  }
});
