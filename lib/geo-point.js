/**
 * Export the `GeoPoint` class.
 */

module.exports = GeoPoint;

function GeoPoint(data) {
  if(!(this instanceof GeoPoint)) {
    return new GeoPoint(data);
  }
  
  this.lat = data.lat;
  this.lng = data.lng;
}

// TODO remove this
// register the type
require('jugglingdb/lib/model-builder').ModelBuilder.registerType(GeoPoint);