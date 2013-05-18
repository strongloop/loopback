/**
 * Module dependencies.
 */

var ModuleLoader = require('sl-module-loader')
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
  var app = this;
  
  process.__asteroidCache = {};
  
  return function configureMiddleware(req, res, next) {
    var modules = req.modules = res.modules = moduleLoader;
    moduleLoader.load(function (err) {
      if(err) {
        next(err);
      } else {
        var models = modules.instanceOf('ModelConfiguration');
        var dataSources = modules.instanceOf('DataSource');

        // define models from config
        models.forEach(function (model) {
          app.models[model.options.name] = model.ModelCtor;
        });
        
        // define data sources from config
        dataSources.forEach(function (dataSource) {
          app.dataSources[dataSources.options.name] = dataSource;
        });
        
        next();
      }
    });
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

