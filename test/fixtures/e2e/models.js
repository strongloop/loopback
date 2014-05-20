var loopback = require('../../../');
var DataModel = loopback.DataModel;

exports.TestModel = DataModel.extend('TestModel', {}, {
  trackChanges: true
});
