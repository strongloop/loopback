/**
 * Module dependencies.
 */

var asteroid = require('../asteroid');
var RemoteObjects = require('sl-remoting')

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
    
    
    
    // get models
    var models = app.models();
    
    // export the models as remote objects
    remotes.exports = models;
    
    Object.keys(models).forEach(function (name) {
      var Model = models[name];
      
      Model.sharedCtor = function (id, fn) {
        // TODO this should be agnostic of behavior
        Model.find(id, fn);
      }
      Model.sharedCtor.accepts = {arg: 'id', type: 'any'};
    });
    
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


