var loopback = require('../');

describe('RemoteConnector', function() {
  beforeEach(function(done) {
    var LocalModel = this.LocalModel = loopback.DataModel.extend('LocalModel');
    var RemoteModel = loopback.DataModel.extend('LocalModel');
    var localApp = loopback();
    var remoteApp = loopback();
    localApp.model(LocalModel);
    remoteApp.model(RemoteModel);
    remoteApp.use(loopback.rest());
    RemoteModel.attachTo(loopback.memory());
    remoteApp.listen(0, function() {
      var ds = loopback.createDataSource({
        host: remoteApp.get('host'),
        port: remoteApp.get('port'),
        connector: loopback.Remote
      });

      LocalModel.attachTo(ds);
      done();
    });
  });

  it('should alow methods to be called remotely', function (done) {
    var data = {foo: 'bar'};
    this.LocalModel.create(data, function(err, result) {
      if(err) return done(err);
      expect(result).to.deep.equal({id: 1, foo: 'bar'});
      done();
    });
  });

  it('should alow instance methods to be called remotely', function (done) {
    var data = {foo: 'bar'};
    var m = new this.LocalModel(data);
    m.save(function(err, result) {
      if(err) return done(err);
      expect(result).to.deep.equal({id: 2, foo: 'bar'});
      done();
    });
  });
});
