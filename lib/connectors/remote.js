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
  this.adapter = settings.adapter || 'rest';
  this.protocol = settings.protocol || 'http'
  this.root = settings.root || '';
  this.host = settings.host || 'localhost';
  this.port = settings.port || 3000;

  if(settings.url) {
    this.url = settings.url;
  } else {
    this.url = this.protocol + '://' + this.host + ':' + this.port + this.root;
  }

  // handle mixins here
  this.DataAccessObject = function() {};
}

RemoteConnector.prototype.connect = function() {
}


RemoteConnector.initialize = function(dataSource, callback) {
  var connector = dataSource.connector = new RemoteConnector(dataSource.settings);
  connector.connect();
  callback();
}

RemoteConnector.prototype.define = function(definition) {
  var Model = definition.model;
  var className = compat.getClassNameForRemoting(Model);
  var url = this.url;
  var adapter = this.adapter;

  Model.remotes(function(err, remotes) {
    var sharedClass = getSharedClass(remotes, className);
    remotes.connect(url, adapter);
    sharedClass
      .methods()
      .forEach(Model.createProxyMethod.bind(Model));
  });
}

function getSharedClass(remotes, className) {
  return _.find(remotes.classes(), function(sharedClass) {
    return sharedClass.name === className;
  });
}
function noop() {}
