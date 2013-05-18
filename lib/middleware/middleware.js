/**
 * Module dependencies.
 */

var ModuleLoader = require('sl-module-loader');

/**
 * Export the middleware.
 */

module.exports = middleware;

/**
 * Load application modules based on the current directories configuration files.
 */

function middleware() {
  var modules = this.modules;
  
  return function executeAsteroidMiddleware(req, res, next) {
    // TODO implement asteroid specific middleware stack
    next();
  }
}

