/*!
 * Module dependencies.
 */

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
  return function restApiHandler(req, res, next) {
    var app = req.app;
    var restHandler = app.handler('rest');

    if (req.url === '/routes') {
      return res.send(restHandler.adapter.allRoutes());
    } else if (req.url === '/models') {
      return res.send(app.remotes().toJSON());
    }

    var preHandlers;

    if (!preHandlers) {
      preHandlers = [];
      var remotingOptions = app.get('remoting') || {};

      var contextOptions = remotingOptions.context;
      if (contextOptions !== false) {
        if (typeof contextOptions !== 'object')
          contextOptions = {};
        preHandlers.push(loopback.context(contextOptions));
      }

      if (app.isAuthEnabled) {
        // NOTE(bajtos) It would be better to search app.models for a model
        // of type AccessToken instead of searching all loopback models.
        // Unfortunately that's not supported now.
        // Related discussions:
        // https://github.com/strongloop/loopback/pull/167
        // https://github.com/strongloop/loopback/commit/f07446a
        var AccessToken = loopback.getModelByType(loopback.AccessToken);
        preHandlers.push(loopback.token({ model: AccessToken }));
      }
    }

    async.eachSeries(preHandlers.concat(restHandler), function(handler, done) {
      handler(req, res, done);
    }, next);
  };
}
