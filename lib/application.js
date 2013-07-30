/**
 * Module dependencies.
 */

var DataSource = require('loopback-datasource-juggler').DataSource
  , ModelBuilder = require('loopback-datasource-juggler').ModelBuilder
  , assert = require('assert')
  , RemoteObjects = require('strong-remoting')
  , swagger = require('strong-remoting/ext/swagger');

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
 * App models.
 */

app._models = [];

/**
 * Expose a model.
 *
 * @param Model {Model}
 */

app.model = function (Model) {
  this.remotes().exports[Model.pluralModelName] = Model;
  this._models.push(Model);
  Model.shared = true;
  Model.app = this;
  Model.emit('attached', this);
}

/**
 * Get all exposed models.
 */

app.models = function () {
  return this._models;
}

/**
 * Get all remote objects.
 */

app.remoteObjects = function () {
  var result = {};
  var models = this.models();
  
  // add in models
  models.forEach(function (ModelCtor) {
    // only add shared models
    if(ModelCtor.shared && typeof ModelCtor.sharedCtor === 'function') {
      result[ModelCtor.pluralModelName] = ModelCtor;
    }
  });
    
  return result;
}

/**
 * Get the apps set of remote objects.
 */
 
app.remotes = function () {
  return this._remotes || (this._remotes = RemoteObjects.create());
}

/**
 * Enable documentation
 */
 
app.docs = function (options) {
  var remotes = this.remotes();
  swagger(remotes, options);
}


/*!
 * Get a handler of the specified type from the handler cache.
 */
 
app.handler = function (type) {
  var handlers = this._handlers || (this._handlers = {});
  if(handlers[type]) {
    return handlers[type];
  }
  
  var remotes = this.remotes();
  var handler = this._handlers[type] = remotes.handler(type);
  return handler;
}

