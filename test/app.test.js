describe('app', function() {

  describe('app.model(Model)', function() {
    it("Expose a `Model` to remote clients", function() {
      var app = loopback();
      var memory = loopback.createDataSource({connector: loopback.Memory});
      var Color = memory.createModel('color', {name: String});
      app.model(Color);
      assert.equal(app.models().length, 1);
    });
  });

  describe('app.model(name, properties, options)', function () {
    it('Sugar for defining a fully built model', function () {
      var app = loopback();
      app.boot({
        app: {port: 3000, host: '127.0.0.1'},
        dataSources: {
          db: {
            connector: 'memory'
          }
        }
      });

      app.model('foo', {
        dataSource: 'db'
      });

      var Foo = app.models.foo;
      var f = new Foo;

      assert(f instanceof loopback.Model);
    });
  })

  // describe('app.models()', function() {
  //   it("Get the app's exposed models", function() {
  //     var app = loopback();
  //     var models = app.models();

  //     models.forEach(function(m) {
  //       console.log(m.modelName);
  //     })
      
  //     assert.equal(models.length, 1);
  //     assert.equal(models[0].modelName, 'color');
  //   });
  // });

  describe('app.boot([options])', function () {
    beforeEach(function () {
      var app = this.app = loopback();

      app.boot({
        app: {
          port: 3000, 
          host: '127.0.0.1'
        },
        models: {
          'foo-bar-bat-baz': {
            options: {
              plural: 'foo-bar-bat-bazzies'
            },
            dataSource: 'the-db'
          }
        },
        dataSources: {
          'the-db': {
            connector: 'memory'
          } 
        }
      });
    });

    it('Load configuration', function () {
      assert.equal(this.app.get('port'), 3000);
      assert.equal(this.app.get('host'), '127.0.0.1');
    });

    it('Instantiate models', function () {
      assert(app.models);
      assert(app.models.FooBarBatBaz);
      assert(app.models.fooBarBatBaz);
      assertValidDataSource(app.models.FooBarBatBaz.dataSource);
      assert.isFunc(app.models.FooBarBatBaz, 'find');
      assert.isFunc(app.models.FooBarBatBaz, 'create');
    });

    it('Attach models to data sources', function () {
      assert.equal(app.models.FooBarBatBaz.dataSource, app.dataSources.theDb);
    });

    it('Instantiate data sources', function () {
      assert(app.dataSources);
      assert(app.dataSources.theDb);
      assertValidDataSource(app.dataSources.theDb);
      assert(app.dataSources.TheDb);
    });
  });

  describe('app.boot(appRootDir)', function () {
    it('Load config files', function () {
      var app = loopback();

      app.boot(require('path').join(__dirname, 'fixtures', 'simple-app'));

      assert(app.models.foo);
      assert(app.models.Foo);
      assert(app.models.Foo.dataSource);
      assert.isFunc(app.models.Foo, 'find');
      assert.isFunc(app.models.Foo, 'create');
    });
  });
});
