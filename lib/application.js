/**
 * Module dependencies.
 */

var DataSource = require('loopback-data').DataSource
  , ModelBuilder = require('loopback-data').ModelBuilder
  , assert = require('assert')
  , RemoteObjects = require('sl-remoting');

/**
 * Export the app prototype.
 */

var app = exports = module.exports = {};

/**
 * Create a set of remote objects.
 */

app.remotes = function () {
  if(this._remotes) {
    return this._remotes;
  } else {
    return (this._remotes = RemoteObjects.create());
  }
}

/**
 * Expose an object or Class remotely.
 * 
 * @param {String} name The remote namespace (eg. url base)
 * @param {Object|Function} obj The object to remote
 */

app.remote = function (name, obj) {
  // add the object to the remote exports
  this.remotes().exports[name] = obj;
  
  // clear the handlers cache
  this._handlers = {};
}

/**
 * Remove a route by reference.
 */

app.disuse = function (route) {
  if(this.stack) {
    for (var i = 0; i < this.stack.length; i++) {
      if(this.stack[i].route === route) {
        this.stack.splice(i, 1);
      }
    }
  }
}

/**
 * Get ModelBuilder.
 */
 
app.modelBuilder = function () {
  return this._modelBuilder || (this._modelBuilder = new ModelBuilder())
}

/**
 * App models.
 */

app._models = [];
app._services = [];

/**
 * Expose a model.
 *
 * @param Model {Model}
 */

app.model = function (Model) {
  var remotes = this.remotes();
  
  this._models.push(Model);
  Model.shared = true;
  Model.app = this;
  if(Model._remoteHooks) {
    Model._remoteHooks.emit('attached', app);
  }
  
  // add to the remote exports
  this.remote(Model.pluralModelName, Model);
}

/**
 * Get all exposed models.
 */

app.models = function () {
  return this._models;
}

/**
 * Expose a service.
 *
 * @param {String} name
 * @param {Service} service
 */

app.service = function (name, service) {
  this._services.push(service);
  service.shared = true;
  
  service.app = this;
  
  // add to the remote exports
  this.remote(name, service);
}

/**
 * Get all exposed services.
 */

app.services = function () {
  return this._services;
}

/**
 * Get the apps set of remote objects.
 */
 
app.remotes = function () {
  return this._remotes || (this._remotes = RemoteObjects.create());
}

/**
 * Get a remotes handler.
 */

app.handler = function (type) {
  var handler = this._handlers[type];
  
  if(!handler) {
    // get the sl remoting object
    var remotes = this.remotes();
  
    // create and save the handler
    handler = this._handlers[type] = remotes.handler(type);
  }
  
  return handler;
}

/*!
 * Handlers
 */

app._handlers = {};

