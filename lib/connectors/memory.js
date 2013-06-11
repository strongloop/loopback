/**
 * Expose `Memory`.
 */

module.exports = Memory;

/**
 * Module dependencies.
 */
 
var Connector = require('./base-connector')
  , debug = require('debug')('memory')
  , util = require('util')
  , inherits = util.inherits
  , assert = require('assert')
  , JdbMemory = require('jugglingdb/lib/adapters/memory');
  
/**
 * Create a new `Memory` connector with the given `options`.
 *
 * @param {Object} options
 * @return {Memory}
 */

function Memory() {
  // TODO implement entire memory adapter
}

/**
 * Inherit from `DBConnector`.
 */

inherits(Memory, Connector);

/**
 * JugglingDB Compatibility
 */

Memory.initialize = JdbMemory.initialize;