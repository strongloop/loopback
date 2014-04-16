var path = require('path');
var loopback = require('../../');
var models = require('../fixtures/e2e/models');
var TestModel = models.TestModel;
var LocalTestModel = TestModel.extend('LocalTestModel');
var assert = require('assert');

describe('ReplicationModel', function () {
  it('ReplicationModel.enableChangeTracking()', function (done) {
    var TestReplicationModel = loopback.DataModel.extend('TestReplicationModel');
    var remote = loopback.createDataSource({
      url: 'http://localhost:3000/api',
      connector: loopback.Remote
    });
    var testApp = loopback();
    testApp.model(TestReplicationModel);
    TestReplicationModel.attachTo(remote);
    // chicken-egg condition
    // getChangeModel() requires it to be attached to an app
    // attaching to the app requires getChangeModel()
    var Change = TestReplicationModel.getChangeModel();
    testApp.model(Change);
    Change.attachTo(remote);
    TestReplicationModel.enableChangeTracking();
  });
});

describe.skip('Replication', function() {
  beforeEach(function() {
    // setup the remote connector
    var localApp = loopback();
    var ds = loopback.createDataSource({
      url: 'http://localhost:3000/api',
      connector: loopback.Remote
    });
    localApp.model(TestModel);
    localApp.model(LocalTestModel);
    TestModel.attachTo(ds);
    var memory = loopback.memory();
    LocalTestModel.attachTo(memory);

    // TODO(ritch) this should be internal...
    LocalTestModel.getChangeModel().attachTo(memory);

    LocalTestModel.enableChangeTracking();
    
    // failing because change model is not properly attached
    TestModel.enableChangeTracking();  
  });

  it('should replicate local data to the remote', function (done) {
    LocalTestModel.create({
      foo: 'bar'
    }, function() {
      LocalTestModel.replicate(0, TestModel, function() {
        console.log('replicated');
        done();
      });
    });
  });

});
