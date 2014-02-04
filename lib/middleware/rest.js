/**
 * Module dependencies.
 */

var loopback = require('../loopback');

/**
 * Export the middleware.
 */

module.exports = rest;

/**
 * Build a temp app for mounting resources.
 */

function rest() {
  var token = null;
  return function (req, res, next) {
    var app = req.app;
    var handler = app.handler('rest');
    
    if(req.url === '/routes') {
      res.send(handler.adapter.allRoutes());
    } else if(req.url === '/models') {
      return res.send(app.remotes().toJSON());
    } else if (app.isAuthEnabled) {
      if (!token) {
        token = loopback.token({
          model: app.getModelByType(loopback.AccessToken)
        });
      }

      token(req, res, function(err) {
        if (err)
          next(err);
        else
          handler(req, res, next);
      });
    } else {
      handler(req, res, next);
    }
  }
}

