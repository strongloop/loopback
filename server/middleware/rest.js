// Copyright IBM Corp. 2014,2015. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

/*!
 * Module dependencies.
 */

var g = require('../../lib/globalize');
var loopback = require('../../lib/loopback');
var async = require('async');

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
 * For more information, see [Exposing models over a REST API](http://docs.strongloop.com/display/DOC/Exposing+models+over+a+REST+API).
 * @header loopback.rest()
 */

function rest() {
  var handlers; // Cached handlers

  return function restApiHandler(req, res, next) {
    var app = req.app;
    var registry = app.registry;

    if (!handlers) {
      handlers = [];
      var remotingOptions = app.get('remoting') || {};

      var contextOptions = remotingOptions.context;
      if (contextOptions !== undefined && contextOptions !== false) {
        throw new Error(g.f(
          '%s was removed in version 3.0. See %s for more details.',
          'remoting.context option',
          'https://docs.strongloop.com/display/APIC/Using%20current%20context'));
      }

      if (app.isAuthEnabled) {
        var AccessToken = registry.getModelByType('AccessToken');
        handlers.push(loopback.token({ model: AccessToken, app: app }));
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
