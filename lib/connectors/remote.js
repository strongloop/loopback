/**
 * Dependencies.
 */

var assert = require('assert');
var remoting = require('strong-remoting');
var DataAccessObject = require('loopback-datasource-juggler/lib/dao');

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
  this.remotes = remoting.create();

  // TODO(ritch) make sure this name works with Model.getSourceId()
  this.name = 'remote-connector';

  if(settings.url) {
    this.url = settings.url;
  } else {
    this.url = this.protocol + '://' + this.host + ':' + this.port + this.root;
  }

  // handle mixins in the define() method
  var DAO = this.DataAccessObject = function() {};
}

RemoteConnector.prototype.connect = function() {
  this.remotes.connect(this.url, this.adapter);
}

RemoteConnector.initialize = function(dataSource, callback) {
  var connector = dataSource.connector = new RemoteConnector(dataSource.settings);
  connector.connect();
  callback();
}

RemoteConnector.prototype.define = function(definition) {
  var Model = definition.model;
  var remotes = this.remotes;
  var SharedClass;

  assert(Model.sharedClass, 'cannot attach ' + Model.modelName
    + ' to a remote connector without a Model.sharedClass');

  remotes.addClass(Model.sharedClass);

  Model
    .sharedClass
    .methods()
    .forEach(function(remoteMethod) {
      // TODO(ritch) more elegant way of ignoring a nested shared class
      if(remoteMethod.name !== 'Change'
        && remoteMethod.name !== 'Checkpoint') {
        createProxyMethod(Model, remotes, remoteMethod);
      }
    });
}

function createProxyMethod(Model, remotes, remoteMethod) {
  var scope = remoteMethod.isStatic ? Model : Model.prototype;
  var original = scope[remoteMethod.name];
  
  scope[remoteMethod.name] = function remoteMethodProxy() {
    var args = Array.prototype.slice.call(arguments);
    var lastArgIsFunc = typeof args[args.length - 1] === 'function';
    var callback;
    if(lastArgIsFunc) {
      callback = args.pop();
    }

    remotes.invoke(remoteMethod.stringName, args, callback);
  }
}

function noop() {}
