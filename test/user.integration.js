// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var loopback = require('../');
var lt = require('./helpers/loopback-testing-helper');
var path = require('path');
var SIMPLE_APP = path.join(__dirname, 'fixtures', 'user-integration-app');
var app = require(path.join(SIMPLE_APP, 'server/server.js'));
var expect = require('./helpers/expect');
const Promise = require('bluebird');
const waitForEvent = require('./helpers/wait-for-event');

describe('users - integration', function() {
  lt.beforeEach.withApp(app);

  before(function(done) {
    app.models.User.destroyAll(function(err) {
      if (err) return done(err);

      app.models.Post.destroyAll(function(err) {
        if (err) return done(err);

        app.models.blog.destroyAll(function(err) {
          if (err) return done(err);

          done();
        });
      });
    });
  });

  describe('base-user', function() {
    var userId, accessToken;

    it('should create a new user', function(done) {
      this.post('/api/users')
        .send({username: 'x', email: 'x@y.com', password: 'x'})
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.body.id).to.exist();
          userId = res.body.id;

          done();
        });
    });

    it('should log into the user', function(done) {
      var url = '/api/users/login';

      this.post(url)
        .send({username: 'x', email: 'x@y.com', password: 'x'})
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.body.id).to.exist();
          accessToken = res.body.id;

          done();
        });
    });

    it('should create post for a given user', function(done) {
      var url = '/api/users/' + userId + '/posts?access_token=' + accessToken;
      this.post(url)
        .send({title: 'T1', content: 'C1'})
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.body.title).to.be.eql('T1');
          expect(res.body.content).to.be.eql('C1');
          expect(res.body.userId).to.be.eql(userId);

          done();
        });
    });

    // FIXME: [rfeng] The test is passing if run alone. But it fails with
    // `npm test` as the loopback models are polluted by other tests
    it('should prevent access tokens from being included', function(done) {
      var url = '/api/posts?filter={"include":{"user":"accessTokens"}}';
      this.get(url)
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.body).to.have.property('length', 1);
          var post = res.body[0];
          expect(post.user).to.have.property('username', 'x');
          expect(post.user).to.not.have.property('accessTokens');

          done();
        });
    });

    it('should preserve current session when invalidating tokens', function(done) {
      var url = '/api/users/' + userId;
      var self = this;
      this.patch(url)
        .send({email: 'new@example.com'})
        .set('Authorization', accessToken)
        .expect(200, function(err) {
          if (err) return done(err);
          self.get(url)
            .set('Authorization', accessToken)
            .expect(200, done);
        });
    });

    it('returns 401 on logout with no access token', function(done) {
      this.post('/api/users/logout')
        .expect(401, done);
    });

    it('returns 401 on logout with invalid access token', function(done) {
      this.post('/api/users/logout')
        .set('Authorization', 'unknown-token')
        .expect(401, done);
    });

    it('updates the user\'s password', function() {
      const User = app.models.User;
      const credentials = {email: 'change@example.com', password: 'pass'};
      return User.create(credentials)
        .then(u => {
          this.user = u;
          return User.login(credentials);
        })
        .then(token => {
          return this.post('/api/users/change-password')
            .set('Authorization', token.id)
            .send({
              oldPassword: credentials.password,
              newPassword: 'new password',
            })
            .expect(204);
        })
        .then(() => {
          return User.findById(this.user.id);
        })
        .then(user => {
          return user.hasPassword('new password');
        })
        .then(isMatch => expect(isMatch, 'user has new password').to.be.true());
    });

    it('rejects unauthenticated change password request', function() {
      return this.post('/api/users/change-password')
        .send({
          oldPassword: 'old password',
          newPassword: 'new password',
        })
        .expect(401);
    });

    it('injects change password options from remoting context', function() {
      const User = app.models.User;
      const credentials = {email: 'inject@example.com', password: 'pass'};

      let injectedOptions;
      User.observe('before save', (ctx, next) => {
        injectedOptions = ctx.options;
        next();
      });

      return User.create(credentials)
        .then(u => User.login(credentials))
        .then(token => {
          return this.post('/api/users/change-password')
            .set('Authorization', token.id)
            .send({
              oldPassword: credentials.password,
              newPassword: 'new password',
            })
            .expect(204);
        })
        .then(() => {
          expect(injectedOptions).to.have.property('accessToken');
        });
    });

    it('resets user\'s password', function() {
      const User = app.models.User;
      const credentials = {email: 'reset@example.com', password: 'pass'};
      return User.create(credentials)
        .then(u => {
          this.user = u;
          return triggerPasswordReset(credentials.email);
        })
        .then(info => {
          return this.post('/api/users/reset-password')
            .set('Authorization', info.accessToken.id)
            .send({
              newPassword: 'new password',
            })
            .expect(204);
        })
        .then(() => {
          return User.findById(this.user.id);
        })
        .then(user => {
          return user.hasPassword('new password');
        })
        .then(isMatch => expect(isMatch, 'user has new password').to.be.true());
    });

    it('rejects unauthenticated reset password request', function() {
      return this.post('/api/users/reset-password')
        .send({
          newPassword: 'new password',
        })
        .expect(401);
    });

    it('injects reset password options from remoting context', function() {
      const User = app.models.User;
      const credentials = {email: 'inject-reset@example.com', password: 'pass'};

      let injectedOptions;
      User.observe('before save', (ctx, next) => {
        injectedOptions = ctx.options;
        next();
      });

      return User.create(credentials)
        .then(u => triggerPasswordReset(credentials.email))
        .then(info => {
          return this.post('/api/users/reset-password')
            .set('Authorization', info.accessToken.id)
            .send({
              newPassword: 'new password',
            })
            .expect(204);
        })
        .then(() => {
          expect(injectedOptions).to.have.property('accessToken');
        });
    });
  });

  describe('sub-user', function() {
    var userId, accessToken;

    it('should create a new user', function(done) {
      var url = '/api/myUsers';

      this.post(url)
        .send({username: 'x', email: 'x@y.com', password: 'x'})
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.body.id).to.exist();
          userId = res.body.id;

          done();
        });
    });

    it('should log into the user', function(done) {
      var url = '/api/myUsers/login';

      this.post(url)
        .send({username: 'x', email: 'x@y.com', password: 'x'})
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.body.id).to.exist();
          accessToken = res.body.id;

          done();
        });
    });

    it('should create blog for a given user', function(done) {
      var url = '/api/myUsers/' + userId + '/blogs?access_token=' + accessToken;
      this.post(url)
        .send({title: 'T1', content: 'C1'})
        .expect(200, function(err, res) {
          if (err) {
            console.error(err);
            return done(err);
          }

          expect(res.body.title).to.be.eql('T1');
          expect(res.body.content).to.be.eql('C1');
          expect(res.body.userId).to.be.eql(userId);

          done();
        });
    });

    it('should prevent access tokens from being included', function(done) {
      var url = '/api/blogs?filter={"include":{"user":"accessTokens"}}';
      this.get(url)
        .expect(200, function(err, res) {
          if (err) return done(err);

          expect(res.body).to.have.property('length', 1);
          var blog = res.body[0];
          expect(blog.user).to.have.property('username', 'x');
          expect(blog.user).to.not.have.property('accessTokens');

          done();
        });
    });
  });

  function triggerPasswordReset(email) {
    const User = app.models.User;
    return Promise.all([
      User.resetPassword({email: email}),
      waitForEvent(app.models.User, 'resetPasswordRequest'),
    ])
    .spread((reset, info) => info);
  }
});
