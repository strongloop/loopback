// Copyright IBM Corp. 2013,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

require('./support');
var loopback = require('../');
var User, AccessToken;
var async = require('async');

describe('User', function() {
  var validCredentialsEmail = 'foo@bar.com';
  var validCredentials = {email: validCredentialsEmail, password: 'bar'};
  var validCredentialsEmailVerified = {email: 'foo1@bar.com', password: 'bar1', emailVerified: true};
  var validCredentialsEmailVerifiedOverREST = {email: 'foo2@bar.com', password: 'bar2', emailVerified: true};
  var validCredentialsWithTTL = {email: 'foo@bar.com', password: 'bar', ttl: 3600};
  var validCredentialsWithTTLAndScope = {email: 'foo@bar.com', password: 'bar', ttl: 3600, scope: 'all'};
  var validMixedCaseEmailCredentials = {email: 'Foo@bar.com', password: 'bar'};
  var invalidCredentials = {email: 'foo1@bar.com', password: 'invalid'};
  var incompleteCredentials = {password: 'bar1'};

  // Create a local app variable to prevent clashes with the global
  // variable shared by all tests. While this should not be necessary if
  // the tests were written correctly, it turns out that's not the case :(
  var app;

  beforeEach(function setupAppAndModels(done) {
    // override the global app object provided by test/support.js
    // and create a local one that does not share state with other tests
    app = loopback({ localRegistry: true, loadBuiltinModels: true });
    app.dataSource('db', { connector: 'memory' });

    // setup Email model, it's needed by User tests
    app.dataSource('email', {
      connector: loopback.Mail,
      transports: [{ type: 'STUB' }],
    });
    var Email = app.registry.getModel('Email');
    app.model(Email, { dataSource: 'email' });

    // attach User and related models
    User = app.registry.createModel('TestUser', {}, {
      base: 'User',
      http: { path: 'test-users' },
    });
    app.model(User, { dataSource: 'db' });

    AccessToken = app.registry.getModel('AccessToken');
    app.model(AccessToken, { dataSource: 'db' });

    User.email = Email;

    // Update the AccessToken relation to use the subclass of User
    AccessToken.belongsTo(User, {as: 'user', foreignKey: 'userId'});
    User.hasMany(AccessToken, {as: 'accessTokens', foreignKey: 'userId'});

    // Speed up the password hashing algorithm
    // for tests using the built-in User model
    User.settings.saltWorkFactor = 4;

    // allow many User.afterRemote's to be called
    User.setMaxListeners(0);

    app.enableAuth({ dataSource: 'db' });
    app.use(loopback.token({ model: AccessToken }));
    app.use(loopback.rest());
    app.model(User);

    User.create(validCredentials, function(err, user) {
      if (err) return done(err);

      User.create(validCredentialsEmailVerified, done);
    });
  });

  describe('User.create', function() {
    it('Create a new user', function(done) {
      User.create({email: 'f@b.com', password: 'bar'}, function(err, user) {
        assert(!err);
        assert(user.id);
        assert(user.email);

        done();
      });
    });

    it('Create a new user (email case-sensitivity off)', function(done) {
      User.settings.caseSensitiveEmail = false;
      User.create({email: 'F@b.com', password: 'bar'}, function(err, user) {
        if (err) return done(err);

        assert(user.id);
        assert.equal(user.email, user.email.toLowerCase());

        done();
      });
    });

    it('Create a new user (email case-sensitive)', function(done) {
      User.create({email: 'F@b.com', password: 'bar'}, function(err, user) {
        if (err) return done(err);

        assert(user.id);
        assert(user.email);
        assert.notEqual(user.email, user.email.toLowerCase());

        done();
      });
    });

    it('credentials/challenges are object types', function(done) {
      User.create({email: 'f1@b.com', password: 'bar1',
        credentials: {cert: 'xxxxx', key: '111'},
        challenges: {x: 'X', a: 1}
      }, function(err, user) {
        assert(!err);
        User.findById(user.id, function(err, user) {
          assert(user.id);
          assert(user.email);
          assert.deepEqual(user.credentials, { cert: 'xxxxx', key: '111' });
          assert.deepEqual(user.challenges, { x: 'X', a: 1 });

          done();
        });
      });
    });

    it('Email is required', function(done) {
      User.create({password: '123'}, function(err) {
        assert(err);
        assert.equal(err.name, 'ValidationError');
        assert.equal(err.statusCode, 422);
        assert.equal(err.details.context, User.modelName);
        assert.deepEqual(err.details.codes.email, [
          'presence',
          'format.null'
        ]);

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

        done();
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

        User.create({ email: 'a@b.com', password: 'batbaz' }, function(err) {
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
          User.create({ email: 'b@c.com', password: 'bar' }, function(err, user) {
            usersId = user.id;
            next(err);
          });
        },
        function(next) {
          User.login({ email: 'b@c.com', password: 'bar' }, function(err, accessToken) {
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
            AccessToken.find({ where: { userId: usersId }}, function(err, tokens) {
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
      var usersId, accessTokenId;
      async.series([
        function(next) {
          User.create([{ name: 'myname', email: 'b@c.com', password: 'bar' },
          { name: 'myname', email: 'd@c.com', password: 'bar' }], function(err, user) {
            usersId = user.id;
            next(err);
          });
        },
        function(next) {
          User.login({ email: 'b@c.com', password: 'bar' }, function(err, accessToken) {
            accessTokenId = accessToken.userId;
            if (err) return next (err);
            assert(accessTokenId);
            next();
          });
        },
        function(next) {
          User.login({ email: 'd@c.com', password: 'bar' }, function(err, accessToken) {
            accessTokenId = accessToken.userId;
            if (err) return next (err);
            assert(accessTokenId);
            next();
          });
        },
        function(next) {
          User.deleteAll({ name: 'myname' }, function(err, user) {
            next(err);
          });
        },
        function(next) {
          User.find({ where: { name: 'myname' }}, function(err, userFound)  {
            if (err) return next (err);
            expect(userFound.length).to.equal(0);
            AccessToken.find({ where: { userId: usersId }}, function(err, tokens) {
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
      var defaultHashPassword;
      var defaultValidatePassword;

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

  describe('Access-hook for queries with email NOT case-sensitive', function() {
    it('Should not throw an error if the query does not contain {where: }', function(done) {
      User.find({}, function(err) {
        if (err) done(err);

        done();
      });
    });

    it('Should be able to find lowercase email with mixed-case email query', function(done) {
      User.settings.caseSensitiveEmail = false;
      User.find({where:{email: validMixedCaseEmailCredentials.email}}, function(err, result) {
        if (err) done(err);

        assert(result[0], 'The query did not find the user');
        assert.equal(result[0].email, validCredentialsEmail);

        done();
      });
    });
  });

  describe('User.login', function() {
    it('Login a user by providing credentials', function(done) {
      User.login(validCredentials, function(err, accessToken) {
        assert(accessToken.userId);
        assert(accessToken.id);
        assert.equal(accessToken.id.length, 64);

        done();
      });
    });

    it('Login a user by providing email credentials (email case-sensitivity off)', function(done) {
      User.settings.caseSensitiveEmail = false;
      User.login(validMixedCaseEmailCredentials, function(err, accessToken) {
        assert(accessToken.userId);
        assert(accessToken.id);
        assert.equal(accessToken.id.length, 64);

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
        assert(accessToken.userId);
        assert(accessToken.id);
        assert.equal(accessToken.ttl, validCredentialsWithTTL.ttl);
        assert.equal(accessToken.id.length, 64);

        done();
      });
    });

    it('honors default `createAccessToken` implementation', function(done) {
      User.login(validCredentialsWithTTL, function(err, accessToken) {
        assert(accessToken.userId);
        assert(accessToken.id);

        User.findById(accessToken.userId, function(err, user) {
          user.createAccessToken(120, function(err, accessToken) {
            assert(accessToken.userId);
            assert(accessToken.id);
            assert.equal(accessToken.ttl, 120);
            assert.equal(accessToken.id.length, 64);

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
              assert(accessToken.userId);
              assert(accessToken.id);
              assert.equal(accessToken.ttl, 120);
              assert.equal(accessToken.id.length, 64);

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
        this.accessTokens.create({ttl: ttl / 2 }, cb);
      };
      User.login(validCredentialsWithTTL, function(err, accessToken) {
        assert(accessToken.userId);
        assert(accessToken.id);
        assert.equal(accessToken.ttl, 1800);
        assert.equal(accessToken.id.length, 64);

        User.findById(accessToken.userId, function(err, user) {
          user.createAccessToken(120, function(err, accessToken) {
            assert(accessToken.userId);
            assert(accessToken.id);
            assert.equal(accessToken.ttl, 60);
            assert.equal(accessToken.id.length, 64);
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
          assert(accessToken.userId);
          assert(accessToken.id);
          assert.equal(accessToken.ttl, 1800);
          assert.equal(accessToken.id.length, 64);
          assert.equal(accessToken.scopes, 'all');

          User.findById(accessToken.userId, function(err, user) {
            user.createAccessToken(120, {scope: 'default'}, function(err, accessToken) {
              assert(accessToken.userId);
              assert(accessToken.id);
              assert.equal(accessToken.ttl, 60);
              assert.equal(accessToken.id.length, 64);
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
          assert(!accessToken);

          done();
        })
        .catch(function(err) {
          assert(err);
          assert.equal(err.code, 'LOGIN_FAILED');

          done();
        });
    });

    it('Login a user providing incomplete credentials', function(done) {
      User.login(incompleteCredentials, function(err, accessToken) {
        assert(err);
        assert.equal(err.code, 'USERNAME_EMAIL_REQUIRED');

        done();
      });
    });

    it('Login a user providing incomplete credentials - promise variant', function(done) {
      User.login(incompleteCredentials)
        .then(function(accessToken) {
          assert(!accessToken);

          done();
        })
        .catch(function(err) {
          assert(err);
          assert.equal(err.code, 'USERNAME_EMAIL_REQUIRED');

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

          assert(accessToken.userId);
          assert(accessToken.id);
          assert.equal(accessToken.id.length, 64);
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
  });

  function assertGoodToken(accessToken) {
    assert(accessToken.userId);
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
      User.login({ email: validCredentialsEmail }, function(err, accessToken) {
        // strongloop/loopback#931
        // error message should be "login failed" and not "login failed as the email has not been verified"
        assert(err && !/verified/.test(err.message), ('expecting "login failed" error message, received: "' + err.message + '"'));
        assert.equal(err.code, 'LOGIN_FAILED');

        done();
      });
    });

    it('Require valid and complete credentials for email verification error - promise variant', function(done) {
      User.login({ email: validCredentialsEmail })
        .then(function(accessToken) {
        done();
      })
      .catch(function(err) {
        // strongloop/loopback#931
        // error message should be "login failed" and not "login failed as the email has not been verified"
        assert(err && !/verified/.test(err.message), ('expecting "login failed" error message, received: "' + err.message + '"'));
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
        assertGoodToken(accessToken);

        done();
      });
    });

    it('Login a user by with email verification - promise variant', function(done) {
      User.login(validCredentialsEmailVerified)
        .then(function(accessToken) {
          assertGoodToken(accessToken);

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

          assertGoodToken(accessToken);
          assert(accessToken.user === undefined);

          done();
        });
    });

    it('Login a user over REST require complete and valid credentials for email verification error message', function(done) {
      request(app)
        .post('/test-users/login')
        .expect('Content-Type', /json/)
        .expect(401)
        .send({ email: validCredentialsEmail })
        .end(function(err, res) {
          if (err) return done(err);

          // strongloop/loopback#931
          // error message should be "login failed" and not "login failed as the email has not been verified"
          var errorResponse = res.body.error;
          assert(errorResponse && !/verified/.test(errorResponse.message), ('expecting "login failed" error message, received: "' + errorResponse.message + '"'));
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
    var User;
    var AccessToken;

    beforeEach(function() {
      User = app.registry.createModel('RealmUser', {}, {
        base: 'TestUser',
        realmRequired: true,
        realmDelimiter: ':',
      });

      AccessToken = app.registry.createModel('RealmAccessToken', {}, {
        base: 'AccessToken',
      });

      app.model(AccessToken, { dataSource: 'db' });
      app.model(User, { dataSource: 'db' });

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
      password: 'pass100'
    };

    var realm2User = {
      realm: 'realm2',
      username: 'foo100',
      email: 'foo100@bar.com',
      password: 'pass200'
    };

    var credentialWithoutRealm = {
      username: 'foo100',
      email: 'foo100@bar.com',
      password: 'pass100'
    };

    var credentialWithBadPass = {
      realm: 'realm1',
      username: 'foo100',
      email: 'foo100@bar.com',
      password: 'pass001'
    };

    var credentialWithBadRealm = {
      realm: 'realm3',
      username: 'foo100',
      email: 'foo100@bar.com',
      password: 'pass100'
    };

    var credentialWithRealm = {
      realm: 'realm1',
      username: 'foo100',
      password: 'pass100'
    };

    var credentialRealmInUsername = {
      username: 'realm1:foo100',
      password: 'pass100'
    };

    var credentialRealmInEmail = {
      email: 'realm1:foo100@bar.com',
      password: 'pass100'
    };

    var user1;
    beforeEach(function(done) {
      User.create(realm1User, function(err, u) {
        if (err) return done(err);

        user1 = u;
        User.create(realm2User, done);
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
        assertGoodToken(accessToken);
        assert.equal(accessToken.userId, user1.id);

        done();
      });
    });

    it('logs in a user by with realm in username', function(done) {
      User.login(credentialRealmInUsername, function(err, accessToken) {
        assertGoodToken(accessToken);
        assert.equal(accessToken.userId, user1.id);

        done();
      });
    });

    it('logs in a user by with realm in email', function(done) {
      User.login(credentialRealmInEmail, function(err, accessToken) {
        assertGoodToken(accessToken);
        assert.equal(accessToken.userId, user1.id);

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
          assertGoodToken(accessToken);
          assert.equal(accessToken.userId, user1.id);

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
        User.login({email: 'foo@bar.com', password: 'bar'}, fn);
      }

      function logout(err, accessToken) {
        User.logout(accessToken.id, verify(accessToken.id, done));
      }
    });

    it('Logout a user by providing the current accessToken id (using node) - promise variant', function(done) {
      login(logout);

      function login(fn) {
        User.login({email: 'foo@bar.com', password: 'bar'}, fn);
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
          .send({email: 'foo@bar.com', password: 'bar'})
          .end(function(err, res) {
            if (err) return done(err);

            var accessToken = res.body;

            assert(accessToken.userId);
            assert(accessToken.id);

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
        User.findById(user.id, function(err, uu) {
          uu.hasPassword('b', function(err, isMatch) {
            assert(isMatch);

            done();
          });
        });
      });
    });

    it('should match a password after it is changed', function(done) {
      User.create({email: 'foo@baz.net', username: 'bat', password: 'baz'}, function(err, user) {
        User.findById(user.id, function(err, foundUser) {
          assert(foundUser);
          foundUser.hasPassword('baz', function(err, isMatch) {
            assert(isMatch);
            foundUser.password = 'baz2';
            foundUser.save(function(err, updatedUser) {
              updatedUser.hasPassword('baz2', function(err, isMatch) {
                assert(isMatch);
                User.findById(user.id, function(err, uu) {
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
            host: ctx.req.get('host')
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
            host: ctx.req.get('host')
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
            headers: {'message-id':'custom-header-value'}
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
            }
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
            }
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
              port: 3000
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
              port: 80
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
              port: 3000
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
              port: 443
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
        var user = new User({email: 'bar@bat.com', password: 'bar', verificationToken: 'a-token' });
        var data = user.toJSON();
        assert(!('verificationToken' in data));

        done();
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
            host: ctx.req.get('host')
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
      var email = 'foo@bar.com';

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
        User.resetPassword({ email: 'unknown@email.com' }, function(err) {
          assert(err);
          assert.equal(err.code, 'EMAIL_NOT_FOUND');
          assert.equal(err.statusCode, 404);

          done();
        });
      });

      it('Creates a temp accessToken to allow a user to change password', function(done) {
        var calledBack = false;

        User.resetPassword({
          email: email
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

            assert.equal(user.email, email);

            done();
          });
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
          .send({ email: email })
          .end(function(err, res) {
            if (err) return done(err);

            assert.deepEqual(res.body, { });

            done();
          });
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
      User2 = loopback.User.extend('User2', {}, { ttl: 10 });
    });
    it('should override ttl setting in based User model', function() {
      expect(User2.settings.ttl).to.equal(10);
    });
  });
});
