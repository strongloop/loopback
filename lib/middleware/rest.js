/**
 * Module dependencies.
 */

var loopback = require('../loopback');
var RemoteObjects = require('sl-remoting');

/**
 * Export the middleware.
 */

module.exports = rest;

/**
 * Build a temp app for mounting resources.
 */

function rest() {
  return function (req, res, next) {
    var handler = req.app.handler('rest');
    
    if(req.url === '/routes') {
      res.send(handler.adapter.allRoutes());
    } else if(req.url === '/models') {
      return res.send(req.app.remotes().toJSON());
    } else {
      handler(req, res, next);
    }
  }
}


