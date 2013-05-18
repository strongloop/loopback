/**
 * Expose `ModuleLoader`.
 */

module.exports = ModuleLoader;

/**
 * Module dependencies.
 */
 
var ConfigLoader = require('sl-config-loader')
  , PatchedModule = require('./patched-module')
  , fs = require('fs')
  , path = require('path')
  , debug = require('debug')('sl-module-loader')
  , util = require('util')
  , inherits = util.inherits
  , assert = require('assert');
  
/**
 * Create a new `ModuleLoader` with the given `options`.
 *
 * @param {Object} options
 * @return {ModuleLoader}
 */

function ModuleLoader(options) {
  ConfigLoader.apply(this, arguments);
  
  this.types = {};
  this._modules = {};
  
  // throw an error if args are not supplied
  // assert(typeof options === 'object', 'ModuleLoader requires an options object');
  
  this.options = options;
  
  debug('created with options', options);
}

/**
 * Inherit from `ConfigLoader`.
 */

inherits(ModuleLoader, ConfigLoader);

/**
 * Simplified APIs
 */

ModuleLoader.create =
ModuleLoader.createModuleLoader = function (root, options) {
  options = options || {};
  options.root = root;
  return new ModuleLoader(options);
}

/**
 * Load the configuration and build modules.
 */
 
ModuleLoader.prototype.load = function (fn) {
  if(this.remaining()) {
    // wait until the current operation is finished
    this.once('done', function () {
      fn(null, this._files);
    });
    // callback with an error if it occurs
    this.once('error', fn);
  } else if(this.ttl() > 0) {
    fn(null, this._modules);
  } else {
    this.reset();
    
    this.once('error', fn);
    
    this.bindListeners();
    
    // load config files
    this.task(fs, 'readdir', this.root);
    this.once('done', function () {
      this._mergeEnvConfigs();
      // create instances from config
      this._constructModules(this._files);
      fn(null, this._modules);
    });
  }
}

/**
 * Load an sl module type from the given module name.
 */

ModuleLoader.prototype.loadType = function (name) {
  // get alias if it exists
  var alias = (this.options.alias && this.options.alias[name]) || name;
  
  assert(alias, 'you must provide a name or alias when loading a type');
   
  // use the root as the base dir for loading
  var paths = PatchedModule.resolveLookupPaths(this.root)[1];

  // add in node module paths
  paths = PatchedModule.nodeModulePaths(this.root).concat(paths);
  
  var Type = PatchedModule.load(PatchedModule.resolveFilename(alias, {paths: paths}));
  
  // patch the module with a moduleName for reference
  Type.moduleName = name;
  
  return Type;
}

/**
 * Reset the loaded modules and cache.
 */

ModuleLoader.prototype.reset = function () {
  // clear require cache
  clearObject(require.cache);
  
  // clear module cache
  clearObject(this._modules, function (module) {
    if(typeof module.destroy === 'function') {
      module.destroy();
    } 
  });
  
  // clear type cache
  clearObject(this.types);
  
  ConfigLoader.prototype.reset.apply(this, arguments);
}

/**
 * Build modules from a list of config files.
 */

ModuleLoader.prototype._constructModules = function (configs) {
  Object.keys(configs).forEach(function (p) {
    this.constructModuleFromConfigAtPath(configs[p], p);
  }.bind(this));
}

ModuleLoader.prototype.constructModuleFromConfigAtPath = function (config, p) {
  config.options = config.options || {};
  config.options._moduleLoader = this;
  config.options._name = path.basename(path.dirname(p));
  
  var Type = this.getTypeFromConfig(config, p);
  
  assert(typeof Type === 'function', config.module + ' does not export a constructor');
  
  // private options
  config.options._path = p;
  
  // cache discovered types
  var T = Type;
  
  while(T) {
    this.types[T.name] = T;
    
    T = T.super_;
  }
  
  var m = this._modules[p] = new Type(config.options, config.dependencies);

  // create NodeModule
  var nmFilename = path.resolve(path.dirname(p));
  var nm = new PatchedModule(nmFilename, module);
  nm.exports = m;
  nm.filename = nmFilename;
  nm.loaded = true;
  require('module')._cache[nmFilename] = nm;

  // load main
  if(config.main) {
    var mnmFilename = path.resolve(path.dirname(p), config.main);
    var mnm = new PatchedModule(mnmFilename, nm);
    mnm.load(mnmFilename);
  }
  
  return m;
}

/**
 * Return a module with the provided name.
 */

ModuleLoader.prototype.getByName = function (name) {
  var paths = Object.keys(this._modules);
  
  for (var i = 0; i < paths.length; i++) {
    var n = path.basename(path.dirname(paths[i]));
      
    if(n === name) {
      return this._modules[paths[i]];
    }
  }
}

/**
 * Get a module config by module name.
 */

ModuleLoader.prototype.getConfigAndPathByName = function (name) {
  var paths = Object.keys(this._files);
  
  for (var i = 0; i < paths.length; i++) {
    if(path.basename(path.dirname(paths[i])) === name) {
      return {config: this._files[paths[i]], path: paths[i]};
    }
  }
}

ModuleLoader.prototype.getTypeFromConfig = function (config, configPath) {
  var ml = this;
  var Type;
  var typeName = config.module;

  if(!typeName) return;
  
  // pointing to a relative type file
  if(typeName[0] === '.') {
    try {
      var relPath = path.join(path.dirname(configPath), typeName);
      
      
      debug('requiring relative module %s', relPath);
      Type = require(relPath);
    } catch(e) {
      fail(e);
    }
  } else {
    // pointing to a module
    try {
      // load from the programs main module
      Type = require('module')._load(typeName, process.mainModule);
    } catch(e) {
      fail(e);
    }
  }
  
  if(Type) {
    return Type;
  }
  
  function fail(e) {
    console.error('failed to load module at', configPath, typeName);
    ml.emit('error', e);
  }
}

/**
 * Return all module instances that inherit from the given type.
 */

ModuleLoader.prototype.instanceOf = function (typeName) {
  var Type = this.types[typeName];
  var results = [];
  
  if(!Type) {
    throw new Error(typeName + ' is not a used type');
  }
  
  Object.keys(this._modules).forEach(function (k) {
    if(this._modules[k] instanceof Type) {
      results.push(this._modules[k]);
    }
  }.bind(this));
  
  return results;
}

function clearObject(obj, fn) {
  Object.keys(obj).forEach(function (k) {
    if(fn) {
      fn(obj[k]);
    }
    
    delete obj[k];
  });
}