/**
 * Expose `Memory`.
 */

module.exports = Memory;

/**
 * Module dependencies.
 */

var Connector = require('./base-connector')
  , util = require('util')
  , inherits = util.inherits
  , JdbMemory = require('loopback-datasource-juggler/lib/connectors/memory');

/**
 * Create a new `Memory` connector with the given `options`.
 *
 * @param {Object} options
 * @return {Memory}
 */

function Memory() {
  // TODO implement entire memory connector
}

/**
 * Inherit from `DBConnector`.
 */

inherits(Memory, Connector);

/**
 * JugglingDB Compatibility
 */

Memory.initialize = JdbMemory.initialize;
