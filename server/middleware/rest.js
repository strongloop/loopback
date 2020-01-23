// Copyright IBM Corp. 2014,2019. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

/*!
 * Module dependencies.
 */

'use strict';
const g = require('../../lib/globalize');
const loopback = require('../../lib/loopback');
const async = require('async');

/*!
 * Export the middleware.
 */

module.exports = rest;

/**
 * Expose models over REST.
 *
 * For example:
 * ```js
 * app.use(loopback.rest());
 * ```
 * For more information, see [Exposing models over a REST API](http://loopback.io/doc/en/lb2/Exposing-models-over-REST.html).
 * @header loopback.rest()
 */

function rest() {
  let handlers; // Cached handlers

  return function restApiHandler(req, res, next) {
    const app = req.app;
    const registry = app.registry;

    if (!handlers) {
      handlers = [];
      const remotingOptions = app.get('remoting') || {};

      const contextOptions = remotingOptions.context;
      if (contextOptions !== undefined && contextOptions !== false) {
        throw new Error(g.f(
          '%s was removed in version 3.0. See %s for more details.',
          'remoting.context option',
          'http://loopback.io/doc/en/lb2/Using-current-context.html',
        ));
      }

      if (app.isAuthEnabled) {
        const AccessToken = registry.getModelByType('AccessToken');
        handlers.push(loopback.token({model: AccessToken, app: app}));
      }

      handlers.push(function(req, res, next) {
        // Need to get an instance of the REST handler per request
        return app.handler('rest')(req, res, next);
      });
    }
    if (handlers.length === 1) {
      return handlers[0](req, res, next);
    }
    async.eachSeries(handlers, function(handler, done) {
      handler(req, res, done);
    }, next);
  };
}
