var loopback = require('../../../');
var PersistedModel = loopback.PersistedModel;

exports.TestModel = PersistedModel.extend('TestModel', {}, {
  trackChanges: true
});
