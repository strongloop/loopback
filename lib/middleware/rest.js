/*!
 * Module dependencies.
 */

var loopback = require('../loopback');

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
  var tokenParser = null;
  return function (req, res, next) {
    var app = req.app;
    var handler = app.handler('rest');

    if(req.url === '/routes') {
      res.send(handler.adapter.allRoutes());
    } else if(req.url === '/models') {
      return res.send(app.remotes().toJSON());
    } else if (app.isAuthEnabled) {
      if (!tokenParser) {
        // NOTE(bajtos) It would be better to search app.models for a model
        // of type AccessToken instead of searching all loopback models.
        // Unfortunately that's not supported now.
        // Related discussions:
        // https://github.com/strongloop/loopback/pull/167
        // https://github.com/strongloop/loopback/commit/f07446a
        var AccessToken = loopback.getModelByType(loopback.AccessToken);
        tokenParser = loopback.token({ model: AccessToken });
      }

      tokenParser(req, res, function(err) {
        if (err) {
          next(err);
        } else {
          handler(req, res, next);
        }
      });
    } else {
      handler(req, res, next);
    }
  };
}

