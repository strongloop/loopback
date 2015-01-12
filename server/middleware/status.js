/*!
 * Export the middleware.
 */

module.exports = status;

/**
 * Return [HTTP response](http://expressjs.com/4x/api.html#res.send) with basic
 * application status information: date the application was started and uptime,
 * in JSON format.
 * For example:
 * ```js
 * {
 *  "started": "2014-06-05T00:26:49.750Z",
 *  "uptime": 9.394
 * }
 * ```
 *
 * @options {Object} [config] Middleware configuration
 * @property {Boolean} [scopeToGetRoot] Whether the middleware should handle
 * only `GET /` requests. By default, the middleware responds to all requests.
 * @end
 * @header loopback.status()
 */
function status(config) {
  var started = new Date();

  return function(req, res, next) {
    if (config && config.scopeToGetRoot &&
        (req.method !== 'GET' || req.path !== '/')) {
      return next();
    }

    res.send({
      started: started,
      uptime: (Date.now() - Number(started)) / 1000
    });
  };
}
