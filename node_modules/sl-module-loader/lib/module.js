/**
 * Expose `Module`.
 */

module.exports = Module;

/**
 * Module dependencies.
 */
 
var EventEmitter = require('events').EventEmitter
  , debug = require('debug')('module')
  , path = require('path')
  , util = require('util')
  , inherits = util.inherits
  , assert = require('assert');
  
/**
 * Create a new `Module` with the given `options`.
 *
 * @param {Object} options
 * @return {Module}
 */

function Module(options, dependencies) {
  dependencies = dependencies || {};
  
  EventEmitter.apply(this, arguments);
  
  this.options = options;
  
  if(this.constructor.dependencies) {
    assert(typeof this.constructor.dependencies === 'object', this.constructor.name 
                         + '.dependencies does not allow any dependencies!');

    // merge dependencies for inheritence chain
    var constructor = this.constructor;
    var mergedDeps = {};

    while(constructor) {
      var deps = constructor.dependencies;
      
      if(deps) {
        Object.keys(deps).forEach(function (key) {
          if(!mergedDeps[key]) mergedDeps[key] = deps[key];
        });
      }
      
      // move up the inheritence chain
      constructor = constructor.super_;
    }
    
    this.dependencies = this._resolveDependencies(dependencies, mergedDeps); 
  }
  
  if(this.constructor.options) {
    assert(typeof this.constructor.options === 'object', this.constructor.name 
                         + '.options must be an object!');
                         
    // merge options for inheritence chain
    var constructor = this.constructor;
    var mergedOpts = {};

    while(constructor) {
     var opts = constructor.options;

     if(opts) {
       Object.keys(opts).forEach(function (key) {
         if(!mergedOpts[key]) mergedOpts[key] = opts[key];
       });
     }

     // move up the inheritence chain
     constructor = constructor.super_;
    }
    
    validateOptions(options, mergedOpts);
  }
}

/**
 * Inherit from `EventEmitter`.
 */

inherits(Module, EventEmitter);

/**
 * Build dependencies from constructor description (MyCustomModule.dependencies) and dependencie
 * configuration (config.dependencies).
 */

Module.prototype._resolveDependencies = function (depsConfig, desc) {
  var types = {};
  var deps = {};
  var moduleLoader = this.options._moduleLoader;
  
  // iterate the class description of dependencies
  Object.keys(desc).forEach(function (depName) {
    var depRequired = true;
    
    if(typeof desc[depName] === 'object' && desc[depName].optional) {
      depRequired = false;
    }
    
    var depInstanceName = depsConfig[depName];
    
    if(!depInstanceName) {
      if(depRequired) {
        throw new Error('Required dependency not defined: "' + depName + '"');
      } else {
        // don't load the optional dep
        return;
      }
    }
    
    // load the described type
    try {
      var modPath = desc[depName].module || desc[depName];
      
      if(modPath[0] === '.') {
        modPath = path.resolve('.', path.dirname(this.options._path), desc[depName]);
      }
      
      types[depName] = require('module')._load(modPath, process.mainModule);
    } catch(e) {
      e.message = 'Failed to load dependency "' + depName + ': ' + modPath + '" for ' + this.options._path + '. ' + e.message;
      throw e;
    }
    
    var configAndPath = moduleLoader.getConfigAndPathByName(depInstanceName);
    var config = configAndPath && configAndPath.config;
    var configPath = configAndPath && configAndPath.path;
    
    // try to get the dependency by given dependency instance name
    if(config) {
      var m = moduleLoader.getByName(depInstanceName);

      if(!m) {
        // construct the module now
        m = moduleLoader.constructModuleFromConfigAtPath(config, configPath);
      }
      
      if(!types[depName]) {
        throw new Error(modPath + ' does not correctly export a constructor or does not exist.');
      }
      
      if(!(m instanceof types[depName])) {
        throw new Error('Dependency ' + depName + ' is not an instance of ' + types[depName].name);
      }
      
      deps[depName] = m;
    } else {
      console.log(depsConfig);
      
      throw new Error('Could not find dependency "'+ depInstanceName +'" config while resolving dependencies for ' + this.options._path);
    }
  }.bind(this));
  
  return deps;
}

Module.prototype.destroy = function () {
  this.emit('destroy');
}

function validateOptions(options, def) {
  if(!def) {
    return options;
  }
  
  Object.keys(def).forEach(function (key) {
    var val = options[key];
    var keyDef = def[key] || {};
    
    if(keyDef.required) {
      assert(val, key + ' is required!');
    }
    
    if(typeof val === 'undefined') {
      // stop validation if a value
      // wasnt provided
      return;
    }
    
    if(keyDef.type === 'array') {
      assert(Array.isArray(val), key + ' must be a ' + keyDef.type)
    } else {
      // type
      assert(typeof val == keyDef.type, key + ' must be a ' + keyDef.type);
    }
    
    // size / length
    if(typeof val.length === 'number') {
      if(keyDef.min) {
        assert(val.length >= keyDef.min, key + ' length must be greater than or equal to ', keyDef.min);
      }
      if(keyDef.max) {
        assert(val.length <= keyDef.min, key + ' length must be less than or equal to ', keyDef.max);
      }
    } else if(typeof val === 'number') {
      if(keyDef.min) {
        assert(val >= keyDef.min, key + ' must be greater than or equal to ', keyDef.min);        
      }
      if(keyDef.max) {
        assert(val <= keyDef.max, ' must be less than or equal to ', keyDef.max);
      }
    }
  });
}