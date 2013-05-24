/**
 * Module dependencies.
 */

var Model = require('../node_modules/model/lib/model')
  , DataSource = require('jugglingdb').DataSource
  , ADL = require('jugglingdb').ADL
  , assert = require('assert')
  , RemoteObjects = require('sl-remoting')
  , i8n = require('inflection');

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

app.models = {};

/**
 * Get ADL.
 */
 
app.adl = function () {
  return this._adl || (this._adl = new ADL())
}

/**
 * Define a model.
 *
 * @param name {String}
 * @param options {Object}
 * @returns {Model}
 */

app.model =
app.defineModel =
app.define = function (name, properties, options) {
  var adl = this.adl();

  var ModelCtor = adl.define(name, properties, options);
  
  ModelCtor.dataSource = function (name) {
    var dataSource = app.dataSources[name];
    
    dataSource.attach(this);
  };
  
  ModelCtor.sharedCtor = function (id, fn) {
    this.find(id, fn);
  };
  ModelCtor.accepts = {arg: 'id', type: 'any'};
  
  return (app._models[ModelCtor.pluralModelName] = ModelCtor);
}

/**
 * Get all models.
 */

app.models = function () {
  var models = this._models;
  var dataSources = this.dataSources;
  
  // add in any model from a data source
  Object.keys(this.dataSources).forEach(function (name) {
    var dataSource = dataSources[name];
    
    Object.keys(dataSource.models).forEach(function (className) {
      var model = dataSource.models[className];
      models[i8n.pluralize(model.modelName)] = model;
    });
  });
  
  return models;
}

/**
 * App data sources and models.
 */

app._models = {};
app.dataSources = {};

/**
 * Get the apps set of remote objects.
 */
 
app.remotes = function () {
  return this._remotes || (this._remotes = RemoteObjects.create());
}

/**
 * Attach a remote data source.
 *
 * @param name {String}
 * @param options {Object}
 * @returns {DataSource}
 */

app.dataSource = function (name, options) {
  var dataSources = this.dataSources || (this.dataSources = {});
  return (dataSources[name] = new DataSource(options.adapter, options));
}