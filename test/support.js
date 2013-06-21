/**
 * asteroid test setup and support.
 */
 
assert = require('assert');
asteroid = require('../');
memoryConnector = asteroid.Memory;
app = null;
TaskEmitter = require('sl-task-emitter');
request = require('supertest');

beforeEach(function () {
  app = asteroid();
});

assertValidDataSource = function (dataSource) {
  // has methods
  assert.isFunc(dataSource, 'createModel');
  assert.isFunc(dataSource, 'discoverModelDefinitions');
  assert.isFunc(dataSource, 'discoverSchema');
  assert.isFunc(dataSource, 'enable');
  assert.isFunc(dataSource, 'disable');
  assert.isFunc(dataSource, 'defineOperation');
  assert.isFunc(dataSource, 'operations');
}

assert.isFunc = function (obj, name) {
  assert(obj, 'cannot assert function ' + name + ' on object that doesnt exist');
  assert(typeof obj[name] === 'function', name + ' is not a function');
}