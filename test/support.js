/**
 * asteroid test setup and support.
 */
 
assert = require('assert');
asteroid = require('../');
memoryConnector = asteroid.Memory;

beforeEach(function () {
  app = asteroid();
  memoryDataSource = asteroid.createDataSource({connector: memoryConnector});
});

assertValidDataSource = function (dataSource) {
  // has methods
  assert.isFunc(dataSource, 'createModel');
  // assert.isFunc(dataSource, 'discover');
  // assert.isFunc(dataSource, 'discoverSync');
  assert.isFunc(dataSource, 'discoverAndBuildModels');
  assert.isFunc(dataSource, 'discoverAndBuildModelsSync');
  assert.isFunc(dataSource, 'enable');
  assert.isFunc(dataSource, 'disable');
  assert.isFunc(dataSource, 'defineOperation');
  assert.isFunc(dataSource, 'operations');
}

assert.isFunc = function (obj, name) {
  assert(obj, 'cannot assert function ' + name + ' on object that doesnt exist');
  assert(typeof obj[name] === 'function', name + ' is not a function');
}