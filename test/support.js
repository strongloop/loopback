/**
 * loopback test setup and support.
 */
 
assert = require('assert');
loopback = require('../');
memoryConnector = loopback.Memory;
GeoPoint = loopback.GeoPoint;
app = null;
TaskEmitter = require('strong-task-emitter');
request = require('supertest');

beforeEach(function () {
  app = loopback();
});

assertValidDataSource = function (dataSource) {
  // has methods
  assert.isFunc(dataSource, 'createModel');
  assert.isFunc(dataSource, 'discoverModelDefinitions');
  assert.isFunc(dataSource, 'discoverSchema');
  assert.isFunc(dataSource, 'enableRemote');
  assert.isFunc(dataSource, 'disableRemote');
  assert.isFunc(dataSource, 'defineOperation');
  assert.isFunc(dataSource, 'operations');
}

assert.isFunc = function (obj, name) {
  assert(obj, 'cannot assert function ' + name + ' on object that doesnt exist');
  assert(typeof obj[name] === 'function', name + ' is not a function');
}