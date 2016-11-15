// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var g = require('../../lib/globalize');

/**
 * Data model for key-value databases.
 *
 * @class KeyValueModel
 * @inherits {Model}
 */

module.exports = function(KeyValueModel) {
  /**
   * Return the value associated with a given key.
   *
   * @param {String} key Key to use when searching the database.
   * @options {Object} options
   * @callback {Function} callback
   * @param {Error} err Error object.
   * @param {Any} result Value associated with the given key.
   * @promise
   *
   * @header KeyValueModel.get(key, cb)
   */
  KeyValueModel.get = function(key, options, callback) {
    throwNotAttached(this.modelName, 'get');
  };

  /**
   * Persist a value and associate it with the given key.
   *
   * @param {String} key Key to associate with the given value.
   * @param {Any} value Value to persist.
   * @options {Number|Object} options Optional settings for the key-value
   *   pair. If a Number is provided, it is set as the TTL (time to live) in ms
   *   (milliseconds) for the key-value pair.
   * @property {Number} ttl TTL for the key-value pair in ms.
   * @callback {Function} callback
   * @param {Error} err Error object.
   * @promise
   *
   * @header KeyValueModel.set(key, value, cb)
   */
  KeyValueModel.set = function(key, value, options, callback) {
    throwNotAttached(this.modelName, 'set');
  };

  /**
   * Set the TTL (time to live) in ms (milliseconds) for a given key. TTL is the
   * remaining time before a key-value pair is discarded from the database.
   *
   * @param {String} key Key to use when searching the database.
   * @param {Number} ttl TTL in ms to set for the key.
   * @options {Object} options
   * @callback {Function} callback
   * @param {Error} err Error object.
   * @promise
   *
   * @header KeyValueModel.expire(key, ttl, cb)
   */
  KeyValueModel.expire = function(key, ttl, options, callback) {
    throwNotAttached(this.modelName, 'expire');
  };

  /**
   * Return the TTL (time to live) for a given key. TTL is the remaining time
   * before a key-value pair is discarded from the database.
   *
   * @param {String} key Key to use when searching the database.
   * @options {Object} options
   * @callback {Function} callback
   * @param {Error} error
   * @param {Number} ttl Expiration time for the key-value pair. `undefined` if
   *   TTL was not initially set.
   * @promise
   *
   * @header KeyValueModel.ttl(key, cb)
   */
  KeyValueModel.ttl = function(key, options, callback) {
    throwNotAttached(this.modelName, 'ttl');
  };

  /**
   * Return all keys in the database.
   *
   * **WARNING**: This method is not suitable for large data sets as all
   * key-values pairs are loaded into memory at once. For large data sets,
   * use `iterateKeys()` instead.
   *
   * @param {Object} filter An optional filter object with the following
   * @param {String} filter.match Glob string used to filter returned
   *   keys (i.e. `userid.*`). All connectors are required to support `*` and
   *   `?`, but may also support additional special characters specific to the
   *   database.
   * @param {Object} options
   * @callback {Function} callback
   * @promise
   *
   * @header KeyValueModel.keys(filter, cb)
   */
  KeyValueModel.keys = function(filter, options, callback) {
    throwNotAttached(this.modelName, 'keys');
  };

  /**
   * Asynchronously iterate all keys in the database. Similar to `.keys()` but
   * instead allows for iteration over large data sets without having to load
   * everything into memory at once.
   *
   * Callback example:
   * ```js
   * // Given a model named `Color` with two keys `red` and `blue`
   * var iterator = Color.iterateKeys();
   * it.next(function(err, key) {
   *   // key contains `red`
   *   it.next(function(err, key) {
   *     // key contains `blue`
   *   });
   * });
   * ```
   *
   * Promise example:
   * ```js
   * // Given a model named `Color` with two keys `red` and `blue`
   * var iterator = Color.iterateKeys();
   * Promise.resolve().then(function() {
   *   return it.next();
   * })
   * .then(function(key) {
   *   // key contains `red`
   *   return it.next();
   * });
   * .then(function(key) {
   *   // key contains `blue`
   * });
   * ```
   *
   * @param {Object} filter An optional filter object with the following
   * @param {String} filter.match Glob string to use to filter returned
   *   keys (i.e. `userid.*`). All connectors are required to support `*` and
   *   `?`. They may also support additional special characters that are
   *   specific to the backing database.
   * @param {Object} options
   * @returns {AsyncIterator} An Object implementing `next(cb) -> Promise`
   *   function that can be used to iterate all keys.
   *
   * @header KeyValueModel.iterateKeys(filter)
   */
  KeyValueModel.iterateKeys = function(filter, options) {
    throwNotAttached(this.modelName, 'iterateKeys');
  };

  /*!
   * Set up remoting metadata for this model.
   *
   * **Notes**:
   * - The method is called automatically by `Model.extend` and/or
   *   `app.registry.createModel`
   * - In general, base models use call this to ensure remote methods are
   *   inherited correctly, see bug at
   *   https://github.com/strongloop/loopback/issues/2350
   */
  KeyValueModel.setup = function() {
    KeyValueModel.base.setup.apply(this, arguments);

    this.remoteMethod('get', {
      accepts: {
        arg: 'key', type: 'string', required: true,
        http: {source: 'path'},
      },
      returns: {arg: 'value', type: 'any', root: true},
      http: {path: '/:key', verb: 'get'},
      rest: {after: convertNullToNotFoundError},
    });

    this.remoteMethod('set', {
      accepts: [
        {arg: 'key', type: 'string', required: true,
          http: {source: 'path'}},
        {arg: 'value', type: 'any', required: true,
          http: {source: 'body'}},
        {arg: 'ttl', type: 'number',
          http: {source: 'query'},
          description: 'time to live in milliseconds'},
      ],
      http: {path: '/:key', verb: 'put'},
    });

    this.remoteMethod('expire', {
      accepts: [
        {arg: 'key', type: 'string', required: true,
          http: {source: 'path'}},
        {arg: 'ttl', type: 'number', required: true,
          http: {source: 'form'}},
      ],
      http: {path: '/:key/expire', verb: 'put'},
    });

    this.remoteMethod('ttl', {
      accepts: {
        arg: 'key', type: 'string', required: true,
        http: {source: 'path'},
      },
      returns: {arg: 'value', type: 'any', root: true},
      http: {path: '/:key/ttl', verb: 'get'},
    });

    this.remoteMethod('keys', {
      accepts: {
        arg: 'filter', type: 'object', required: false,
        http: {source: 'query'},
      },
      returns: {arg: 'keys', type: ['string'], root: true},
      http: {path: '/keys', verb: 'get'},
    });
  };
};

function throwNotAttached(modelName, methodName) {
  throw new Error(g.f(
    'Cannot call %s.%s(). ' +
      'The %s method has not been setup. '  +
      'The {{KeyValueModel}} has not been correctly attached ' +
      'to a {{DataSource}}!',
    modelName, methodName, methodName));
}

function convertNullToNotFoundError(ctx, cb) {
  if (ctx.result !== null) return cb();

  var modelName = ctx.method.sharedClass.name;
  var id = ctx.getArgByName('id');
  var msg = g.f('Unknown "%s" {{key}} "%s".', modelName, id);
  var error = new Error(msg);
  error.statusCode = error.status = 404;
  error.code = 'KEY_NOT_FOUND';
  cb(error);
}
