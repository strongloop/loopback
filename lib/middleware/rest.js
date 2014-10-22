/*!
 * Module dependencies.
 */

var loopback = require('../loopback');
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

function rest(options) {
  options = options || {};
  var tokenParser = null;
  var contextHandler = null;
  if (options.context) {
    var contextOptions = options.context;
    if(typeof contextOptions !== 'object') {
      contextOptions = {};
    }
    contextHandler = loopback.context(contextOptions);
  }
  return function restApiHandler(req, res, next) {
    var app = req.app;
    var handler = app.handler('rest');

    if (req.url === '/routes') {
      return res.send(handler.adapter.allRoutes());
    } else if (req.url === '/models') {
      return res.send(app.remotes().toJSON());
    }

    var handlers = [];
    if (options.context) {
      handlers.push(contextHandler);
    }
    if (app.isAuthEnabled) {
      if (!tokenParser) {
        // NOTE(bajtos) It would be better to search app.models for a model
        // of type AccessToken instead of searching all loopback models.
        // Unfortunately that's not supported now.
        // Related discussions:
        // https://github.com/strongloop/loopback/pull/167
        // https://github.com/strongloop/loopback/commit/f07446a
        var AccessToken = loopback.getModelByType(loopback.AccessToken);
        tokenParser = loopback.token({ model: AccessToken });
        handlers.push(tokenParser);
      }
    }
    handlers.push(handler);
    async.eachSeries(handlers, function(handler, done) {
      handler(req, res, done);
    }, next);
  };
}
