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
});
