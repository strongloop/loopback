// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var path = require('path');
var loopback = require('../../');
var models = require('../fixtures/e2e/models');
var TestModel = models.TestModel;
var LocalTestModel = TestModel.extend('LocalTestModel', {}, {
  trackChanges: true,
});
var assert = require('assert');

describe('Replication', function() {
  before(function() {
    // setup the remote connector
    var ds = loopback.createDataSource({
      url: 'http://127.0.0.1:3000/api',
      connector: loopback.Remote,
    });
    TestModel.attachTo(ds);
    var memory = loopback.memory();
    LocalTestModel.attachTo(memory);
  });

  it('should replicate local data to the remote', function(done) {
    var RANDOM = Math.random();

    LocalTestModel.create({
      n: RANDOM,
    }, function(err, created) {
      LocalTestModel.replicate(0, TestModel, function() {
        if (err) return done(err);

        TestModel.findOne({n: RANDOM}, function(err, found) {
          assert.equal(created.id, found.id);

          done();
        });
      });
    });
  });
});
