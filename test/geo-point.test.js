// Copyright IBM Corp. 2013,2019. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
const assert = require('assert');
const loopback = require('../');
const GeoPoint = loopback.GeoPoint;

describe('GeoPoint', function() {
  describe('geoPoint.distanceTo(geoPoint, options)', function() {
    it('Get the distance to another `GeoPoint`', function() {
      const here = new GeoPoint({lat: 10, lng: 10});
      const there = new GeoPoint({lat: 5, lng: 5});
      const distance = here.distanceTo(there, {type: 'meters'});

      assert.equal(Math.floor(distance), 782777);
    });
  });

  describe('GeoPoint.distanceBetween(a, b, options)', function() {
    it('Get the distance between two points', function() {
      const here = new GeoPoint({lat: 10, lng: 10});
      const there = new GeoPoint({lat: 5, lng: 5});
      const distance = GeoPoint.distanceBetween(here, there, {type: 'feet'});

      assert.equal(Math.floor(distance), 2568169);
    });
  });

  describe('GeoPoint()', function() {
    it('Create from string', function() {
      const point = new GeoPoint('1.234,5.678');
      assert.equal(point.lat, 1.234);
      assert.equal(point.lng, 5.678);
      const point2 = new GeoPoint('1.222,         5.333');
      assert.equal(point2.lat, 1.222);
      assert.equal(point2.lng, 5.333);
      const point3 = new GeoPoint('1.333, 5.111');
      assert.equal(point3.lat, 1.333);
      assert.equal(point3.lng, 5.111);
    });
    it('Serialize as string', function() {
      const str = '1.234,5.678';
      const point = new GeoPoint(str);
      assert.equal(point.toString(), str);
    });
    it('Create from array', function() {
      const point = new GeoPoint([5.555, 6.777]);
      assert.equal(point.lat, 5.555);
      assert.equal(point.lng, 6.777);
    });
    it('Create as Model property', function() {
      const Model = loopback.createModel('geo-model', {
        geo: {type: 'GeoPoint'},
      });

      const m = new Model({
        geo: '1.222,3.444',
      });

      assert(m.geo instanceof GeoPoint);
      assert.equal(m.geo.lat, 1.222);
      assert.equal(m.geo.lng, 3.444);
    });
  });
});
