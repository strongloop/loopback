var User;
var AccessToken = loopback.AccessToken;
var MailConnector = require('../lib/connectors/mail');

var userMemory = loopback.createDataSource({
  connector: 'memory'
});

describe('User', function(){
  var validCredentials = {email: 'foo@bar.com', password: 'bar'};
  var validCredentialsWithTTL = {email: 'foo@bar.com', password: 'bar', ttl: 3600};
  var invalidCredentials = {email: 'foo1@bar.com', password: 'bar1'};
  var incompleteCredentials = {password: 'bar1'};

  beforeEach(function() {
    User = loopback.User.extend('user');
    User.email = loopback.Email.extend('email');
    loopback.autoAttach();

    // Update the AccessToken relation to use the subclass of User
    AccessToken.belongsTo(User);
  
    // allow many User.afterRemote's to be called
    User.setMaxListeners(0);

  });
  
  beforeEach(function (done) {
    app.use(loopback.token());
    app.use(loopback.rest());
    app.model(User);
    
    User.create(validCredentials, done);
  });
  
  afterEach(function (done) {
    User.destroyAll(function (err) {
      User.accessToken.destroyAll(done);
    });
  });
  
  describe('User.create', function(){
    it('Create a new user', function(done) {
      User.create({email: 'f@b.com', password: 'bar'}, function (err, user) {
        assert(!err);
        assert(user.id);
        assert(user.email);
        done();
      });
    });

    it('Email is required', function (done) {
      User.create({password: '123'}, function (err) {
        assert(err);
        assert.equal(err.name, "ValidationError");
        assert.equal(err.statusCode, 422);
        assert.equal(err.details.context, "user");
        assert.deepEqual(err.details.codes.email, [
          'presence',
          'format.blank',
          'uniqueness'
        ]);

        done();
      });
    });
    
    // will change in future versions where password will be optional by default
    it('Password is required', function(done) {
      var u = new User({email: "123@456.com"});
      
      User.create({email: 'c@d.com'}, function (err) {
        assert(err);
        done();
      });
    });
    
    it('Requires a valid email', function(done) {
      User.create({email: 'foo@', password: '123'}, function (err) {
        assert(err);
        done();
      });
    });
    
    it('Requires a unique email', function(done) {
      User.create({email: 'a@b.com', password: 'foobar'}, function () {
        User.create({email: 'a@b.com', password: 'batbaz'}, function (err) {
          assert(err, 'should error because the email is not unique!');
          done();
        });
      });
    });
    
    it('Requires a password to login with basic auth', function(done) {
      User.create({email: 'b@c.com'}, function (err) {
        User.login({email: 'b@c.com'}, function (err, accessToken) {
          assert(!accessToken, 'should not create a accessToken without a valid password');
          assert(err, 'should not login without a password');
          done();
        });
      });
    });
    
    it('Hashes the given password', function() {
      var u = new User({username: 'foo', password: 'bar'});
      assert(u.password !== 'bar');
    });
  });
  
  describe('User.login', function() {
    it('Login a user by providing credentials', function(done) {
      User.login(validCredentials, function (err, accessToken) {
        assert(accessToken.userId);
        assert(accessToken.id);
        assert.equal(accessToken.id.length, 64);
        
        done();
      });
    });

    it('Login a user by providing credentials with TTL', function(done) {
      User.login(validCredentialsWithTTL, function (err, accessToken) {
        assert(accessToken.userId);
        assert(accessToken.id);
        assert.equal(accessToken.ttl, validCredentialsWithTTL.ttl);
        assert.equal(accessToken.id.length, 64);

        done();
      });
    });

    it('Login a user using a custom createAccessToken', function(done) {
      var createToken = User.prototype.createAccessToken; // Save the original method
      // Override createAccessToken
      User.prototype.createAccessToken = function(ttl, cb) {
        // Reduce the ttl by half for testing purpose
        this.accessTokens.create({ttl: ttl /2 }, cb);
      };
      User.login(validCredentialsWithTTL, function (err, accessToken) {
        assert(accessToken.userId);
        assert(accessToken.id);
        assert.equal(accessToken.ttl, 1800);
        assert.equal(accessToken.id.length, 64);

        User.findById(accessToken.userId, function(err, user) {
          user.createAccessToken(120, function (err, accessToken) {
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
    
    it('Login a user over REST by providing credentials', function(done) {
      request(app)
        .post('/users/login')
        .expect('Content-Type', /json/)
        .expect(200)
        .send(validCredentials)
        .end(function(err, res){
          if(err) return done(err);
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
        .post('/users/login')
        .expect('Content-Type', /json/)
        .expect(401)
        .send(invalidCredentials)
        .end(function(err, res){
          done();
        });
    });

    it('Login a user over REST by providing incomplete credentials', function(done) {
      request(app)
        .post('/users/login')
        .expect('Content-Type', /json/)
        .expect(400)
        .send(incompleteCredentials)
        .end(function(err, res){
          done();
        });
    });

    it('Login a user over REST with the wrong Content-Type', function(done) {
      request(app)
        .post('/users/login')
        .set('Content-Type', null)
        .expect('Content-Type', /json/)
        .expect(400)
        .send(validCredentials)
        .end(function(err, res){
          done();
        });
    });

    it('Returns current user when `include` is `USER`', function(done) {
      request(app)
        .post('/users/login?include=USER')
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

    it('Login should only allow correct credentials', function(done) {
      User.create({email: 'foo22@bar.com', password: 'bar'}, function(user, err) {
        User.login({email: 'foo44@bar.com', password: 'bar'}, function(err, accessToken) { 
          assert(err);
          assert(!accessToken);
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
    
    it('Logout a user by providing the current accessToken id (over rest)', function(done) {
      login(logout);
      function login(fn) {
        request(app)
          .post('/users/login')
          .expect('Content-Type', /json/)
          .expect(200)
          .send({email: 'foo@bar.com', password: 'bar'})
          .end(function(err, res){
            if(err) return done(err);
            var accessToken = res.body;
          
            assert(accessToken.userId);
            assert(accessToken.id);
            
            fn(null, accessToken.id);
          });
      }
      
      function logout(err, token) {
        request(app)
          .post('/users/logout')
          .set('Authorization', token)
          .expect(204)
          .end(verify(token, done));
      }
    });
    
    function verify(token, done) {
      assert(token);
      
      return function (err) {
        if(err) return done(err);
        
        AccessToken.findById(token, function (err, accessToken) {
          assert(!accessToken, 'accessToken should not exist after logging out');
          done(err);
        });
      }
    }
  });
  
  describe('user.hasPassword(plain, fn)', function(){
    it('Determine if the password matches the stored password', function(done) {
      var u = new User({username: 'foo', password: 'bar'});
      u.hasPassword('bar', function (err, isMatch) {
        assert(isMatch, 'password doesnt match');
        done();
      });  
    });
    
    it('should match a password when saved', function(done) {
      var u = new User({username: 'a', password: 'b', email: 'z@z.net'});
      
      u.save(function (err, user) {
        User.findById(user.id, function (err, uu) {
          uu.hasPassword('b', function (err, isMatch) {
            assert(isMatch);
            done();
          });
        });
      });
    });
    
    it('should match a password after it is changed', function(done) {
       User.create({email: 'foo@baz.net', username: 'bat', password: 'baz'}, function (err, user) {
         User.findById(user.id, function (err, foundUser) {
           assert(foundUser);
           foundUser.hasPassword('baz', function (err, isMatch) {
             assert(isMatch);
             foundUser.password = 'baz2';
             foundUser.save(function (err, updatedUser) {
               updatedUser.hasPassword('baz2', function (err, isMatch) {
                 assert(isMatch);
                 User.findById(user.id, function (err, uu) {
                   uu.hasPassword('baz2', function (err, isMatch) {
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
  
  describe('Verification', function(){
    
    describe('user.verify(options, fn)', function(){
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
      
          user.verify(options, function (err, result) {
            assert(result.email);
            assert(result.email.message);
            assert(result.token);
            
            
            assert(~result.email.message.indexOf('To: bar@bat.com'));
            done();
          });
        });
            
        request(app)
          .post('/users')
          .expect('Content-Type', /json/)
          .expect(200)
          .send({email: 'bar@bat.com', password: 'bar'})
          .end(function(err, res){
            if(err) return done(err);
          });
      });
    });
  
    describe('User.confirm(options, fn)', function(){
      it('Confirm a user verification', function(done) {
        User.afterRemote('create', function(ctx, user, next) {
          assert(user, 'afterRemote should include result');
          
          var options = {
            type: 'email',
            to: user.email,
            from: 'noreply@myapp.org',
            redirect: 'http://foo.com/bar',
            protocol: ctx.req.protocol,
            host: ctx.req.get('host')
          };
      
          user.verify(options, function (err, result) {
            if(err) return done(err);
            
            request(app)
              .get('/users/confirm?uid=' + result.uid + '&token=' + encodeURIComponent(result.token) + '&redirect=' + encodeURIComponent(options.redirect))
              .expect(302)
              .expect('location', options.redirect)
              .end(function(err, res){
                if(err) return done(err);
                done();
              });
          });
        });
            
        request(app)
          .post('/users')
          .expect('Content-Type', /json/)
          .expect(302)
          .send({email: 'bar@bat.com', password: 'bar'})
          .end(function(err, res){
            if(err) return done(err);
          });
      });
    });
  });

  describe('Password Reset', function () {
    describe('User.resetPassword(options, cb)', function () {
      it('Creates a temp accessToken to allow a user to change password', function (done) {
        var calledBack = false;
        var email = 'foo@bar.com';

        User.resetPassword({
          email: email
        }, function () {
          calledBack = true;
        });

        User.once('resetPasswordRequest', function (info) {
          assert(info.email);
          assert(info.accessToken);
          assert(info.accessToken.id);
          assert.equal(info.accessToken.ttl / 60, 15);
          assert(calledBack);
          info.accessToken.user(function (err, user) {
            assert.equal(user.email, email);
            done();
          });
        });
      });
    });
  });
});
