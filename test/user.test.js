// Copyright IBM Corp. 2013,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var assert = require('assert');
var expect = require('./helpers/expect');
var request = require('supertest');
var loopback = require('../');
var User, AccessToken;
var async = require('async');
var url = require('url');

describe('User', function() {
  this.timeout(10000);

  var validCredentialsEmail = 'foo@bar.com';
  var validCredentials = {email: validCredentialsEmail, password: 'bar'};
  var validCredentialsEmailVerified = {
    email: 'foo1@bar.com', password: 'bar1', emailVerified: true};
  var validCredentialsEmailVerifiedOverREST = {
    email: 'foo2@bar.com', password: 'bar2', emailVerified: true};
  var validCredentialsWithRealm = {
    email: 'foo3@bar.com', password: 'bar', realm: 'foobar'};
  var validCredentialsWithTTL = {email: 'foo@bar.com', password: 'bar', ttl: 3600};
  var validCredentialsWithTTLAndScope = {
    email: 'foo@bar.com', password: 'bar', ttl: 3600, scope: 'all'};
  var validMixedCaseEmailCredentials = {email: 'Foo@bar.com', password: 'bar'};
  var invalidCredentials = {email: 'foo1@bar.com', password: 'invalid'};
  var incompleteCredentials = {password: 'bar1'};
  var validCredentialsUser, validCredentialsEmailVerifiedUser;

  // Create a local app variable to prevent clashes with the global
  // variable shared by all tests. While this should not be necessary if
  // the tests were written correctly, it turns out that's not the case :(
  var app = null;

  beforeEach(function setupAppAndModels(done) {
    // override the global app object provided by test/support.js
    // and create a local one that does not share state with other tests
    app = loopback({localRegistry: true, loadBuiltinModels: true});
    app.set('remoting', {errorHandler: {debug: true, log: false}});
    app.dataSource('db', {connector: 'memory'});

    // setup Email model, it's needed by User tests
    app.dataSource('email', {
      connector: loopback.Mail,
      transports: [{type: 'STUB'}],
    });
    var Email = app.registry.getModel('Email');
    app.model(Email, {dataSource: 'email'});

    // attach User and related models
    User = app.registry.createModel({
      name: 'TestUser',
      base: 'User',
      properties: {
        // Use a custom id property to verify that User methods
        // are correctly looking up the primary key
        pk: {type: 'String', defaultFn: 'guid', id: true},
      },
      http: {path: 'test-users'},
      // forceId is set to false for the purpose of updating the same affected user within the
      // `Email Update` test cases.
      forceId: false,
      // Speed up the password hashing algorithm for tests
      saltWorkFactor: 4,
    });
    app.model(User, {dataSource: 'db'});

    AccessToken = app.registry.getModel('AccessToken');
    app.model(AccessToken, {dataSource: 'db'});

    User.email = Email;

    // Update the AccessToken relation to use the subclass of User
    AccessToken.belongsTo(User, {as: 'user', foreignKey: 'userId'});
    User.hasMany(AccessToken, {as: 'accessTokens', foreignKey: 'userId'});

    // Speed up the password hashing algorithm
    // for tests using the built-in User model
    User.settings.saltWorkFactor = 4;

    // allow many User.afterRemote's to be called
    User.setMaxListeners(0);

    app.enableAuth({dataSource: 'db'});
    app.use(loopback.token({model: AccessToken}));
    app.use(loopback.rest());

    User.create(validCredentials, function(err, user) {
      if (err) return done(err);
      validCredentialsUser = user;
      User.create(validCredentialsEmailVerified, function(err, user) {
        if (err) return done(err);
        validCredentialsEmailVerifiedUser = user;
        done();
      });
    });
  });

  describe('User.create', function() {
    it('Create a new user', function(done) {
      User.create({email: 'f@b.com', password: 'bar'}, function(err, user) {
        assert(!err);
        assert(user.pk);
        assert(user.email);

        done();
      });
    });

    it('Create a new user (email case-sensitivity off)', function(done) {
      User.settings.caseSensitiveEmail = false;
      User.create({email: 'F@b.com', password: 'bar'}, function(err, user) {
        if (err) return done(err);

        assert(user.pk);
        assert.equal(user.email, user.email.toLowerCase());

        done();
      });
    });

    it('Create a new user (email case-sensitive)', function(done) {
      User.create({email: 'F@b.com', password: 'bar'}, function(err, user) {
        if (err) return done(err);

        assert(user.pk);
        assert(user.email);
        assert.notEqual(user.email, user.email.toLowerCase());

        done();
      });
    });

    it('Email is required', function(done) {
      User.create({password: '123'}, function(err) {
        assert(err);
        assert.equal(err.name, 'ValidationError');
        assert.equal(err.statusCode, 422);
        assert.equal(err.details.context, User.modelName);
        assert.deepEqual(err.details.codes.email, ['presence']);

        done();
      });
    });

    // will change in future versions where password will be optional by default
    it('Password is required', function(done) {
      var u = new User({email: '123@456.com'});

      User.create({email: 'c@d.com'}, function(err) {
        assert(err);

        done();
      });
    });

    it('Requires a valid email', function(done) {
      User.create({email: 'foo@', password: '123'}, function(err) {
        assert(err);
        assert.equal(err.name, 'ValidationError');
        assert.equal(err.statusCode, 422);
        assert.equal(err.details.context, User.modelName);
        assert.deepEqual(err.details.codes.email, ['custom.email']);
        done();
      });
    });

    it('allows TLD domains in email', function() {
      return User.create({
        email: 'local@com',
        password: '123',
      });
    });

    it('Requires a unique email', function(done) {
      User.create({email: 'a@b.com', password: 'foobar'}, function() {
        User.create({email: 'a@b.com', password: 'batbaz'}, function(err) {
          assert(err, 'should error because the email is not unique!');

          done();
        });
      });
    });

    it('Requires a unique email (email case-sensitivity off)', function(done) {
      User.settings.caseSensitiveEmail = false;
      User.create({email: 'A@b.com', password: 'foobar'}, function(err) {
        if (err) return done(err);

        User.create({email: 'a@b.com', password: 'batbaz'}, function(err) {
          assert(err, 'should error because the email is not unique!');

          done();
        });
      });
    });

    it('Requires a unique email (email case-sensitive)', function(done) {
      User.create({email: 'A@b.com', password: 'foobar'}, function(err, user1) {
        User.create({email: 'a@b.com', password: 'batbaz'}, function(err, user2) {
          if (err) return done(err);

          assert.notEqual(user1.email, user2.email);

          done();
        });
      });
    });

    it('Requires a unique username', function(done) {
      User.create({email: 'a@b.com', username: 'abc', password: 'foobar'}, function() {
        User.create({email: 'b@b.com', username: 'abc',  password: 'batbaz'}, function(err) {
          assert(err, 'should error because the username is not unique!');

          done();
        });
      });
    });

    it('Requires a password to login with basic auth', function(done) {
      User.create({email: 'b@c.com'}, function(err) {
        User.login({email: 'b@c.com'}, function(err, accessToken) {
          assert(!accessToken, 'should not create a accessToken without a valid password');
          assert(err, 'should not login without a password');
          assert.equal(err.code, 'LOGIN_FAILED');

          done();
        });
      });
    });

    it('Hashes the given password', function() {
      var u = new User({username: 'foo', password: 'bar'});
      assert(u.password !== 'bar');
    });

    it('does not hash the password if it\'s already hashed', function() {
      var u1 = new User({username: 'foo', password: 'bar'});
      assert(u1.password !== 'bar');
      var u2 = new User({username: 'foo', password: u1.password});
      assert(u2.password === u1.password);
    });

    it('invalidates the user\'s accessToken when the user is deleted By id', function(done) {
      var usersId;
      async.series([
        function(next) {
          User.create({email: 'b@c.com', password: 'bar'}, function(err, user) {
            usersId = user.pk;
            next(err);
          });
        },
        function(next) {
          User.login({email: 'b@c.com', password: 'bar'}, function(err, accessToken) {
            if (err) return next(err);
            assert(accessToken.userId);
            next();
          });
        },
        function(next) {
          User.deleteById(usersId, function(err) {
            next(err);
          });
        },
        function(next) {
          User.findById(usersId, function(err, userFound)  {
            if (err) return next(err);
            expect(userFound).to.equal(null);
            AccessToken.find({where: {userId: usersId}}, function(err, tokens) {
              if (err) return next(err);
              expect(tokens.length).to.equal(0);
              next();
            });
          });
        },
      ], function(err) {
        if (err) return done(err);
        done();
      });
    });

    it('invalidates the user\'s accessToken when the user is deleted all', function(done) {
      var userIds = [];
      var users;
      async.series([
        function(next) {
          User.create([
            {name: 'myname', email: 'b@c.com', password: 'bar'},
            {name: 'myname', email: 'd@c.com', password: 'bar'},
          ], function(err, createdUsers) {
            users = createdUsers;
            userIds = createdUsers.map(function(u) {
              return u.pk;
            });
            next(err);
          });
        },
        function(next) {
          User.login({email: 'b@c.com', password: 'bar'}, function(err, accessToken) {
            if (err) return next(err);
            assertGoodToken(accessToken, users[0]);
            next();
          });
        },
        function(next) {
          User.login({email: 'd@c.com', password: 'bar'}, function(err, accessToken) {
            if (err) return next(err);
            assertGoodToken(accessToken, users[1]);
            next();
          });
        },
        function(next) {
          User.deleteAll({name: 'myname'}, function(err, user) {
            next(err);
          });
        },
        function(next) {
          User.find({where: {name: 'myname'}}, function(err, userFound)  {
            if (err) return next(err);
            expect(userFound.length).to.equal(0);
            AccessToken.find({where: {userId: {inq: userIds}}}, function(err, tokens) {
              if (err) return next(err);
              expect(tokens.length).to.equal(0);
              next();
            });
          });
        },
      ], function(err) {
        if (err) return done(err);
        done();
      });
    });

    describe('custom password hash', function() {
      var defaultHashPassword, defaultValidatePassword;

      beforeEach(function() {
        defaultHashPassword = User.hashPassword;
        defaultValidatePassword = User.validatePassword;

        User.hashPassword = function(plain) {
          return plain.toUpperCase();
        };

        User.validatePassword = function(plain) {
          if (!plain || plain.length < 3) {
            throw new Error('Password must have at least 3 chars');
          }
          return true;
        };
      });

      afterEach(function() {
        User.hashPassword = defaultHashPassword;
        User.validatePassword = defaultValidatePassword;
      });

      it('Reports invalid password', function() {
        try {
          var u = new User({username: 'foo', password: 'aa'});
          assert(false, 'Error should have been thrown');
        } catch (e) {
          // Ignore
        }
      });

      it('Hashes the given password', function() {
        var u = new User({username: 'foo', password: 'bar'});
        assert(u.password === 'BAR');
      });
    });

    it('Create a user over REST should remove emailVerified property', function(done) {
      request(app)
        .post('/test-users')
        .expect('Content-Type', /json/)
        .expect(200)
        .send(validCredentialsEmailVerifiedOverREST)
        .end(function(err, res) {
          if (err) return done(err);

          assert(!res.body.emailVerified);

          done();
        });
    });
  });

  describe('Password length validation', function() {
    var pass72Char = new Array(70).join('a') + '012';
    var pass73Char = pass72Char + '3';
    var passTooLong = pass72Char + 'WXYZ1234';

    it('rejects passwords longer than 72 characters', function(done) {
      try {
        User.create({email: 'b@c.com', password: pass73Char}, function(err) {
          if (err) return done(err);
          done(new Error('User.create() should have thrown an error.'));
        });
      } catch (e) {
        expect(e).to.match(/Password too long/);
        done();
      }
    });

    it('rejects a new user with password longer than 72 characters', function(done) {
      try {
        var u = new User({username: 'foo', password: pass73Char});
        assert(false, 'Error should have been thrown');
      } catch (e) {
        expect(e).to.match(/Password too long/);
        done();
      }
    });

    it('accepts passwords that are exactly 72 characters long', function(done) {
      User.create({email: 'b@c.com', password: pass72Char}, function(err, user) {
        if (err) return done(err);
        User.findById(user.pk, function(err, userFound)  {
          if (err) return done(err);
          assert(userFound);
          done();
        });
      });
    });

    it('allows login with password exactly 72 characters long', function(done) {
      User.create({email: 'b@c.com', password: pass72Char}, function(err, user) {
        if (err) return done(err);
        User.login({email: 'b@c.com', password: pass72Char}, function(err, accessToken) {
          if (err) return done(err);
          assertGoodToken(accessToken, user);
          done();
        });
      });
    });

    it('rejects password reset when password is more than 72 chars', function(done) {
      User.create({email: 'b@c.com', password: pass72Char}, function(err) {
        if (err) return done(err);
        User.resetPassword({email: 'b@c.com', password: pass73Char}, function(err) {
          assert(err);
          expect(err).to.match(/Password too long/);
          done();
        });
      });
    });
  });

  describe('Access-hook for queries with email NOT case-sensitive', function() {
    it('Should not throw an error if the query does not contain {where: }', function(done) {
      User.find({}, function(err) {
        if (err) done(err);

        done();
      });
    });

    it('Should be able to find lowercase email with mixed-case email query', function(done) {
      User.settings.caseSensitiveEmail = false;
      User.find({where: {email: validMixedCaseEmailCredentials.email}}, function(err, result) {
        if (err) done(err);

        assert(result[0], 'The query did not find the user');
        assert.equal(result[0].email, validCredentialsEmail);

        done();
      });
    });

    it('Should be able to use query filters (email case-sensitivity off)', function(done) {
      User.settings.caseSensitiveEmail = false;
      var insensitiveUser = {email: 'insensitive@example.com', password: 'abc'};
      User.create(insensitiveUser, function(err, user) {
        User.find({where: {email:
          {inq: [insensitiveUser.email]},
        }}, function(err, result) {
          if (err) done(err);
          assert(result[0], 'The query did not find the user');
          assert.equal(result[0].email, insensitiveUser.email);
          done();
        });
      });
    });

    it('Should be able to use query filters (email case-sensitivity on)', function(done) {
      User.settings.caseSensitiveEmail = true;
      var sensitiveUser = {email: 'senSiTive@example.com', password: 'abc'};
      User.create(sensitiveUser, function(err, user) {
        User.find({where: {email:
          {inq: [sensitiveUser.email]},
        }}, function(err, result) {
          if (err) done(err);
          assert(result[0], 'The query did not find the user');
          assert.equal(result[0].email, sensitiveUser.email);
          done();
        });
      });
    });
  });

  describe('User.login', function() {
    it('Login a user by providing credentials', function(done) {
      User.login(validCredentials, function(err, accessToken) {
        assertGoodToken(accessToken, validCredentialsUser);

        done();
      });
    });

    it('Login a user by providing email credentials (email case-sensitivity off)', function(done) {
      User.settings.caseSensitiveEmail = false;
      User.login(validMixedCaseEmailCredentials, function(err, accessToken) {
        assertGoodToken(accessToken, validCredentialsUser);

        done();
      });
    });

    it('Try to login with invalid email case', function(done) {
      User.login(validMixedCaseEmailCredentials, function(err, accessToken) {
        assert(err);

        done();
      });
    });

    it('Login a user by providing credentials with TTL', function(done) {
      User.login(validCredentialsWithTTL, function(err, accessToken) {
        assertGoodToken(accessToken, validCredentialsUser);
        assert.equal(accessToken.ttl, validCredentialsWithTTL.ttl);

        done();
      });
    });

    it('honors default `createAccessToken` implementation', function(done) {
      User.login(validCredentialsWithTTL, function(err, accessToken) {
        assert(accessToken.userId);
        assert(accessToken.id);

        User.findById(accessToken.userId, function(err, user) {
          user.createAccessToken(120, function(err, accessToken) {
            assertGoodToken(accessToken, validCredentialsUser);
            assert.equal(accessToken.ttl, 120);

            done();
          });
        });
      });
    });

    it('honors default `createAccessToken` implementation - promise variant', function(done) {
      User.login(validCredentialsWithTTL, function(err, accessToken) {
        assert(accessToken.userId);
        assert(accessToken.id);

        User.findById(accessToken.userId, function(err, user) {
          user.createAccessToken(120)
            .then(function(accessToken) {
              assertGoodToken(accessToken, validCredentialsUser);
              assert.equal(accessToken.ttl, 120);

              done();
            })
            .catch(function(err) {
              done(err);
            });
        });
      });
    });

    it('Login a user using a custom createAccessToken', function(done) {
      var createToken = User.prototype.createAccessToken; // Save the original method
      // Override createAccessToken
      User.prototype.createAccessToken = function(ttl, cb) {
        // Reduce the ttl by half for testing purpose
        this.accessTokens.create({ttl: ttl / 2}, cb);
      };
      User.login(validCredentialsWithTTL, function(err, accessToken) {
        assertGoodToken(accessToken, validCredentialsUser);
        assert.equal(accessToken.ttl, 1800);

        User.findById(accessToken.userId, function(err, user) {
          user.createAccessToken(120, function(err, accessToken) {
            assertGoodToken(accessToken, validCredentialsUser);
            assert.equal(accessToken.ttl, 60);
            // Restore create access token
            User.prototype.createAccessToken = createToken;

            done();
          });
        });
      });
    });

    it('Login a user using a custom createAccessToken with options',
      function(done) {
        var createToken = User.prototype.createAccessToken; // Save the original method
        // Override createAccessToken
        User.prototype.createAccessToken = function(ttl, options, cb) {
          // Reduce the ttl by half for testing purpose
          this.accessTokens.create({ttl: ttl / 2, scopes: options.scope}, cb);
        };
        User.login(validCredentialsWithTTLAndScope, function(err, accessToken) {
          assertGoodToken(accessToken, validCredentialsUser);
          assert.equal(accessToken.ttl, 1800);
          assert.equal(accessToken.scopes, 'all');

          User.findById(accessToken.userId, function(err, user) {
            user.createAccessToken(120, {scope: 'default'}, function(err, accessToken) {
              assertGoodToken(accessToken, validCredentialsUser);
              assert.equal(accessToken.ttl, 60);
              assert.equal(accessToken.scopes, 'default');
              // Restore create access token
              User.prototype.createAccessToken = createToken;

              done();
            });
          });
        });
      });

    it('Login should only allow correct credentials', function(done) {
      User.login(invalidCredentials, function(err, accessToken) {
        assert(err);
        assert.equal(err.code, 'LOGIN_FAILED');
        assert(!accessToken);

        done();
      });
    });

    it('Login should only allow correct credentials - promise variant', function(done) {
      User.login(invalidCredentials)
        .then(function(accessToken) {
          expect(accessToken, 'accessToken').to.not.exist();

          done();
        })
        .catch(function(err) {
          expect(err, 'err').to.exist();
          expect(err).to.have.property('code', 'LOGIN_FAILED');

          done();
        });
    });

    it('Login a user providing incomplete credentials', function(done) {
      User.login(incompleteCredentials, function(err, accessToken) {
        expect(err, 'err').to.exist();
        expect(err).to.have.property('code', 'USERNAME_EMAIL_REQUIRED');

        done();
      });
    });

    it('Login a user providing incomplete credentials - promise variant', function(done) {
      User.login(incompleteCredentials)
        .then(function(accessToken) {
          expect(accessToken, 'accessToken').to.not.exist();

          done();
        })
        .catch(function(err) {
          expect(err, 'err').to.exist();
          expect(err).to.have.property('code', 'USERNAME_EMAIL_REQUIRED');

          done();
        });
    });

    it('Login a user over REST by providing credentials', function(done) {
      request(app)
        .post('/test-users/login')
        .expect('Content-Type', /json/)
        .expect(200)
        .send(validCredentials)
        .end(function(err, res) {
          if (err) return done(err);

          var accessToken = res.body;

          assertGoodToken(accessToken, validCredentialsUser);
          assert(accessToken.user === undefined);

          done();
        });
    });

    it('Login a user over REST by providing invalid credentials', function(done) {
      request(app)
        .post('/test-users/login')
        .expect('Content-Type', /json/)
        .expect(401)
        .send(invalidCredentials)
        .end(function(err, res) {
          if (err) return done(err);

          var errorResponse = res.body.error;
          assert.equal(errorResponse.code, 'LOGIN_FAILED');

          done();
        });
    });

    it('Login a user over REST by providing incomplete credentials', function(done) {
      request(app)
        .post('/test-users/login')
        .expect('Content-Type', /json/)
        .expect(400)
        .send(incompleteCredentials)
        .end(function(err, res) {
          if (err) return done(err);

          var errorResponse = res.body.error;
          assert.equal(errorResponse.code, 'USERNAME_EMAIL_REQUIRED');

          done();
        });
    });

    it('Login a user over REST with the wrong Content-Type', function(done) {
      request(app)
        .post('/test-users/login')
        .set('Content-Type', null)
        .expect('Content-Type', /json/)
        .expect(400)
        .send(JSON.stringify(validCredentials))
        .end(function(err, res) {
          if (err) return done(err);

          var errorResponse = res.body.error;
          assert.equal(errorResponse.code, 'USERNAME_EMAIL_REQUIRED');

          done();
        });
    });

    it('Returns current user when `include` is `USER`', function(done) {
      request(app)
        .post('/test-users/login?include=USER')
        .send(validCredentials)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) return done(err);

          var token = res.body;
          expect(token.user, 'body.user').to.not.equal(undefined);
          expect(token.user, 'body.user')
            .to.have.property('email', validCredentials.email);

          done();
        });
    });

    it('should handle multiple `include`', function(done) {
      request(app)
        .post('/test-users/login?include=USER&include=Post')
        .send(validCredentials)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) return done(err);

          var token = res.body;
          expect(token.user, 'body.user').to.not.equal(undefined);
          expect(token.user, 'body.user')
            .to.have.property('email', validCredentials.email);

          done();
        });
    });

    it('allows login with password too long but created in old LB version',
    function(done) {
      var bcrypt = require('bcryptjs');
      var longPassword = new Array(80).join('a');
      var oldHash = bcrypt.hashSync(longPassword, bcrypt.genSaltSync(1));

      User.create({email: 'b@c.com', password: oldHash}, function(err) {
        if (err) return done(err);
        User.login({email: 'b@c.com', password: longPassword}, function(err, accessToken) {
          if (err) return done(err);
          assert(accessToken.id);
          // we are logged in, the test passed
          done();
        });
      });
    });
  });

  function assertGoodToken(accessToken, user) {
    if (accessToken instanceof AccessToken) {
      accessToken = accessToken.toJSON();
    }
    expect(accessToken).to.have.property('userId', user.pk);
    assert(accessToken.id);
    assert.equal(accessToken.id.length, 64);
  }

  describe('User.login requiring email verification', function() {
    beforeEach(function() {
      User.settings.emailVerificationRequired = true;
    });

    afterEach(function() {
      User.settings.emailVerificationRequired = false;
    });

    it('Require valid and complete credentials for email verification error', function(done) {
      User.login({email: validCredentialsEmail}, function(err, accessToken) {
        // strongloop/loopback#931
        // error message should be "login failed"
        // and not "login failed as the email has not been verified"
        assert(err && !/verified/.test(err.message),
          'expecting "login failed" error message, received: "' + err.message + '"');
        assert.equal(err.code, 'LOGIN_FAILED');

        done();
      });
    });

    it('Require valid and complete credentials for email verification error - promise variant',
    function(done) {
      User.login({email: validCredentialsEmail})
        .then(function(accessToken) {
          done();
        })
      .catch(function(err) {
        // strongloop/loopback#931
        // error message should be "login failed" and not "login failed as the email has not been verified"
        assert(err && !/verified/.test(err.message),
          'expecting "login failed" error message, received: "' + err.message + '"');
        assert.equal(err.code, 'LOGIN_FAILED');

        done();
      });
    });

    it('Login a user by without email verification', function(done) {
      User.login(validCredentials, function(err, accessToken) {
        assert(err);
        assert.equal(err.code, 'LOGIN_FAILED_EMAIL_NOT_VERIFIED');

        done();
      });
    });

    it('Login a user by without email verification - promise variant', function(done) {
      User.login(validCredentials)
        .then(function(err, accessToken) {
          done();
        })
        .catch(function(err) {
          assert(err);
          assert.equal(err.code, 'LOGIN_FAILED_EMAIL_NOT_VERIFIED');

          done();
        });
    });

    it('Login a user by with email verification', function(done) {
      User.login(validCredentialsEmailVerified, function(err, accessToken) {
        assertGoodToken(accessToken, validCredentialsEmailVerifiedUser);

        done();
      });
    });

    it('Login a user by with email verification - promise variant', function(done) {
      User.login(validCredentialsEmailVerified)
        .then(function(accessToken) {
          assertGoodToken(accessToken, validCredentialsEmailVerifiedUser);

          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('Login a user over REST when email verification is required', function(done) {
      request(app)
        .post('/test-users/login')
        .expect('Content-Type', /json/)
        .expect(200)
        .send(validCredentialsEmailVerified)
        .end(function(err, res) {
          if (err) return done(err);

          var accessToken = res.body;

          assertGoodToken(accessToken, validCredentialsEmailVerifiedUser);
          assert(accessToken.user === undefined);

          done();
        });
    });

    it('Login user over REST require complete and valid credentials ' +
    'for email verification error message',
    function(done) {
      request(app)
        .post('/test-users/login')
        .expect('Content-Type', /json/)
        .expect(401)
        .send({email: validCredentialsEmail})
        .end(function(err, res) {
          if (err) return done(err);

          // strongloop/loopback#931
          // error message should be "login failed"
          // and not "login failed as the email has not been verified"
          var errorResponse = res.body.error;
          assert(errorResponse && !/verified/.test(errorResponse.message),
            'expecting "login failed" error message, received: "' + errorResponse.message + '"');
          assert.equal(errorResponse.code, 'LOGIN_FAILED');

          done();
        });
    });

    it('Login a user over REST without email verification when it is required', function(done) {
      request(app)
        .post('/test-users/login')
        .expect('Content-Type', /json/)
        .expect(401)
        .send(validCredentials)
        .end(function(err, res) {
          if (err) return done(err);

          var errorResponse = res.body.error;
          assert.equal(errorResponse.code, 'LOGIN_FAILED_EMAIL_NOT_VERIFIED');

          done();
        });
    });
  });

  describe('User.login requiring realm', function() {
    var User, AccessToken;

    beforeEach(function() {
      User = app.registry.createModel('RealmUser', {}, {
        base: 'TestUser',
        realmRequired: true,
        realmDelimiter: ':',
      });

      AccessToken = app.registry.createModel('RealmAccessToken', {}, {
        base: 'AccessToken',
      });

      app.model(AccessToken, {dataSource: 'db'});
      app.model(User, {dataSource: 'db'});

      // Update the AccessToken relation to use the subclass of User
      AccessToken.belongsTo(User, {as: 'user', foreignKey: 'userId'});
      User.hasMany(AccessToken, {as: 'accessTokens', foreignKey: 'userId'});

      // allow many User.afterRemote's to be called
      User.setMaxListeners(0);
    });

    var realm1User = {
      realm: 'realm1',
      username: 'foo100',
      email: 'foo100@bar.com',
      password: 'pass100',
    };

    var realm2User = {
      realm: 'realm2',
      username: 'foo100',
      email: 'foo100@bar.com',
      password: 'pass200',
    };

    var credentialWithoutRealm = {
      username: 'foo100',
      email: 'foo100@bar.com',
      password: 'pass100',
    };

    var credentialWithBadPass = {
      realm: 'realm1',
      username: 'foo100',
      email: 'foo100@bar.com',
      password: 'pass001',
    };

    var credentialWithBadRealm = {
      realm: 'realm3',
      username: 'foo100',
      email: 'foo100@bar.com',
      password: 'pass100',
    };

    var credentialWithRealm = {
      realm: 'realm1',
      username: 'foo100',
      password: 'pass100',
    };

    var credentialRealmInUsername = {
      username: 'realm1:foo100',
      password: 'pass100',
    };

    var credentialRealmInEmail = {
      email: 'realm1:foo100@bar.com',
      password: 'pass100',
    };

    var user1 = null;
    beforeEach(function(done) {
      User.create(realm1User, function(err, u) {
        if (err) return done(err);

        user1 = u;
        User.create(realm2User, done);
      });
    });

    it('honors unique email for realm', function(done) {
      User.create(realm1User, function(err, u) {
        assert(err);
        assert(err.message.match(/User already exists/) &&
          err.message.match(/Email already exists/));
        done();
      });
    });

    it('rejects a user by without realm', function(done) {
      User.login(credentialWithoutRealm, function(err, accessToken) {
        assert(err);
        assert.equal(err.code, 'REALM_REQUIRED');

        done();
      });
    });

    it('rejects a user by with bad realm', function(done) {
      User.login(credentialWithBadRealm, function(err, accessToken) {
        assert(err);
        assert.equal(err.code, 'LOGIN_FAILED');

        done();
      });
    });

    it('rejects a user by with bad pass', function(done) {
      User.login(credentialWithBadPass, function(err, accessToken) {
        assert(err);
        assert.equal(err.code, 'LOGIN_FAILED');

        done();
      });
    });

    it('logs in a user by with realm', function(done) {
      User.login(credentialWithRealm, function(err, accessToken) {
        assertGoodToken(accessToken, user1);

        done();
      });
    });

    it('logs in a user by with realm in username', function(done) {
      User.login(credentialRealmInUsername, function(err, accessToken) {
        assertGoodToken(accessToken, user1);

        done();
      });
    });

    it('logs in a user by with realm in email', function(done) {
      User.login(credentialRealmInEmail, function(err, accessToken) {
        assertGoodToken(accessToken, user1);

        done();
      });
    });

    describe('User.login with realmRequired but no realmDelimiter', function() {
      beforeEach(function() {
        User.settings.realmDelimiter = undefined;
      });

      afterEach(function() {
        User.settings.realmDelimiter = ':';
      });

      it('logs in a user by with realm', function(done) {
        User.login(credentialWithRealm, function(err, accessToken) {
          assertGoodToken(accessToken, user1);

          done();
        });
      });

      it('rejects a user by with realm in email if realmDelimiter is not set',
        function(done) {
          User.login(credentialRealmInEmail, function(err, accessToken) {
            assert(err);
            assert.equal(err.code, 'REALM_REQUIRED');

            done();
          });
        });
    });
  });

  describe('User.logout', function() {
    it('Logout a user by providing the current accessToken id (using node)', function(done) {
      login(logout);

      function login(fn) {
        User.login(validCredentials, fn);
      }

      function logout(err, accessToken) {
        User.logout(accessToken.id, verify(accessToken.id, done));
      }
    });

    it('Logout a user by providing the current accessToken id (using node) - promise variant',
    function(done) {
      login(logout);

      function login(fn) {
        User.login(validCredentials, fn);
      }

      function logout(err, accessToken) {
        User.logout(accessToken.id)
          .then(function() {
            verify(accessToken.id, done);
          })
          .catch(done(err));
      }
    });

    it('Logout a user by providing the current accessToken id (over rest)', function(done) {
      login(logout);
      function login(fn) {
        request(app)
          .post('/test-users/login')
          .expect('Content-Type', /json/)
          .expect(200)
          .send(validCredentials)
          .end(function(err, res) {
            if (err) return done(err);

            var accessToken = res.body;
            assertGoodToken(accessToken, validCredentialsUser);

            fn(null, accessToken.id);
          });
      }

      function logout(err, token) {
        request(app)
          .post('/test-users/logout')
          .set('Authorization', token)
          .expect(204)
          .end(verify(token, done));
      }
    });

    it('fails when accessToken is not provided', function(done) {
      User.logout(undefined, function(err) {
        expect(err).to.have.property('message');
        expect(err).to.have.property('status', 401);
        done();
      });
    });

    it('fails when accessToken is not found', function(done) {
      User.logout('expired-access-token', function(err) {
        expect(err).to.have.property('message');
        expect(err).to.have.property('status', 401);
        done();
      });
    });

    function verify(token, done) {
      assert(token);

      return function(err) {
        if (err) return done(err);

        AccessToken.findById(token, function(err, accessToken) {
          assert(!accessToken, 'accessToken should not exist after logging out');

          done(err);
        });
      };
    }
  });

  describe('user.hasPassword(plain, fn)', function() {
    it('Determine if the password matches the stored password', function(done) {
      var u = new User({username: 'foo', password: 'bar'});
      u.hasPassword('bar', function(err, isMatch) {
        assert(isMatch, 'password doesnt match');

        done();
      });
    });

    it('Determine if the password matches the stored password - promise variant', function(done) {
      var u = new User({username: 'foo', password: 'bar'});
      u.hasPassword('bar')
        .then(function(isMatch) {
          assert(isMatch, 'password doesnt match');

          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should match a password when saved', function(done) {
      var u = new User({username: 'a', password: 'b', email: 'z@z.net'});

      u.save(function(err, user) {
        User.findById(user.pk, function(err, uu) {
          uu.hasPassword('b', function(err, isMatch) {
            assert(isMatch);

            done();
          });
        });
      });
    });

    it('should match a password after it is changed', function(done) {
      User.create({email: 'foo@baz.net', username: 'bat', password: 'baz'}, function(err, user) {
        User.findById(user.pk, function(err, foundUser) {
          assert(foundUser);
          foundUser.hasPassword('baz', function(err, isMatch) {
            assert(isMatch);
            foundUser.password = 'baz2';
            foundUser.save(function(err, updatedUser) {
              updatedUser.hasPassword('baz2', function(err, isMatch) {
                assert(isMatch);
                User.findById(user.pk, function(err, uu) {
                  uu.hasPassword('baz2', function(err, isMatch) {
                    assert(isMatch);

                    done();
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  describe('Verification', function() {
    describe('user.verify(options, fn)', function() {
      it('Verify a user\'s email address', function(done) {
        User.afterRemote('create', function(ctx, user, next) {
          assert(user, 'afterRemote should include result');

          var options = {
            type: 'email',
            to: user.email,
            from: 'noreply@myapp.org',
            redirect: '/',
            protocol: ctx.req.protocol,
            host: ctx.req.get('host'),
          };

          user.verify(options, function(err, result) {
            assert(result.email);
            assert(result.email.response);
            assert(result.token);
            var msg = result.email.response.toString('utf-8');
            assert(~msg.indexOf('/api/test-users/confirm'));
            assert(~msg.indexOf('To: bar@bat.com'));

            done();
          });
        });

        request(app)
          .post('/test-users')
          .expect('Content-Type', /json/)
          .expect(200)
          .send({email: 'bar@bat.com', password: 'bar'})
          .end(function(err, res) {
            if (err) return done(err);
          });
      });

      it('Verify a user\'s email address - promise variant', function(done) {
        User.afterRemote('create', function(ctx, user, next) {
          assert(user, 'afterRemote should include result');

          var options = {
            type: 'email',
            to: user.email,
            from: 'noreply@myapp.org',
            redirect: '/',
            protocol: ctx.req.protocol,
            host: ctx.req.get('host'),
          };

          user.verify(options)
            .then(function(result) {
              assert(result.email);
              assert(result.email.response);
              assert(result.token);
              var msg = result.email.response.toString('utf-8');
              assert(~msg.indexOf('/api/test-users/confirm'));
              assert(~msg.indexOf('To: bar@bat.com'));

              done();
            })
            .catch(function(err) {
              done(err);
            });
        });

        request(app)
          .post('/test-users')
          .send({email: 'bar@bat.com', password: 'bar'})
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            if (err) return done(err);
          });
      });

      it('Verify a user\'s email address with custom header', function(done) {
        User.afterRemote('create', function(ctx, user, next) {
          assert(user, 'afterRemote should include result');

          var options = {
            type: 'email',
            to: user.email,
            from: 'noreply@myapp.org',
            redirect: '/',
            protocol: ctx.req.protocol,
            host: ctx.req.get('host'),
            headers: {'message-id': 'custom-header-value'},
          };

          user.verify(options, function(err, result) {
            assert(result.email);
            assert.equal(result.email.messageId, 'custom-header-value');

            done();
          });
        });

        request(app)
          .post('/test-users')
          .expect('Content-Type', /json/)
          .expect(200)
          .send({email: 'bar@bat.com', password: 'bar'})
          .end(function(err, res) {
            if (err) return done(err);
          });
      });

      it('Verify a user\'s email address with custom template function', function(done) {
        User.afterRemote('create', function(ctx, user, next) {
          assert(user, 'afterRemote should include result');

          var options = {
            type: 'email',
            to: user.email,
            from: 'noreply@myapp.org',
            redirect: '/',
            protocol: ctx.req.protocol,
            host: ctx.req.get('host'),
            templateFn: function(options, cb) {
              cb(null, 'custom template  - verify url: ' + options.verifyHref);
            },
          };

          user.verify(options, function(err, result) {
            assert(result.email);
            assert(result.email.response);
            assert(result.token);
            var msg = result.email.response.toString('utf-8');
            assert(~msg.indexOf('/api/test-users/confirm'));
            assert(~msg.indexOf('custom template'));
            assert(~msg.indexOf('To: bar@bat.com'));

            done();
          });
        });

        request(app)
          .post('/test-users')
          .expect('Content-Type', /json/)
          .expect(200)
          .send({email: 'bar@bat.com', password: 'bar'})
          .end(function(err, res) {
            if (err) return done(err);
          });
      });

      it('Verify uid exists in verify result when type object', function(done) {
        var idString = '58be263abc88dd483956030a';

        User.afterRemote('create', function(ctx, user, next) {
          assert(user, 'afterRemote should include result');

          var options = {
            type: 'email',
            to: user.email,
            from: 'noreply@myapp.org',
            redirect: '/',
            protocol: ctx.req.protocol,
            host: ctx.req.get('host'),
            templateFn: function(options, cb) {
              // console.log('idString: ' + idString);
              // console.log('verifyHref: ' + options.verifyHref);
              expect(options.verifyHref.indexOf('uid=' + idString)).to.be.at.least(1); // ?uid=xxxxxxxx
              cb(null, options.verifyHref);
            },
          };

          // replace the string id with an object
          // TODO: find a better way to do this
          Object.defineProperty(user, 'pk', {
            get: function() { return this.__data.pk; },
            set: function(value) { this.__data.pk = value; },
          });
          user.pk = {toString: function() { return idString; }};

          user.verify(options, function(err, result) {
            expect(result.uid).to.exist();
            expect(typeof result.uid).to.equal('object');
            expect(result.uid.toString()).to.equal(idString);
            done();
          });
        });

        request(app)
          .post('/test-users')
          .expect('Content-Type', /json/)
          .expect(200)
          .send({email: 'bar@bat.com', password: 'bar', pk: idString})
          .end(function(err, res) {
            if (err) return done(err);
          });
      });

      it('Verify a user\'s email address with custom token generator', function(done) {
        User.afterRemote('create', function(ctx, user, next) {
          assert(user, 'afterRemote should include result');

          var options = {
            type: 'email',
            to: user.email,
            from: 'noreply@myapp.org',
            redirect: '/',
            protocol: ctx.req.protocol,
            host: ctx.req.get('host'),
            generateVerificationToken: function(user, cb) {
              assert(user);
              assert.equal(user.email, 'bar@bat.com');
              assert(cb);
              assert.equal(typeof cb, 'function');
              // let's ensure async execution works on this one
              process.nextTick(function() {
                cb(null, 'token-123456');
              });
            },
          };

          user.verify(options, function(err, result) {
            assert(result.email);
            assert(result.email.response);
            assert(result.token);
            assert.equal(result.token, 'token-123456');
            var msg = result.email.response.toString('utf-8');
            assert(~msg.indexOf('token-123456'));

            done();
          });
        });

        request(app)
          .post('/test-users')
          .expect('Content-Type', /json/)
          .expect(200)
          .send({email: 'bar@bat.com', password: 'bar'})
          .end(function(err, res) {
            if (err) return done(err);
          });
      });

      it('Fails if custom token generator returns error', function(done) {
        User.afterRemote('create', function(ctx, user, next) {
          assert(user, 'afterRemote should include result');

          var options = {
            type: 'email',
            to: user.email,
            from: 'noreply@myapp.org',
            redirect: '/',
            protocol: ctx.req.protocol,
            host: ctx.req.get('host'),
            generateVerificationToken: function(user, cb) {
              // let's ensure async execution works on this one
              process.nextTick(function() {
                cb(new Error('Fake error'));
              });
            },
          };

          user.verify(options, function(err, result) {
            assert(err);
            assert.equal(err.message, 'Fake error');
            assert.equal(result, undefined);

            done();
          });
        });

        request(app)
          .post('/test-users')
          .expect('Content-Type', /json/)
          .expect(200)
          .send({email: 'bar@bat.com', password: 'bar'})
          .end(function(err, res) {
            if (err) return done(err);
          });
      });

      describe('Verification link port-squashing', function() {
        it('Do not squash non-80 ports for HTTP links', function(done) {
          User.afterRemote('create', function(ctx, user, next) {
            assert(user, 'afterRemote should include result');

            var options = {
              type: 'email',
              to: user.email,
              from: 'noreply@myapp.org',
              redirect: '/',
              protocol: 'http',
              host: 'myapp.org',
              port: 3000,
            };

            user.verify(options, function(err, result) {
              var msg = result.email.response.toString('utf-8');
              assert(~msg.indexOf('http://myapp.org:3000/'));

              done();
            });
          });

          request(app)
            .post('/test-users')
            .expect('Content-Type', /json/)
            .expect(200)
            .send({email: 'bar@bat.com', password: 'bar'})
            .end(function(err, res) {
              if (err) return done(err);
            });
        });

        it('Squash port 80 for HTTP links', function(done) {
          User.afterRemote('create', function(ctx, user, next) {
            assert(user, 'afterRemote should include result');

            var options = {
              type: 'email',
              to: user.email,
              from: 'noreply@myapp.org',
              redirect: '/',
              protocol: 'http',
              host: 'myapp.org',
              port: 80,
            };

            user.verify(options, function(err, result) {
              var msg = result.email.response.toString('utf-8');
              assert(~msg.indexOf('http://myapp.org/'));

              done();
            });
          });

          request(app)
            .post('/test-users')
            .expect('Content-Type', /json/)
            .expect(200)
            .send({email: 'bar@bat.com', password: 'bar'})
            .end(function(err, res) {
              if (err) return done(err);
            });
        });

        it('Do not squash non-443 ports for HTTPS links', function(done) {
          User.afterRemote('create', function(ctx, user, next) {
            assert(user, 'afterRemote should include result');

            var options = {
              type: 'email',
              to: user.email,
              from: 'noreply@myapp.org',
              redirect: '/',
              protocol: 'https',
              host: 'myapp.org',
              port: 3000,
            };

            user.verify(options, function(err, result) {
              var msg = result.email.response.toString('utf-8');
              assert(~msg.indexOf('https://myapp.org:3000/'));

              done();
            });
          });

          request(app)
            .post('/test-users')
            .expect('Content-Type', /json/)
            .expect(200)
            .send({email: 'bar@bat.com', password: 'bar'})
            .end(function(err, res) {
              if (err) return done(err);
            });
        });

        it('Squash port 443 for HTTPS links', function(done) {
          User.afterRemote('create', function(ctx, user, next) {
            assert(user, 'afterRemote should include result');

            var options = {
              type: 'email',
              to: user.email,
              from: 'noreply@myapp.org',
              redirect: '/',
              protocol: 'https',
              host: 'myapp.org',
              port: 443,
            };

            user.verify(options, function(err, result) {
              var msg = result.email.response.toString('utf-8');
              assert(~msg.indexOf('https://myapp.org/'));

              done();
            });
          });

          request(app)
            .post('/test-users')
            .expect('Content-Type', /json/)
            .expect(200)
            .send({email: 'bar@bat.com', password: 'bar'})
            .end(function(err, res) {
              if (err) return done(err);
            });
        });
      });

      it('should hide verification tokens from user JSON', function(done) {
        var user = new User({
          email: 'bar@bat.com',
          password: 'bar',
          verificationToken: 'a-token',
        });
        var data = user.toJSON();
        assert(!('verificationToken' in data));

        done();
      });

      it('should squash "//" when restApiRoot is "/"', function(done) {
        var emailBody;
        User.afterRemote('create', function(ctx, user, next) {
          assert(user, 'afterRemote should include result');

          var options = {
            type: 'email',
            to: user.email,
            from: 'noreply@myapp.org',
            redirect: '/',
            host: 'myapp.org',
            port: 3000,
            restApiRoot: '/',
          };

          user.verify(options, function(err, result) {
            if (err) return next(err);
            emailBody = result.email.response.toString('utf-8');
            next();
          });
        });

        request(app)
          .post('/test-users')
          .expect('Content-Type', /json/)
          .expect(200)
          .send({email: 'user@example.com', password: 'pass'})
          .end(function(err, res) {
            if (err) return done(err);
            expect(emailBody)
              .to.contain('http://myapp.org:3000/test-users/confirm');
            done();
          });
      });

      it('removes "options.template" from Email payload', function() {
        var MailerMock = {
          send: function(options, cb) { cb(null, options); },
        };

        return User.create({email: 'user@example.com', password: 'pass'})
          .then(function(user) {
            return user.verify({
              type: 'email',
              from: 'noreply@example.com',
              mailer: MailerMock,
            });
          })
          .then(function(result) {
            expect(result.email).to.not.have.property('template');
          });
      });

      it('allows hash fragment in redirectUrl', function() {
        return User.create({email: 'test@example.com', password: 'pass'})
          .then(user => {
            let actualVerifyHref;
            return user.verify({
              type: 'email',
              to: user.email,
              from: 'noreply@myapp.org',
              redirect: '#/some-path?a=1&b=2',
              templateFn: (options, cb) => {
                actualVerifyHref = options.verifyHref;
                cb(null, 'dummy body');
              },
            })
            .then(() => actualVerifyHref);
          })
          .then(verifyHref => {
            var parsed = url.parse(verifyHref, true);
            expect(parsed.query.redirect, 'redirect query')
              .to.equal('#/some-path?a=1&b=2');
          });
      });

      it('verify that options.templateFn receives options.verificationToken', function() {
        return User.create({email: 'test1@example.com', password: 'pass'})
          .then(user => {
            let actualVerificationToken;
            return user.verify({
              type: 'email',
              to: user.email,
              from: 'noreply@myapp.org',
              redirect: '#/some-path?a=1&b=2',
              templateFn: (options, cb) => {
                actualVerificationToken = options.verificationToken;
                cb(null, 'dummy body');
              },
            })
            .then(() => actualVerificationToken);
          })
          .then(token => {
            expect(token).to.exist();
          });
      });
    });

    describe('User.confirm(options, fn)', function() {
      var options;

      function testConfirm(testFunc, done) {
        User.afterRemote('create', function(ctx, user, next) {
          assert(user, 'afterRemote should include result');

          options = {
            type: 'email',
            to: user.email,
            from: 'noreply@myapp.org',
            redirect: 'http://foo.com/bar',
            protocol: ctx.req.protocol,
            host: ctx.req.get('host'),
          };

          user.verify(options, function(err, result) {
            if (err) return done(err);

            testFunc(result, done);
          });
        });

        request(app)
          .post('/test-users')
          .expect('Content-Type', /json/)
          .expect(302)
          .send({email: 'bar@bat.com', password: 'bar'})
          .end(function(err, res) {
            if (err) return done(err);
          });
      }

      it('Confirm a user verification', function(done) {
        testConfirm(function(result, done) {
          request(app)
            .get('/test-users/confirm?uid=' + (result.uid) +
              '&token=' + encodeURIComponent(result.token) +
              '&redirect=' + encodeURIComponent(options.redirect))
            .expect(302)
            .end(function(err, res) {
              if (err) return done(err);

              done();
            });
        }, done);
      });

      it('sets verificationToken to null after confirmation', function(done) {
        testConfirm(function(result, done) {
          User.confirm(result.uid, result.token, false, function(err) {
            if (err) return done(err);

            // Verify by loading user data stored in the datasource
            User.findById(result.uid, function(err, user) {
              if (err) return done(err);
              expect(user).to.have.property('verificationToken', null);
              done();
            });
          });
        }, done);
      });

      it('Should report 302 when redirect url is set', function(done) {
        testConfirm(function(result, done) {
          request(app)
            .get('/test-users/confirm?uid=' + (result.uid) +
              '&token=' + encodeURIComponent(result.token) +
              '&redirect=http://foo.com/bar')
            .expect(302)
            .expect('Location', 'http://foo.com/bar')
            .end(done);
        }, done);
      });

      it('Should report 204 when redirect url is not set', function(done) {
        testConfirm(function(result, done) {
          request(app)
            .get('/test-users/confirm?uid=' + (result.uid) +
              '&token=' + encodeURIComponent(result.token))
            .expect(204)
            .end(done);
        }, done);
      });

      it('Report error for invalid user id during verification', function(done) {
        testConfirm(function(result, done) {
          request(app)
            .get('/test-users/confirm?uid=' + (result.uid + '_invalid') +
               '&token=' + encodeURIComponent(result.token) +
               '&redirect=' + encodeURIComponent(options.redirect))
            .expect(404)
            .end(function(err, res) {
              if (err) return done(err);

              var errorResponse = res.body.error;
              assert(errorResponse);
              assert.equal(errorResponse.code, 'USER_NOT_FOUND');

              done();
            });
        }, done);
      });

      it('Report error for invalid token during verification', function(done) {
        testConfirm(function(result, done) {
          request(app)
            .get('/test-users/confirm?uid=' + result.uid +
              '&token=' + encodeURIComponent(result.token) + '_invalid' +
              '&redirect=' + encodeURIComponent(options.redirect))
            .expect(400)
            .end(function(err, res) {
              if (err) return done(err);

              var errorResponse = res.body.error;
              assert(errorResponse);
              assert.equal(errorResponse.code, 'INVALID_TOKEN');

              done();
            });
        }, done);
      });
    });
  });

  describe('Password Reset', function() {
    describe('User.resetPassword(options, cb)', function() {
      var options = {
        email: 'foo@bar.com',
        redirect: 'http://foobar.com/reset-password',
      };

      it('Requires email address to reset password', function(done) {
        User.resetPassword({ }, function(err) {
          assert(err);
          assert.equal(err.code, 'EMAIL_REQUIRED');

          done();
        });
      });

      it('Requires email address to reset password - promise variant', function(done) {
        User.resetPassword({ })
          .then(function() {
            throw new Error('Error should NOT be thrown');
          })
          .catch(function(err) {
            assert(err);
            assert.equal(err.code, 'EMAIL_REQUIRED');

            done();
          });
      });

      it('Reports when email is not found', function(done) {
        User.resetPassword({email: 'unknown@email.com'}, function(err) {
          assert(err);
          assert.equal(err.code, 'EMAIL_NOT_FOUND');
          assert.equal(err.statusCode, 404);

          done();
        });
      });

      it('Checks that options exist', function(done) {
        var calledBack = false;

        User.resetPassword(options, function() {
          calledBack = true;
        });

        User.once('resetPasswordRequest', function(info) {
          assert(info.options);
          assert.equal(info.options, options);
          assert(calledBack);

          done();
        });
      });

      it('Creates a temp accessToken to allow a user to change password', function(done) {
        var calledBack = false;

        User.resetPassword({
          email: options.email,
        }, function() {
          calledBack = true;
        });

        User.once('resetPasswordRequest', function(info) {
          assert(info.email);
          assert(info.accessToken);
          assert(info.accessToken.id);
          assert.equal(info.accessToken.ttl / 60, 15);
          assert(calledBack);
          info.accessToken.user(function(err, user) {
            if (err) return done(err);

            assert.equal(user.email, options.email);

            done();
          });
        });
      });

      it('calls createAccessToken() to create the token', function(done) {
        User.prototype.createAccessToken = function(ttl, cb) {
          cb(null, new AccessToken({id: 'custom-token'}));
        };

        User.resetPassword({email: options.email}, function() {});

        User.once('resetPasswordRequest', function(info) {
          expect(info.accessToken.id).to.equal('custom-token');
          done();
        });
      });

      it('Password reset over REST rejected without email address', function(done) {
        request(app)
          .post('/test-users/reset')
          .expect('Content-Type', /json/)
          .expect(400)
          .send({ })
          .end(function(err, res) {
            if (err) return done(err);

            var errorResponse = res.body.error;
            assert(errorResponse);
            assert.equal(errorResponse.code, 'EMAIL_REQUIRED');

            done();
          });
      });

      it('Password reset over REST requires email address', function(done) {
        request(app)
          .post('/test-users/reset')
          .expect('Content-Type', /json/)
          .expect(204)
          .send({email: options.email})
          .end(function(err, res) {
            if (err) return done(err);

            assert.deepEqual(res.body, '');

            done();
          });
      });

      describe('User.resetPassword(options, cb) requiring realm', function() {
        var realmUser;

        beforeEach(function(done) {
          User.create(validCredentialsWithRealm, function(err, u) {
            if (err) return done(err);

            realmUser = u;
            done();
          });
        });

        it('Reports when email is not found in realm', function(done) {
          User.resetPassword({
            email: realmUser.email,
            realm: 'unknown',
          }, function(err) {
            assert(err);
            assert.equal(err.code, 'EMAIL_NOT_FOUND');
            assert.equal(err.statusCode, 404);

            done();
          });
        });

        it('Creates a temp accessToken to allow user in realm to change password', function(done) {
          var calledBack = false;

          User.resetPassword({
            email: realmUser.email,
            realm: realmUser.realm,
          }, function() {
            calledBack = true;
          });

          User.once('resetPasswordRequest', function(info) {
            assert(info.email);
            assert(info.accessToken);
            assert(info.accessToken.id);
            assert.equal(info.accessToken.ttl / 60, 15);
            assert(calledBack);
            info.accessToken.user(function(err, user) {
              if (err) return done(err);

              assert.equal(user.email, realmUser.email);

              done();
            });
          });
        });
      });
    });
  });

  describe('AccessToken (session) invalidation', function() {
    var user, originalUserToken1, originalUserToken2, newUserCreated;
    var currentEmailCredentials = {email: 'original@example.com', password: 'bar'};
    var updatedEmailCredentials = {email: 'updated@example.com', password: 'bar'};
    var newUserCred = {email: 'newuser@example.com', password: 'newpass'};

    beforeEach('create user then login', function createAndLogin(done) {
      async.series([
        function createUserWithOriginalEmail(next) {
          User.create(currentEmailCredentials, function(err, userCreated) {
            if (err) return next(err);
            user = userCreated;
            next();
          });
        },
        function firstLoginWithOriginalEmail(next) {
          User.login(currentEmailCredentials, function(err, accessToken1) {
            if (err) return next(err);
            assert(accessToken1.userId);
            originalUserToken1 = accessToken1;
            next();
          });
        },
        function secondLoginWithOriginalEmail(next) {
          User.login(currentEmailCredentials, function(err, accessToken2) {
            if (err) return next(err);
            assert(accessToken2.userId);
            originalUserToken2 = accessToken2;
            next();
          });
        },
      ], done);
    });

    it('invalidates sessions when email is changed using `updateAttributes`', function(done) {
      user.updateAttributes(
        {email: updatedEmailCredentials.email},
        function(err, userInstance) {
          if (err) return done(err);
          assertNoAccessTokens(done);
        });
    });

    it('invalidates sessions after `replaceAttributes`', function(done) {
      // The way how the invalidation is implemented now, all sessions
      // are invalidated on a full replace
      user.replaceAttributes(currentEmailCredentials, function(err, userInstance) {
        if (err) return done(err);
        assertNoAccessTokens(done);
      });
    });

    it('invalidates sessions when email is changed using `updateOrCreate`', function(done) {
      User.updateOrCreate({
        pk: user.pk,
        email: updatedEmailCredentials.email,
      }, function(err, userInstance) {
        if (err) return done(err);
        assertNoAccessTokens(done);
      });
    });

    it('invalidates sessions after `replaceById`', function(done) {
      // The way how the invalidation is implemented now, all sessions
      // are invalidated on a full replace
      User.replaceById(user.pk, currentEmailCredentials, function(err, userInstance) {
        if (err) return done(err);
        assertNoAccessTokens(done);
      });
    });

    it('invalidates sessions after `replaceOrCreate`', function(done) {
      // The way how the invalidation is implemented now, all sessions
      // are invalidated on a full replace
      User.replaceOrCreate({
        pk: user.pk,
        email: currentEmailCredentials.email,
        password: currentEmailCredentials.password,
      }, function(err, userInstance) {
        if (err) return done(err);
        assertNoAccessTokens(done);
      });
    });

    it('keeps sessions AS IS if firstName is added using `updateAttributes`', function(done) {
      user.updateAttributes({'firstName': 'Janny'}, function(err, userInstance) {
        if (err) return done(err);
        assertPreservedTokens(done);
      });
    });

    it('keeps sessions AS IS when calling save() with no changes', function(done) {
      user.save(function(err) {
        if (err) return done(err);
        assertPreservedTokens(done);
      });
    });

    it('keeps sessions AS IS if firstName is added using `updateOrCreate`', function(done) {
      User.updateOrCreate({
        pk: user.pk,
        firstName: 'Loay',
        email: currentEmailCredentials.email,
      }, function(err, userInstance) {
        if (err) return done(err);
        assertPreservedTokens(done);
      });
    });

    it('keeps sessions AS IS if a new user is created using `create`', function(done) {
      async.series([
        function(next) {
          User.create(newUserCred, function(err, newUserInstance) {
            if (err) return done(err);
            newUserCreated = newUserInstance;
            next();
          });
        },
        function(next) {
          User.login(newUserCred, function(err, newAccessToken) {
            if (err) return done(err);
            assert(newAccessToken.id);
            assertPreservedTokens(next);
          });
        },
      ], done);
    });

    it('keeps sessions AS IS if a new user is created using `updateOrCreate`', function(done) {
      async.series([
        function(next) {
          User.create(newUserCred, function(err, newUserInstance2) {
            if (err) return done(err);
            newUserCreated = newUserInstance2;
            next();
          });
        },
        function(next) {
          User.login(newUserCred, function(err, newAccessToken2) {
            if (err) return done(err);
            assert(newAccessToken2.id);
            assertPreservedTokens(next);
          });
        },
      ], done);
    });

    it('keeps sessions AS IS if non-email property is changed using updateAll', function(done) {
      var userPartial;
      async.series([
        function createPartialUser(next) {
          User.create(
            {email: 'partial@example.com', password: 'pass1', age: 25},
            function(err, partialInstance) {
              if (err) return next(err);
              userPartial = partialInstance;
              next();
            });
        },
        function loginPartiallUser(next) {
          User.login({email: 'partial@example.com', password: 'pass1'}, function(err, ats) {
            if (err) return next(err);
            next();
          });
        },
        function updatePartialUser(next) {
          User.updateAll(
            {pk: userPartial.pk},
            {age: userPartial.age + 1},
            function(err, info) {
              if (err) return next(err);
              next();
            });
        },
        function verifyTokensOfPartialUser(next) {
          AccessToken.find({where: {userId: userPartial.pk}}, function(err, tokens1) {
            if (err) return next(err);
            expect(tokens1.length).to.equal(1);
            next();
          });
        },
      ], done);
    });

    it('preserves other users\' sessions if their email is  untouched', function(done) {
      var user1, user2, user3;
      async.series([
        function(next) {
          User.create({email: 'user1@example.com', password: 'u1pass'}, function(err, u1) {
            if (err) return done(err);
            User.create({email: 'user2@example.com', password: 'u2pass'}, function(err, u2) {
              if (err) return done(err);
              User.create({email: 'user3@example.com', password: 'u3pass'}, function(err, u3) {
                if (err) return done(err);
                user1 = u1;
                user2 = u2;
                user3 = u3;
                next();
              });
            });
          });
        },
        function(next) {
          User.login(
            {email: 'user1@example.com', password: 'u1pass'},
            function(err, accessToken1) {
              if (err) return next(err);
              User.login(
                {email: 'user2@example.com', password: 'u2pass'},
                function(err, accessToken2) {
                  if (err) return next(err);
                  User.login({email: 'user3@example.com', password: 'u3pass'},
                  function(err, accessToken3) {
                    if (err) return next(err);
                    next();
                  });
                });
            });
        },
        function(next) {
          user2.updateAttribute('email', 'user2Update@b.com', function(err, userInstance) {
            if (err) return next(err);
            assert.equal(userInstance.email, 'user2Update@b.com');
            next();
          });
        },
        function(next) {
          AccessToken.find({where: {userId: user1.pk}}, function(err, tokens1) {
            if (err) return next(err);
            AccessToken.find({where: {userId: user2.pk}}, function(err, tokens2) {
              if (err) return next(err);
              AccessToken.find({where: {userId: user3.pk}}, function(err, tokens3) {
                if (err) return next(err);

                expect(tokens1.length).to.equal(1);
                expect(tokens2.length).to.equal(0);
                expect(tokens3.length).to.equal(1);
                next();
              });
            });
          });
        },
      ], done);
    });

    it('invalidates correct sessions after changing email using updateAll', function(done) {
      var userSpecial, userNormal;
      async.series([
        function createSpecialUser(next) {
          User.create(
              {email: 'special@example.com', password: 'pass1', name: 'Special'},
              function(err, specialInstance) {
                if (err) return next(err);
                userSpecial = specialInstance;
                next();
              });
        },
        function loginSpecialUser(next) {
          User.login({email: 'special@example.com', password: 'pass1'}, function(err, ats) {
            if (err) return next(err);
            next();
          });
        },
        function updateSpecialUser(next) {
          User.updateAll(
                {name: 'Special'},
                {email: 'superspecial@example.com'}, function(err, info) {
                  if (err) return next(err);
                  next();
                });
        },
        function verifyTokensOfSpecialUser(next) {
          AccessToken.find({where: {userId: userSpecial.pk}}, function(err, tokens1) {
            if (err) return done(err);
            expect(tokens1.length, 'tokens - special user tokens').to.equal(0);
            next();
          });
        },
        assertPreservedTokens,
      ], done);
    });

    it('invalidates session when password is reset', function(done) {
      user.updateAttribute('password', 'newPass', function(err, user2) {
        if (err) return done(err);
        assertNoAccessTokens(done);
      });
    });

    it('preserves current session', function(done) {
      var options = {accessToken: originalUserToken1};
      user.updateAttribute('email', 'new@example.com', options, function(err) {
        if (err) return done(err);
        AccessToken.find({where: {userId: user.pk}}, function(err, tokens) {
          if (err) return done(err);
          var tokenIds = tokens.map(function(t) { return t.id; });
          expect(tokenIds).to.eql([originalUserToken1.id]);
          done();
        });
      });
    });

    it('preserves other user sessions if their password is  untouched', function(done) {
      var user1, user2, user1Token;
      async.series([
        function(next) {
          User.create({email: 'user1@example.com', password: 'u1pass'}, function(err, u1) {
            if (err) return done(err);
            User.create({email: 'user2@example.com', password: 'u2pass'}, function(err, u2) {
              if (err) return done(err);
              user1 = u1;
              user2 = u2;
              next();
            });
          });
        },
        function(next) {
          User.login({email: 'user1@example.com', password: 'u1pass'}, function(err, at1) {
            User.login({email: 'user2@example.com', password: 'u2pass'}, function(err, at2) {
              assert(at1.userId);
              assert(at2.userId);
              user1Token = at1.id;
              next();
            });
          });
        },
        function(next) {
          user2.updateAttribute('password', 'newPass', function(err, user2Instance) {
            if (err) return next(err);
            assert(user2Instance);
            next();
          });
        },
        function(next) {
          AccessToken.find({where: {userId: user1.pk}}, function(err, tokens1) {
            if (err) return next(err);
            AccessToken.find({where: {userId: user2.pk}}, function(err, tokens2) {
              if (err) return next(err);
              expect(tokens1.length).to.equal(1);
              expect(tokens2.length).to.equal(0);
              assert.equal(tokens1[0].id, user1Token);
              next();
            });
          });
        },
      ], function(err) {
        done();
      });
    });

    // See https://github.com/strongloop/loopback/issues/3215
    it('handles subclassed user with no accessToken relation', () => {
      // setup a new LoopBack app, we don't want to use shared models
      app = loopback({localRegistry: true, loadBuiltinModels: true});
      app.set('_verifyAuthModelRelations', false);
      app.set('remoting', {errorHandler: {debug: true, log: false}});
      app.dataSource('db', {connector: 'memory'});
      const User = app.registry.createModel({
        name: 'user',
        base: 'User',
      });
      app.model(User, {dataSource: 'db'});
      app.enableAuth({dataSource: 'db'});
      expect(app.models.User.modelName).to.eql('user');

      return User.create(validCredentials)
        .then(u => {
          u.email = 'updated@example.com';
          return u.save();
          // the test passes when save() does not throw any error
        });
    });

    function assertPreservedTokens(done) {
      AccessToken.find({where: {userId: user.pk}}, function(err, tokens) {
        if (err) return done(err);
        var actualIds = tokens.map(function(t) { return t.id; });
        actualIds.sort();
        var expectedIds = [originalUserToken1.id, originalUserToken2.id];
        expectedIds.sort();
        expect(actualIds).to.eql(expectedIds);
        done();
      });
    };

    function assertNoAccessTokens(done) {
      AccessToken.find({where: {userId: user.pk}}, function(err, tokens) {
        if (err) return done(err);
        expect(tokens.length).to.equal(0);
        done();
      });
    }
  });

  describe('Verification after updating email', function() {
    var NEW_EMAIL = 'updated@example.com';
    var userInstance;

    beforeEach(createOriginalUser);

    it('sets verification to false after email update if verification is required',
    function(done) {
      User.settings.emailVerificationRequired = true;
      async.series([
        function updateUser(next) {
          userInstance.updateAttribute('email', NEW_EMAIL, function(err, info) {
            if (err) return next(err);
            assert.equal(info.email, NEW_EMAIL);
            next();
          });
        },
        function findUser(next) {
          User.findById(userInstance.pk, function(err, info) {
            if (err) return next(err);
            assert.equal(info.email, NEW_EMAIL);
            assert.equal(info.emailVerified, false);
            next();
          });
        },
      ], done);
    });

    it('leaves verification as is after email update if verification is not required',
    function(done) {
      User.settings.emailVerificationRequired = false;
      async.series([
        function updateUser(next) {
          userInstance.updateAttribute('email', NEW_EMAIL, function(err, info) {
            if (err) return next(err);
            assert.equal(info.email, NEW_EMAIL);
            next();
          });
        },
        function findUser(next) {
          User.findById(userInstance.pk, function(err, info) {
            if (err) return next(err);
            assert.equal(info.email, NEW_EMAIL);
            assert.equal(info.emailVerified, true);
            next();
          });
        },
      ], done);
    });

    it('should not set verification to false after something other than email is updated',
      function(done) {
        User.settings.emailVerificationRequired = true;
        async.series([
          function updateUser(next) {
            userInstance.updateAttribute('realm', 'test', function(err, info) {
              if (err) return next(err);
              assert.equal(info.realm, 'test');
              next();
            });
          },
          function findUser(next) {
            User.findById(userInstance.pk, function(err, info) {
              if (err) return next(err);
              assert.equal(info.realm, 'test');
              assert.equal(info.emailVerified, true);
              next();
            });
          },
        ], done);
      });

    function createOriginalUser(done) {
      var userData = {
        email: 'original@example.com',
        password: 'bar',
        emailVerified: true,
      };
      User.create(userData, function(err, instance) {
        if (err) return done(err);
        userInstance = instance;
        done();
      });
    }
  });

  describe('password reset with/without email verification', function() {
    it('allows resetPassword by email if email verification is required and done',
    function(done) {
      User.settings.emailVerificationRequired = true;
      var email = validCredentialsEmailVerified.email;

      User.resetPassword({email: email}, function(err, info) {
        if (err) return done(err);
        done();
      });
    });

    it('disallows resetPassword by email if email verification is required and not done',
    function(done) {
      User.settings.emailVerificationRequired = true;
      var email = validCredentialsEmail;

      User.resetPassword({email: email}, function(err) {
        assert(err);
        assert.equal(err.code, 'RESET_FAILED_EMAIL_NOT_VERIFIED');
        assert.equal(err.statusCode, 401);
        done();
      });
    });

    it('allows resetPassword by email if email verification is not required',
    function(done) {
      User.settings.emailVerificationRequired = false;
      var email = validCredentialsEmail;

      User.resetPassword({email: email}, function(err) {
        if (err) return done(err);
        done();
      });
    });
  });

  describe('ctor', function() {
    it('exports default Email model', function() {
      expect(User.email, 'User.email').to.be.a('function');
      expect(User.email.modelName, 'modelName').to.eql('Email');
    });

    it('exports default AccessToken model', function() {
      expect(User.accessToken, 'User.accessToken').to.be.a('function');
      expect(User.accessToken.modelName, 'modelName').to.eql('AccessToken');
    });
  });

  describe('ttl', function() {
    var User2;
    beforeEach(function() {
      User2 = loopback.User.extend('User2', {}, {ttl: 10});
    });
    it('should override ttl setting in based User model', function() {
      expect(User2.settings.ttl).to.equal(10);
    });
  });
});
