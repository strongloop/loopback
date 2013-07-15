var User = asteroid.User;
var Session = asteroid.Session;
var passport = require('passport');

var userMemory = asteroid.createDataSource({
  connector: asteroid.Memory
});

asteroid.User.attachTo(userMemory);
asteroid.User.session.attachTo(userMemory);
asteroid.User.email.setup({transports: [{type: 'STUB'}]});

describe('User', function(){


  
  beforeEach(function (done) {
    app.use(asteroid.cookieParser());
    app.use(asteroid.auth());
    app.use(asteroid.rest());
    app.model(asteroid.User);
    
    asteroid.User.create({email: 'foo@bar.com', password: 'bar'}, done);
  });
  
  afterEach(function (done) {
    asteroid.User.destroyAll(function (err) {
      Session.destroyAll(done);
    });
  });
  
  describe('User.create', function(){
    it('Create a new user.', function(done) {
      User.create({email: 'f@b.com'}, function (err, user) {
        assert(!err);
        assert(user.id);
        assert(user.email);
        done();
      });
    });
    
    it('Requires a valid email.', function(done) {
      User.create({}, function (err) {
        assert(err);
        User.create({email: 'foo@'}, function (err) {
          assert(err);
          done();
        });
      });
    });
    
    it('Requires a unique email.', function(done) {
      User.create({email: 'a@b.com'}, function () {
        User.create({email: 'a@b.com'}, function (err) {
          assert(err, 'should error because the email is not unique!');
          done();
        });
      });
    });
    
    it('Requires a password to login with basic auth.', function(done) {
      User.create({email: 'b@c.com'}, function (err) {
        User.login({email: 'b@c.com'}, function (err, session) {
          assert(!session, 'should not create a session without a valid password');
          assert(err, 'should not login without a password');
          done();
        });
      });
    });
  });
  
  describe('User.login', function() {
    it('Login a user by providing credentials.', function(done) {
      request(app)
        .post('/users/login')
        .expect('Content-Type', /json/)
        .expect(200)
        .send({email: 'foo@bar.com', password: 'bar'})
        .end(function(err, res){
          if(err) return done(err);
          var session = res.body;
          
          assert(session.uid);
          assert(session.id);
          assert.equal((new Buffer(session.id, 'base64')).length, 64);
          
          done();
        });
    });
  });
  
  describe('User.logout', function() {
    it('Logout a user by providing the current session id (using node).', function(done) {
      login(logout);
      
      function login(fn) {
        User.login({email: 'foo@bar.com', password: 'bar'}, fn);
      }
      
      function logout(err, session) {
        User.logout(session.id, verify(session.id, done));
      }
    });
    
    it('Logout a user by providing the current session id (over rest).', function(done) {
      login(logout);
      
      function login(fn) {
        request(app)
          .post('/users/login')
          .expect('Content-Type', /json/)
          .expect(200)
          .send({email: 'foo@bar.com', password: 'bar'})
          .end(function(err, res){
            if(err) return done(err);
            var session = res.body;
          
            assert(session.uid);
            assert(session.id);
            
            fn(null, session.id);
          });
      }
      
      function logout(err, sid) {
        request(app)
          .post('/users/logout') 
          .expect(200)
          .send({sid: sid})
          .end(verify(sid, done));
      }
    });
    
    it('Logout a user using the instance method.', function(done) {
      login(logout);
      
      function login(fn) {
        User.login({email: 'foo@bar.com', password: 'bar'}, fn);
      }
      
      function logout(err, session) {
        User.findOne({email: 'foo@bar.com'}, function (err, user) {
          user.logout(verify(session.id, done));
        });
      }
    });
    
    function verify(sid, done) {
      assert(sid);
      
      return function (err) {
        if(err) return done(err);
        
        Session.findById(sid, function (err, session) {
          assert(!session, 'session should not exist after logging out');
          done(err);
        });
      }
    }
  });
  
  describe('user.hasPassword(plain, fn)', function(){
    it('Determine if the password matches the stored password.', function(done) {
      var u = new User({username: 'foo', password: 'bar'});
      u.hasPassword('bar', function (err, isMatch) {
        assert(isMatch, 'password doesnt match');
        done();
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
            
            
            var lines = result.email.message.split('\n');
            assert(lines[4].indexOf('To: bar@bat.com') === 0);
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
});