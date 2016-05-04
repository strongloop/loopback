// Copyright IBM Corp. 2013,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

/**
 * Expose `Memory`.
 */

module.exports = Memory;

/**
 * Module dependencies.
 */

var Connector = require('./base-connector');
var debug = require('debug')('memory');
var util = require('util');
var inherits = util.inherits;
var assert = require('assert');
var JdbMemory = require('loopback-datasource-juggler/lib/connectors/memory');

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
