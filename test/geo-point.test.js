describe('GeoPoint', function() {
  describe('geoPoint.distanceTo(geoPoint, options)', function() {
    it("Get the distance to another `GeoPoint`", function() {
      var here = new GeoPoint({lat: 10, lng: 10});
      var there = new GeoPoint({lat: 5, lng: 5});
      var distance = here.distanceTo(there, {type: 'meters'});

      assert.equal(Math.floor(distance), 782777);
    });
  });

  describe('GeoPoint.distanceBetween(a, b, options)', function() {
    it("Get the distance between two points", function() {
      var here = new GeoPoint({lat: 10, lng: 10});
      var there = new GeoPoint({lat: 5, lng: 5});
      var distance = GeoPoint.distanceBetween(here, there, {type: 'feet'});
      
      assert.equal(Math.floor(distance), 2568169);
    });
  });
  
  describe('GeoPoint()', function(){
    it('Create from string', function() {
      var point = new GeoPoint('1.234,5.678');
      assert.equal(point.lng, 1.234);
      assert.equal(point.lat, 5.678);
      var point2 = new GeoPoint('1.222,         5.333');
      assert.equal(point2.lng, 1.222);
      assert.equal(point2.lat, 5.333);
      var point3 = new GeoPoint('1.333, 5.111');
      assert.equal(point3.lng, 1.333);
      assert.equal(point3.lat, 5.111);
    });
    it('Serialize as string', function() {
      var str = '1.234,5.678';
      var point = new GeoPoint(str);
      assert.equal(point.toString(), str);
    });
    it('Create from array', function() {
      var point = new GeoPoint([5.555, 6.777]);
      assert.equal(point.lng, 5.555);
      assert.equal(point.lat, 6.777);
    });
    it('Create as Model property', function() {
      var Model = loopback.createModel('geo-model', {
        geo: {type: 'GeoPoint'}
      });
      
      var m = new Model({
        geo: '1.222,3.444'
      });
      
      assert(m.geo instanceof GeoPoint);
      assert.equal(m.geo.lng, 1.222);
      assert.equal(m.geo.lat, 3.444);
    });
  });
});
