require('zone').enable();

module.exports = context;

function context(options) {
  return function(req, res, next) {
    zone.create(function RequestZone() {
      zone.data.url = req.url;
      next();
    }).catch(function(err) {
      console.error(err.zoneStack + '\n');
    });
  };
}