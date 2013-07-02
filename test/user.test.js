var User = asteroid.User;
var passport = require('passport');

describe('User', function(){
  
  beforeEach(function (done) {
    var memory = asteroid.createDataSource({
      connector: asteroid.Memory
    });
    asteroid.User.attachTo(memory);
    asteroid.Session.attachTo(memory);
    app.use(asteroid.cookieParser());
    app.use(asteroid.auth());
    app.use(asteroid.rest());
    app.model(asteroid.User);
    
    asteroid.User.create({email: 'foo@bar.com', password: 'bar'}, done);
  });
  
  describe('User.login', function(){
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
          
          done();
        });
    });
  });
});