var loopback = require('../');
var defineModelTestsWithDataSource = require('./util/model-tests');

describe('RemoteConnector', function() {
  var remoteApp;
  var remote;

  defineModelTestsWithDataSource({
    beforeEach: function(done) {
      var test = this;
      remoteApp = loopback();
      remoteApp.use(loopback.rest());
      remoteApp.listen(0, function() {
        test.dataSource = loopback.createDataSource({
          host: remoteApp.get('host'),
          port: remoteApp.get('port'),
          connector: loopback.Remote
        });
        done();
      });
    },
    onDefine: function(Model) {
      var RemoteModel = Model.extend(Model.modelName);
      RemoteModel.attachTo(loopback.createDataSource({
        connector: loopback.Memory
      }));
      remoteApp.model(RemoteModel);
    }
  });

  beforeEach(function(done) {
    var test = this;
    remoteApp = this.remoteApp = loopback();
    remoteApp.use(loopback.rest());
    var ServerModel = this.ServerModel = loopback.DataModel.extend('TestModel');

    remoteApp.model(ServerModel);

    remoteApp.listen(0, function() {
      test.remote = loopback.createDataSource({
        host: remoteApp.get('host'),
        port: remoteApp.get('port'),
        connector: loopback.Remote
      });
      done();
    });
  });

  it('should support the save method', function (done) {
    var calledServerCreate = false;
    var RemoteModel = loopback.DataModel.extend('TestModel');
    RemoteModel.attachTo(this.remote);

    var ServerModel = this.ServerModel;

    ServerModel.create = function(data, cb) {
      calledServerCreate = true;
      data.id = 1;
      cb(null, data);
    }

    ServerModel.setupRemoting();

    var m = new RemoteModel({foo: 'bar'});
    m.save(function(err, inst) {
      assert(inst instanceof RemoteModel);
      assert(calledServerCreate);
      done();
    });
  });
});
