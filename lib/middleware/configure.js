/**
 * Module dependencies.
 */

var ModuleLoader = require('module-loader');

/**
 * Export the middleware.
 */

module.exports = configure;

/**
 * Load application modules based on the current directories configuration files.
 */

function configure(root) {
  var moduleLoader = ModuleLoader.create(root || '.');
  
  process.__asteroidCache = {};
  
  return function configureMiddleware(req, res, next) {
    req.modules = res.modules = moduleLoader;
    moduleLoader.load(next);
  }
}

