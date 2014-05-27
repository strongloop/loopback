var loopback = require('../');
var Token = loopback.AccessToken.extend('MyToken');
var ACL = loopback.ACL;

describe('loopback.token(options)', function() {
  beforeEach(createTestingToken);

  it('should populate req.token from the query string', function (done) {
    createTestAppAndRequest(this.token, done)
      .get('/?access_token=' + this.token.id)
      .expect(200)
      .end(done);
  });

  it('should populate req.token from a header', function (done) {
    createTestAppAndRequest(this.token, done)
      .get('/')
      .set('authorization', this.token.id)
      .expect(200)
      .end(done);
  });

  it('should populate req.token from a secure cookie', function (done) {
    var app = createTestApp(this.token, done);

    request(app)
      .get('/token')
      .end(function(err, res) {
        request(app)
          .get('/')
          .set('Cookie', res.header['set-cookie'])
          .end(done);
      });
  });

  it('should skip when req.token is already present', function(done) {
    var tokenStub = { id: 'stub id' };
    app.use(function(req, res, next) {
      req.accessToken = tokenStub;
      next();
    });
    app.use(loopback.token({ model: Token }));
    app.get('/', function(req, res, next) {
      res.send(req.accessToken);
    });

    request(app).get('/')
      .set('Authorization', this.token.id)
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        expect(res.body).to.eql(tokenStub);
        done();
      });
  });
});

describe('AccessToken', function () {
  beforeEach(createTestingToken);

  it('should auto-generate id', function () {
    assert(this.token.id);
    assert.equal(this.token.id.length, 64);
  });

  it('should auto-generate created date', function () {
    assert(this.token.created);
    assert(Object.prototype.toString.call(this.token.created), '[object Date]');
  });

  it('should be validateable', function (done) {
    this.token.validate(function(err, isValid) {
      assert(isValid);
      done();
    });
  });
});

describe('app.enableAuth()', function() {
  this.timeout(0);

  beforeEach(createTestingToken);

  it('should prevent remote method calls if the accessToken doesnt have access', function (done) {
    createTestAppAndRequest(this.token, done)
      .del('/tests/123')
      .expect(401)
      .set('authorization', this.token.id)
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

function createTestAppAndRequest(testToken, done) {
  var app = createTestApp(testToken, done);
  return request(app);
}

function createTestApp(testToken, done) {
  var app = loopback();

  app.use(loopback.cookieParser('secret'));
  app.use(loopback.token({model: Token}));
  app.get('/token', function(req, res) {
    res.cookie('authorization', testToken.id, {signed: true});
    res.end();
  });
  app.get('/', function (req, res) {
    try {
      assert(req.accessToken, 'req should have accessToken');
      assert(req.accessToken.id === testToken.id);
    } catch(e) {
      return done(e);
    }
    res.send('ok');
  });
  app.use(loopback.rest());
  app.enableAuth();

  var TestModel = loopback.Model.extend('test', {}, {
    acls: [
      {
        principalType: "ROLE",
        principalId: "$everyone",
        accessType: ACL.ALL,
        permission: ACL.DENY,
        property: 'removeById'
      }
    ]
  });

  TestModel.attachTo(loopback.memory());
  app.model(TestModel);

  return app;
}
