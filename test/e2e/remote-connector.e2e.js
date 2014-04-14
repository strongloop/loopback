var path = require('path');
var loopback = require('../../');
var models = require('../fixtures/e2e/models');
var TestModel = models.TestModel;
var assert = require('assert');

describe('RemoteConnector', function() {
  before(function() {
    // setup the remote connector
    var localApp = loopback();
    var ds = loopback.createDataSource({
      url: 'http://localhost:3000/api',
      connector: loopback.Remote
    });
    localApp.model(TestModel);
    TestModel.attachTo(ds);
  });

  it('should be able to call create', function (done) {
    TestModel.create({
      foo: 'bar'
    }, function(err, inst) {
      if(err) return done(err);
      assert(inst.id);
      done();
    });
  });
});
