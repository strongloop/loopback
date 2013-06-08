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
 */

asteroid.createDataSource = function (options) {
  var connector = options.connector;
  var jdbAdapter = connector.jdbAdapter;
  
  if(jdbAdapter) {
    // TODO remove jdb dependency
    delete options.connector;
    return new DataSource(jdbAdapter, options);
  } else {
    // TODO implement asteroid data source
    throw Error('unsupported adapter')
  }
}