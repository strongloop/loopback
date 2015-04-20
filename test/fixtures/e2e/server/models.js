var loopback = require('../../../../index');
var PersistedModel = loopback.PersistedModel;

exports.TestModel = PersistedModel.extend('TestModel', {}, {
  trackChanges: true
});
