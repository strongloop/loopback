/**
 * Dependencies.
 */

var assert = require('assert')
  , compat = require('../compat')
  , _ = require('underscore');

/**
 * Export the RemoteConnector class.
 */

module.exports = RemoteConnector;

/**
 * Create an instance of the connector with the given `settings`.
 */

function RemoteConnector(settings) {
  assert(typeof settings === 'object', 'cannot initiaze RemoteConnector without a settings object');
  this.client = settings.client;
  this.root = settings.root;
  this.remotes = settings.remotes;
  this.adapter = settings.adapter || 'rest';
  assert(this.root, 'RemoteConnector: settings.root is required');

  // handle mixins here
  this.DataAccessObject = function() {};
}

RemoteConnector.prototype.connect = function() {
  this.remotes.connect(this.root, this.adapter);
}

RemoteConnector.initialize = function(dataSource, callback) {
  var connector = dataSource.connector = new RemoteConnector(dataSource.settings);
  connector.connect();
  callback();
}

RemoteConnector.prototype.define = function(definition) {
  var Model = definition.model;
  var className = compat.getClassNameForRemoting(Model);
  var sharedClass = getSharedClass(this.remotes, className);

  mixinRemoteMethods(this.remotes, Model, sharedClass.methods());
}

function getSharedClass(remotes, className) {
  return _.find(remotes.classes(), function(sharedClass) {
    return sharedClass.name === className;
  });
}

function mixinRemoteMethods(remotes, Model, methods) {
  methods.forEach(function(sharedMethod) {
    var original = sharedMethod.fn;
    var fn = createProxyFunction(remotes, sharedMethod.stringName);
    for(var key in original) {
      fn[key] = original[key];
    }

    if(sharedMethod.isStatic) {
      Model[sharedMethod.name] = fn;
    } else {
      Model.prototype[sharedMethod.name] = fn;
    }
  });
}

function createProxyFunction(remotes, stringName) {
  return function() {
    var args = Array.prototype.slice.call(arguments);
    var lastArgIsFunc = typeof args[args.length - 1] === 'function';
    var callback;
    if(lastArgIsFunc) {
      callback = args.pop();
    } else {
      callback = noop;
    }
    remotes.invoke(stringName, args, callback);
  }
}

function noop() {}
