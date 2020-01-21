// Copyright IBM Corp. 2014,2019. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
const path = require('path');
const loopback = require('../../');
const models = require('../fixtures/e2e/models');
const TestModel = models.TestModel;
const assert = require('assert');

describe('RemoteConnector', function() {
  before(function() {
    // setup the remote connector
    const ds = loopback.createDataSource({
      url: 'http://127.0.0.1:3000/api',
      connector: loopback.Remote,
    });
    TestModel.attachTo(ds);
  });

  it('should be able to call create', function(done) {
    TestModel.create({
      foo: 'bar',
    }, function(err, inst) {
      if (err) return done(err);

      assert(inst.id);

      done();
    });
  });

  it('should be able to call save', function(done) {
    const m = new TestModel({
      foo: 'bar',
    });
    m.save(function(err, data) {
      if (err) return done(err);

      assert(data.foo === 'bar');

      done();
    });
  });
});
