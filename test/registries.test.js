describe('Registry', function() {
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

      var FooModel = appFoo.model(modelName, settings);
      var FooSubModel = appFoo.model(subModelName, settings);
      var BarModel = appBar.model(modelName, settings);
      var BarSubModel = appBar.model(subModelName, settings);

      FooModel.attachTo(dsFoo);
      FooSubModel.attachTo(dsFoo);
      BarModel.attachTo(dsBar);
      BarSubModel.attachTo(dsBar);

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
