/**
 * Module dependencies.
 */

var loopback = require('../loopback');
var RemoteObjects = require('strong-remoting');

/**
 * Export the middleware.
 */

module.exports = rest;

/**
 * Build a temp app for mounting resources.
 */

function rest() {
  return function (req, res, next) {
    var app = req.app;
    var handler = app.handler('rest');
    
    if(req.url === '/routes') {
      res.send(handler.adapter.allRoutes());
    } else if(req.url === '/models') {
      return res.send(remotes.toJSON());
    } else {
      handler(req, res, next);
    }
  }
}

