describe('GeoPoint', function() {
  describe('geoPoint.distanceTo(geoPoint, options)', function() {
    it("Get the distance to another `GeoPoint`.", function() {
      var here = new GeoPoint({lat: 10, lng: 10});
      var there = new GeoPoint({lat: 5, lng: 5});
      
      assert.equal(here.distanceTo(there, {type: 'meters'}), 782777.923052584);
    });
  });

  describe('GeoPoint.distanceBetween(a, b, options)', function() {
    it("Get the distance between two points.", function() {
      var here = new GeoPoint({lat: 10, lng: 10});
      var there = new GeoPoint({lat: 5, lng: 5});
      
      assert.equal(GeoPoint.distanceBetween(here, there, {type: 'feet'}), 2568169.038886431);
    });
  });
});