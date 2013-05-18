/**
 * Expose `PatchedModule`.
 */

module.exports = PatchedModule;

/**
 * Module dependencies.
 */
 
var Module = require('module')
  , debug = require('debug')('configurable-module')
  , path = require('path')
  , util = require('util')
  , inherits = util.inherits
  , assert = require('assert');
  
/**
 * Create a new `PatchedModule` with the given `options`.
 *
 * @param {Object} options
 * @return {Module}
 */

function PatchedModule(id, parent) {
  Module.apply(this, arguments);
}

/**
 * Inherit from node's core `Module`.
 */

inherits(PatchedModule, Module);

/**
 * Override the default require implementation to check the cache first.
 */

PatchedModule.prototype.require = function (p) {
  if(p === '.') p = './';
  
  // for relative modules, check the cache first
  var sub = p.substr(0, 2);
  var isRelative = (sub === './' || sub === '..');
  
  if(isRelative) {
    var resolvedPath = path.resolve(path.dirname(this.filename), p);

    // check cache first (node's implementation checks the file first)
    var cached = Module._cache[resolvedPath];
    if(cached) {
      return cached.exports;
    }
  }
  
  return Module.prototype.require.apply(this, arguments);
}

/**
 * Alias functions in case they needs to be patched in the future.
 */

PatchedModule.resolveFilename = Module._resolveFilename;
PatchedModule.load = Module._load;
PatchedModule.resolveLookupPaths = Module._resolveLookupPaths;
PatchedModule.nodeModulePaths = Module._nodeModulePaths;