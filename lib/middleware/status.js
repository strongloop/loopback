/*!
 * Export the middleware.
 */

module.exports = status;

/**
 * Return [HTTP response](http://expressjs.com/4x/api.html#res.send) with basic application status information:
 * date the application was started and uptime, in JSON format.
 * For example:
 * ```js
 * {
 *  "started": "2014-06-05T00:26:49.750Z",
 *  "uptime": 9.394
 * }
 * ```
 *
 * @header loopback.status()
 */
function status() {
  var started = new Date();

  return function(req, res) {
    res.send({
      started: started,
      uptime: (Date.now() - Number(started)) / 1000
    });
  };
}

