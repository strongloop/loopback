var loopback = require('../');
var Token = loopback.AccessToken.extend('MyToken');

// attach Token to testing memory ds
Token.attachTo(loopback.memory());

describe('loopback.token(app, options)', function() {
  beforeEach(createTestingToken);
  
  it('should populate req.token from the query string', function (done) {
    var app = loopback();
    var options = {};
    var testToken = this.token;
    app.use(loopback.token(app, options));
    app.get('/', function (req, res) {
      assert(req.token === testToken);
      res.send('ok');
      done();
    });
    
    request(app)
      .get('/?access_token=' + this.token.id)
      .expect(200)
      .end(done);
  });
});

function createTestingToken(done) {
  var test = this;
  Token.create({}, function (err, token) {
    if(err) return done(err);
    test.token = token;
    done();
  });
}