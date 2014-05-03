var async = require('async');
var loopback = require('../');
var ACL = loopback.ACL;
var Change = loopback.Change;
var defineModelTestsWithDataSource = require('./util/model-tests');

describe('Model', function() {
  defineModelTestsWithDataSource({
    dataSource: {
      connector: loopback.Memory
    }
  });
});
