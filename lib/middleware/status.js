/**
 * Export the middleware.
 */

module.exports = status;

function status() {
  var started = new Date();

  return function(req, res) {
    res.send({
      started: started,
      uptime: (Date.now() - Number(started)) / 1000
    });
  }
}

