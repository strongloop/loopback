describe('Remote Replication', function() {
  beforeEach(function(done) {
    var test = this;

    test.serverApp = loopback();
    test.serverApp.use(function(req, res, next) {
      console.log(req.method, req.url);
      next();
    });
    test.serverApp.use(loopback.rest());
    test.serverApp.enableAuth();
    test.clientApp = loopback();
    this.serverApp.set('legacyExplorer', false);
    var settings = {
      base: 'PersistedModel',
      trackChanges: true,
      dataSource: null,
      http: {
        path: 'my-model'
      }
    };
    test.ServerModel = test.serverApp.model('ServerModel', settings);
    test.ClientModel = test.clientApp.model('ClientModel', settings);
    var server = test.server = this.serverApp.listen(function(err) {
      if(err) return done(err);
      test.port = server.address().port;
      done();
    });
  });

  afterEach(function(done) {
    this.server.close(done);
  });

  beforeEach(function(done) {
    var test = this;

    test.remotes = loopback.createDataSource({
      connector: 'remote',
      url: 'http://localhost:' + test.port
    });

    this.ClientModel.attachTo(test.remotes);
    this.ServerModel.attachTo(loopback.createDataSource({
      connector: 'memory'
    }));

    this.ClientModel.create({foo: 'bar'}, done);
  });

  describe('client to server replication', function() {
    it('should replicate a simple change from client to server', function(done) {
      simpleReplication(this, done);
    });

    describe('with access controls in place', function() {
      beforeEach(function() {
        this.ServerModel.settings.acls = [{
          "accessType": "*",
          "principalType": "ROLE",
          "principalId": "$everyone",
          "permission": "DENY"
        },{
          "accessType": "WRITE",
          "principalType": "ROLE",
          "principalId": "$authenticated",
          "permission": "ALLOW",
        }];
      });
      it('should fail without a logged in user', function(done) {
        simpleReplication(this, function(err) {
          expect(err).to.exist;
          expect(err.message).to.equal('Authorization Required');
          done();
        });
      });
    });
  });
});


function simpleReplication(test, done) {
  test.ClientModel.replicate(test.ServerModel, function(err) {
    if(err) return done(err);
    test.ServerModel.findOne(function(err, model) {
      expect(model.foo).to.equal('bar');
      done();
    });
  });
}
