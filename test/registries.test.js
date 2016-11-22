// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var assert = require('assert');
var expect = require('chai').expect;
var loopback = require('../');

describe('Registry', function() {
  describe('createModel', function() {
    it('should throw error upon extending non-exist base model', function() {
      var app = loopback();
      var props = {};
      var opts = {base: 'nonexistent'};
      expect(function() { app.registry.createModel('aModel', props, opts); })
        .to.throw(/model\s`aModel`(.*)unknown\smodel\s`nonexistent`/);
    });
  });

  describe('one per app', function() {
    it('should allow two apps to reuse the same model name', function(done) {
      var appFoo = loopback();
      var appBar = loopback();
      var modelName = 'MyModel';
      var subModelName = 'Sub' + modelName;
      var settings = {base: 'PersistedModel'};
      appFoo.set('perAppRegistries', true);
      appBar.set('perAppRegistries', true);
      var dsFoo = appFoo.dataSource('dsFoo', {connector: 'memory'});
      var dsBar = appFoo.dataSource('dsBar', {connector: 'memory'});

      var FooModel = appFoo.registry.createModel(modelName, {}, settings);
      appFoo.model(FooModel, {dataSource: dsFoo});

      var FooSubModel = appFoo.registry.createModel(subModelName, {}, settings);
      appFoo.model(FooSubModel, {dataSource: dsFoo});

      var BarModel = appBar.registry.createModel(modelName, {}, settings);
      appBar.model(BarModel, {dataSource: dsBar});

      var BarSubModel = appBar.registry.createModel(subModelName, {}, settings);
      appBar.model(BarSubModel, {dataSource: dsBar});

      FooModel.hasMany(FooSubModel);
      BarModel.hasMany(BarSubModel);

      expect(appFoo.models[modelName]).to.not.equal(appBar.models[modelName]);

      BarModel.create({name: 'bar'}, function(err, bar) {
        assert(!err);
        bar.subMyModels.create({parent: 'bar'}, function(err) {
          assert(!err);
          FooSubModel.find(function(err, foos) {
            assert(!err);
            expect(foos).to.eql([]);
            BarSubModel.find(function(err, bars) {
              assert(!err);
              expect(bars.map(function(f) {
                return f.parent;
              })).to.eql(['bar']);

              done();
            });
          });
        });
      });
    });
  });
});
