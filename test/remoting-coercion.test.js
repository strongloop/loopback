// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var assert = require('assert');
var loopback = require('../');
var request = require('supertest');

describe('remoting coercion', function() {
  it('should coerce arguments based on the type', function(done) {
    var called = false;
    var app = loopback();
    app.use(loopback.rest());

    var TestModel = app.registry.createModel('TestModel',
      {},
      {base: 'Model'}
    );
    app.model(TestModel, {public: true});

    TestModel.test = function(inst, cb) {
      called = true;
      assert(inst instanceof TestModel);
      assert(inst.foo === 'bar');
      cb();
    };
    TestModel.remoteMethod('test', {
      accepts: {arg: 'inst', type: 'TestModel', http: {source: 'body'}},
      http: {path: '/test', verb: 'post'},
    });

    request(app)
      .post('/TestModels/test')
      .set('Content-Type', 'application/json')
      .send({
        foo: 'bar',
      })
      .end(function(err) {
        if (err) return done(err);

        assert(called);

        done();
      });
  });
});
