describe('loopback.rest', function() {
  beforeEach(function() {
    app.dataSource('db', { connector: loopback.Memory });
  });

  it('works out-of-the-box', function(done) {
    app.model('MyModel', { dataSource: 'db' });
    app.use(loopback.rest());
    request(app).get('/mymodels')
      .expect(200)
      .end(done);
  });

  it('includes loopback.token when necessary', function(done) {
    // Note: we have to attach an access token model to the app.
    // The auto-detection in loopback.getModelByType()
    // fails in unit-tests, as there are too many AccessToken models
    // (each test suite registers its' own one)
    var Token = app.model('AccessToken', {
      options: { base: 'AccessToken' },
      dataSource: 'db'
    });
    givenUserModelWithAuth();
    app.enableAuth();
    app.use(loopback.rest());

    givenLoggedInUser(function(err, token) {
      if (err) return done(err);
      expect(token).instanceOf(Token);
      request(app).get('/users/' + token.userId)
        .set('Authorization', token.id)
        .expect(200)
        .end(done);
    });
  });

  function givenUserModelWithAuth() {
    return app.model('user', {
      options: {
        base: 'User',
        relations: {
          accessTokens: {
            model: 'AccessToken',
            type: 'hasMany',
            foreignKey: 'userId'
          }
        }
      },
      dataSource: 'db'
    });
  }
  function givenLoggedInUser(cb) {
    var credentials = { email: 'user@example.com', password: 'pwd' };
    var User = app.getModelByType(loopback.User);
    User.create(credentials,
      function(err, user) {
        if (err) return done(err);
        User.login(credentials, cb);
      });
  }
});
