/**
 * Module dependencies.
 */

var express = require('express')
  , fs = require('fs')
  , path = require('path')
  , utils = express.utils;

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
  
  app.disuse = function (route) {
    if(this.stack) {
      for (var i = 0; i < this.stack.length; i++) {
        if(this.stack[i].route === route) {
          this.stack.splice(i, 1);
        }
      }
    }
  }
  
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
