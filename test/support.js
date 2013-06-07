/**
 * asteroid test setup and support.
 */
 
assert = require('assert');
asteroid = require('../');
memoryConnector = require('asteroid-memory');

beforeEach(function () {
  app = asteroid();
  EmptyModel = asteroid.createModel();
  memory = asteroid.createDataSource({connector: memoryConnector});
})