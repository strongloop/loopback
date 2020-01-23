// Copyright IBM Corp. 2013,2019. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

/**
 * Expose `Memory`.
 */

'use strict';
module.exports = Memory;

/**
 * Module dependencies.
 */

const Connector = require('./base-connector');
const debug = require('debug')('memory');
const util = require('util');
const inherits = util.inherits;
const assert = require('assert');
const JdbMemory = require('loopback-datasource-juggler/lib/connectors/memory');

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
