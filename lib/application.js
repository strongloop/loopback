/**
 * Module dependencies.
 */

var Model = require('../node_modules/model/lib/model')
  , DataSource = require('../node_modules/data-source')
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
 * App models.
 */

app.models = {};

/**
 * Define a model.
 *
 * @param name {String}
 * @param options {Object}
 * @returns {Model}
 */
 
app.defineModel =
app.define = function (name, options) {
  var remotes = this.remotes();
  
  options = options || {};
  options.name = options.name || name;
  
  BaseModel = options.extend || Model;
  
  assert(options.name, 'a name is required to define a model');
  
  var ModelCtor = (this.model[name] = BaseModel.extend(options));
  var proto = ModelCtor.prototype;
  
  remotes.exports[name] = ModelCtor;
  
  // default shared methods
  if(ModelCtor.all) ModelCtor.all.shared = true;
  if(proto.save) proto.save = true;
  
  // attach a remotes reference
  ModelCtor.remotes = remotes;
  
  return ModelCtor;
}

/**
 * App data sources.
 */

app.dataSources = {};

/**
 * Attach a remote data source.
 *
 * @param name {String}
 * @param options {Object}
 * @returns {DataSource}
 */

app.dataSource = function (name, options) {
  return (app[name] = new DataSource(options));
}