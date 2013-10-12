var User = loopback.User.extend('user');
var Session = loopback.Session;
var passport = require('passport');
var MailConnector = require('../lib/connectors/mail');

var userMemory = loopback.createDataSource({
  connector: loopback.Memory
});


describe('User', function(){
  
  var mailDataSource = loopback.createDataSource({
    connector: MailConnector,
    transports: [{type: 'STUB'}]
  });
  User.attachTo(userMemory);
  User.session.attachTo(userMemory);
  User.email.attachTo(mailDataSource);
  
  // allow many User.afterRemote's to be called
  User.setMaxListeners(0);
  
  beforeEach(function (done) {
    app.use(loopback.rest());
    app.model(User);
    
    User.create({email: 'foo@bar.com', password: 'bar'}, done);
  });
  
  afterEach(function (done) {
    User.destroyAll(function (err) {
      User.session.destroyAll(done);
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
    
    it('Email is required', function(done) {
      User.create({password: '123'}, function (err) {
        assert.deepEqual(err, { name: 'ValidationError',
          message: 'Validation error',
          statusCode: 400,
          codes: { email: [ 'presence', 'format.blank', 'uniqueness' ] },
          context: 'user' });
        
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
        User.login({email: 'b@c.com'}, function (err, session) {
          assert(!session, 'should not create a session without a valid password');
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
      User.login({email: 'foo@bar.com', password: 'bar'}, function (err, session) {
        assert(session.uid);
        assert(session.id);
        assert.equal((new Buffer(session.id, 'base64')).length, 64);
        
        done();
      });
    });
    
    it('Login a user over REST by providing credentials', function(done) {
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
    
    it('Login should only allow correct credentials', function(done) {
      User.create({email: 'foo22@bar.com', password: 'bar'}, function(user, err) {
        User.login({email: 'foo44@bar.com', password: 'bar'}, function(err, session) { 
          assert(err);
          assert(!session);
          done();
        });
      });
    });
  });
  
  describe('User.logout', function() {
    it('Logout a user by providing the current session id (using node)', function(done) {
      login(logout);
      
      function login(fn) {
        User.login({email: 'foo@bar.com', password: 'bar'}, fn);
      }
      
      function logout(err, session) {
        User.logout(session.id, verify(session.id, done));
      }
    });
    
    it('Logout a user by providing the current session id (over rest)', function(done) {
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
          .expect(204)
          .send({sid: sid})
          .end(verify(sid, done));
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
