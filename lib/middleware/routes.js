/**
 * Module dependencies.
 */

var asteroid = require('../asteroid');

/**
 * Export the middleware.
 */

module.exports = routes;

/**
 * Build a temp app for mounting resources.
 */

function routes() {
  return function (req, res, next) {
    // xxx - cache the temp app and only build when modules change?
    var tempApp = asteroid();
    var routes = req.modules.instanceOf('Route');

    // mount all resources
    routes.forEach(function (r) {
      r.mount(tempApp);
    });

    tempApp.handle(req, res, next);
  }
}


