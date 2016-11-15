// Copyright IBM Corp. 2013,2014. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

/**
 * Expose `Connector`.
 */

'use strict';
module.exports = Connector;

/**
 * Module dependencies.
 */

var EventEmitter = require('events').EventEmitter;
var debug = require('debug')('connector');
var util = require('util');
var inherits = util.inherits;
var assert = require('assert');

/**
 * Create a new `Connector` with the given `options`.
 *
 * @param {Object} options
 * @return {Connector}
 */

function Connector(options) {
  EventEmitter.apply(this, arguments);
  this.options = options;

  debug('created with options', options);
}

/**
 * Inherit from `EventEmitter`.
 */

inherits(Connector, EventEmitter);

/*!
 * Create an connector instance from a JugglingDB adapter.
 */

Connector._createJDBAdapter = function(jdbModule) {
  var fauxSchema = {};
  jdbModule.initialize(fauxSchema, function() {
    // connected
  });
};

/*!
 * Add default crud operations from a JugglingDB adapter.
 */

Connector.prototype._addCrudOperationsFromJDBAdapter = function(connector) {

};
