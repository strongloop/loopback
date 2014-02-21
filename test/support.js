/**
 * loopback test setup and support.
 */
 
assert = require('assert');
expect = require('chai').expect;
loopback = require('../');
memoryConnector = loopback.Memory;
GeoPoint = loopback.GeoPoint;
app = null;
TaskEmitter = require('strong-task-emitter');
request = require('supertest');

// Speed up the password hashing algorithm
// for tests using the built-in User model
loopback.User.settings.saltWorkFactor = 4;

beforeEach(function () {
  this.app = app = loopback();

  // setup default data sources
  loopback.setDefaultDataSourceForType('db', {
    connector: loopback.Memory
  });

  loopback.setDefaultDataSourceForType('mail', {
    connector: loopback.Mail,
    transports: [
      {type: 'STUB'}
    ]
  });

  // auto attach data sources to models
  loopback.autoAttach();
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

describe.onServer = function describeOnServer(name, fn) {
  if (loopback.isServer) {
    describe(name, fn);
  } else {
    describe.skip(name, fn);
  }
};

describe.inBrowser = function describeInBrowser(name, fn) {
  if (loopback.isBrowser) {
    describe(name, fn);
  } else {
    describe.skip(name, fn);
  }
};