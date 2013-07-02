/**
 * Module dependencies.
 */

var asteroid = require('../asteroid')
  , passport = require('passport');

/**
 * Export the middleware.
 */

module.exports = auth;

/**
 * Build a temp app for mounting resources.
 */

function auth() {
  return function (req, res, next) {
    var sub = asteroid();
    
    // TODO clean this up
    sub._models = req.app._models;
    sub._remotes = req.app._remotes;
    
    sub.use(asteroid.session({secret: 'change me'}))
    sub.use(passport.initialize());
    sub.use(passport.session());
    
    sub.handle(req, res, next);
  }
}


