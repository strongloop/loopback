/**
 * Module dependencies.
 */

var DataSource = require('jugglingdb').DataSource
  , ModelBuilder = require('jugglingdb').ModelBuilder
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

/**
 * Expose a model.
 *
 * @param Model {Model}
 */

app.model = function (Model) {
  this._models.push(Model);
  Model.shared = true;
  Model.app = this;
  if(Model._remoteHooks) {
    Model._remoteHooks.emit('attached', app);
  }
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