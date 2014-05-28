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
    givenUserModelWithAuth();
    app.enableAuth();
    app.use(loopback.rest());

    givenLoggedInUser(function(err, token) {
      if (err) return done(err);
      expect(token).instanceOf(app.models.accessToken);
      request(app).get('/users/' + token.userId)
        .set('Authorization', token.id)
        .expect(200)
        .end(done);
    });
  });

  it('does not include loopback.token when auth not enabled', function(done) {
    var User = givenUserModelWithAuth();
    User.getToken = function(req, cb) {
      cb(null, req.accessToken ? req.accessToken.id : null);
    };
    loopback.remoteMethod(User.getToken, {
      accepts: [{ type: 'object', http: { source: 'req' } }],
      returns: [{ type: 'object', name: 'id' }]
    });

    app.use(loopback.rest());
    givenLoggedInUser(function(err, token) {
      if (err) return done(err);
      request(app).get('/users/getToken')
        .set('Authorization', token.id)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.body.id).to.equal(null);
          done();
        });
    });
  });

  function givenUserModelWithAuth() {
    // NOTE(bajtos) It is important to create a custom AccessToken model here,
    // in order to overwrite the entry created by previous tests in
    // the global model registry
    app.model('accessToken', {
      options: {
        base: 'AccessToken'
      },
      dataSource: 'db'
    });
    return app.model('user', {
      options: {
        base: 'User',
        relations: {
          accessTokens: {
            model: 'accessToken',
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
    var User = app.models.user;
    User.create(credentials,
      function(err, user) {
        if (err) return done(err);
        User.login(credentials, cb);
      });
  }
});
