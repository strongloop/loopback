/**
 * Module dependencies.
 */

var express = require('express')
  , fs = require('fs')
  , path = require('path')
  , proto = require('./application')
  , utils = require('express/node_modules/connect').utils
  , DataSource = require('jugglingdb').DataSource
  , ModelBuilder = require('jugglingdb').ModelBuilder;

/**
 * Expose `createApplication()`.
 */

var asteroid = exports = module.exports = createApplication;

/**
 * Framework version.
 */

asteroid.version = require('../package.json').version;

/**
 * Expose mime.
 */

asteroid.mime = express.mime;

/**
 * Create an asteroid application.
 *
 * @return {Function}
 * @api public
 */

function createApplication() {
  var app = express();

  utils.merge(app, proto);

  return app;
}

/**
 * Expose express.middleware as asteroid.*
 * for example `asteroid.errorHandler` etc.
 */

for (var key in express) {
  Object.defineProperty(
      asteroid
    , key
    , Object.getOwnPropertyDescriptor(express, key));
}

/**
 * Expose additional asteroid middleware
 * for example `asteroid.configure` etc.
 */

fs.readdirSync(path.join(__dirname, 'middleware')).forEach(function (m) {
  asteroid[m.replace(/\.js$/, '')] = require('./middleware/' + m);
});

/**
 * Error handler title
 */

asteroid.errorHandler.title = 'Asteroid';

/**
 * Create a data source with passing the provided options to the connector.
 *
 * @param {String} name (optional)
 * @param {Object} options
 * 
 *  - connector - an asteroid connector
 *  - other values - see the specified `connector` docs 
 */

asteroid.createDataSource = function (name, options) {
  return new DataSource(name, options);
}

/**
 * Create a named vanilla JavaScript class constructor with an attached set of properties and options.
 *
 * @param {String} name - must be unique
 * @param {Object} properties
 * @param {Object} options (optional)
 */

asteroid.createModel = function (name, properties, options) {
  var mb = new ModelBuilder();
  return mb.define(name, properties, arguments);
}

/**
 * Add a remote method to a model.
 * @param {Function} fn
 * @param {Object} options (optional)
 */

asteroid.remoteMethod = function (fn, options) {
  fn.shared = true;
  Object.keys(options).forEach(function (key) {
    fn[key] = options[key];
  });
}

