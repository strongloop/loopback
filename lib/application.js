/**
 * Module dependencies.
 */

var Model = require('../node_modules/model/lib/model')
  , DataSource = require('../node_modules/data-source')
  , assert = require('assert');

/**
 * Export the app prototype.
 */

var app = exports = module.exports = {};

/**
 * Remove a route by referenve.
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
  options = options || {};
  options.name = options.name || name;
  
  BaseModel = options.extend || Model;
  
  assert(options.name, 'a name is required to define a model');
  
  return (this.model[name] = BaseModel.extend(options));
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