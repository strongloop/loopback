/**
 * Module dependencies.
 */

var asteroid = require('../asteroid');
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
    var app = req.app;
    var remotes = app.remotes();
    
    // get all remote objects
    var objs = app.remoteObjects();
    
    // export remote objects
    remotes.exports = objs;
    
    var handler = remotes.handler('rest');
    
    if(req.url === '/routes') {
      res.send(handler.adapter.allRoutes());
    } else if(req.url === '/models') {
      return res.send(remotes.toJSON());
    } else {
      handler(req, res, next);
    }
  }
}


