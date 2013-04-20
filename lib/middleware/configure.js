/**
 * Module dependencies.
 */

var ModuleLoader = require('asteroid-module-loader')
  , path = require('path');

/**
 * Export the middleware.
 */

module.exports = configure;

/**
 * Load application modules based on the current directories configuration files.
 */

function configure(root) {
  var moduleLoader = configure.createModuleLoader(root);
  
  process.__asteroidCache = {};
  
  return function configureMiddleware(req, res, next) {
    req.modules = res.modules = moduleLoader;
    moduleLoader.load(next);
  }
}

configure.createModuleLoader = function (root) {
  var options = {
    alias: BUNDLED_MODULE_ALIAS
  };
  
  return ModuleLoader.create(root || '.', options);
};

/**
 * Turn asteroid bundled deps into aliases for the module loader
 */

var BUNDLED_MODULE_ALIAS = require('../../package.json')
  .bundleDependencies
  .reduce(function (prev, cur) {
    prev[cur] = path.join('asteroid', 'node_modules', cur);
    return prev;
  }, {});

