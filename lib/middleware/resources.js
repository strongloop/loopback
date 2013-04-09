/**
 * Module dependencies.
 */

var asteroid = require('../asteroid');

/**
 * Export the middleware.
 */

module.exports = resources;

/**
 * Build a temp app for mounting resources.
 */

function resources() {
  return function (req, res, next) {
    // xxx - cache the temp app and only build when modules change?
    var tempApp = asteroid();
    var resources = req.modules.instanceOf('Resource');

    // mount all resources
    resources.forEach(function (r) {
      r.mount(tempApp);
    });

    tempApp.handle(req, res, next);
  }
}


