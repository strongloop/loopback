// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var loopback = require('../');
var app;
var assert = require('assert');
var request = require('supertest');
var expect = require('chai').expect;

describe('loopback.errorHandler(options)', function() {
  it('should throw a descriptive error', function(done) {
    try {
  //arrange
      var app = loopback();
      app.use(loopback.urlNotFound());
      app.use(loopback.errorHandler({ log: false }));
    } catch (e) {
      expect(function() { loopback.errorHandler(); })
      .to.throw(/no longer available.*strong-error-handler/);
      done();
    }
  });
});
