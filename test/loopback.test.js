describe('loopback', function() {
  describe('exports', function() {
    it('ValidationError', function() {
      expect(loopback.ValidationError).to.be.a('function')
        .and.have.property('name', 'ValidationError');
    });
  });

  describe('loopback.createDataSource(options)', function(){
    it('Create a data source with a connector.', function() {
      var dataSource = loopback.createDataSource({
        connector: loopback.Memory
      });
      assert(dataSource.connector);
    });
  });

  describe('loopback.autoAttach', function () {
    it('doesn\'t overwrite model with datasource configured', function () {
      var ds1 = loopback.createDataSource('db1', {
        connector: loopback.Memory
      });

      // setup default data sources
      loopback.setDefaultDataSourceForType('db', ds1);

      var ds2 = loopback.createDataSource('db2', {
        connector: loopback.Memory
      });

      var model1 = ds2.createModel('m1', {});

      var model2 = loopback.createModel('m2');
      model2.autoAttach = 'db';

      // auto attach data sources to models
      loopback.autoAttach();

      assert(model1.dataSource === ds2);
      assert(model2.dataSource === ds1);
    });
  });

  describe('loopback.remoteMethod(Model, fn, [options]);', function() {
    it("Setup a remote method.", function() {
      var Product = loopback.createModel('product', {price: Number});
      
      Product.stats = function(fn) {
        // ...
      }
      
      loopback.remoteMethod(
        Product.stats,
        {
          returns: {arg: 'stats', type: 'array'},
          http: {path: '/info', verb: 'get'}
        }
      );
      
      assert.equal(Product.stats.returns.arg, 'stats');
      assert.equal(Product.stats.returns.type, 'array');
      assert.equal(Product.stats.http.path, '/info');
      assert.equal(Product.stats.http.verb, 'get');
      assert.equal(Product.stats.shared, true);
    });
  });

  describe('loopback.createModel(name, properties, options)', function () {
    describe('options.base', function () {
      it('should extend from options.base', function () {
        var MyModel = loopback.createModel('MyModel', {}, {
          foo: {
            bar: 'bat'
          }
        });
        var MyCustomModel = loopback.createModel('MyCustomModel', {}, {
          base: 'MyModel',
          foo: {
            bat: 'baz'
          }
        });
        assert(MyCustomModel.super_ === MyModel);
        assert.deepEqual(MyCustomModel.settings.foo, { bar: 'bat', bat: 'baz' });
        assert(MyCustomModel.super_.modelName === MyModel.modelName);
      });
    });

    describe('loopback.getModel and getModelByType', function () {
      it('should be able to get model by name', function () {
        var MyModel = loopback.createModel('MyModel', {}, {
          foo: {
            bar: 'bat'
          }
        });
        var MyCustomModel = loopback.createModel('MyCustomModel', {}, {
          base: 'MyModel',
          foo: {
            bat: 'baz'
          }
        });
        assert(loopback.getModel('MyModel') === MyModel);
        assert(loopback.getModel('MyCustomModel') === MyCustomModel);
        assert(loopback.getModel('Invalid') === undefined);
      });
      it('should be able to get model by type', function () {
        var MyModel = loopback.createModel('MyModel', {}, {
          foo: {
            bar: 'bat'
          }
        });
        var MyCustomModel = loopback.createModel('MyCustomModel', {}, {
          base: 'MyModel',
          foo: {
            bat: 'baz'
          }
        });
        assert(loopback.getModelByType(MyModel) === MyCustomModel);
        assert(loopback.getModelByType(MyCustomModel) === MyCustomModel);
      });
    });
  });
});
