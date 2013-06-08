describe('DataSource', function() {

  describe('dataSource.createModel(name, properties, settings)', function() {
    it("Define a model and attach it to a `DataSource`.", function(done) {
      /* example - 
      var Color = oracle.createModel('color', {name: String});
      */
      done(new Error('test not implemented'));
    });
  });

  describe('dataSource.discover(options, fn)', function() {
    it("Discover an object containing properties and settings for an existing data source.", function(done) {
      /* example - 
      oracle.discover({owner: 'MYORG'}, function(err, tables) {
        var productSchema = tables.PRODUCTS;
        var ProductModel = oracle.createModel('product', productSchema.properties, productSchema.settings);
      });
      
      */
      done(new Error('test not implemented'));
    });
  });

  describe('dataSource.discoverSync(options)', function() {
    it("Synchronously discover an object containing properties and settings for an existing data source tables or collections.", function(done) {
      /* example - 
      var tables = oracle.discover({owner: 'MYORG'});
      var productSchema = tables.PRODUCTS;
      var ProductModel = oracle.createModel('product', productSchema.properties, productSchema.settings);
      
      */
      done(new Error('test not implemented'));
    });
  });

  describe('dataSource.discoverModels(options, fn) ', function() {
    it("Discover a set of models based on tables or collections in a data source.", function(done) {
      /* example - 
      oracle.discoverModels({owner: 'MYORG'}, function(err, models) {
        var ProductModel = models.Product;
      });
      
      
      */
      done(new Error('test not implemented'));
    });
  });

  describe('dataSource.discoverModelsSync(options)', function() {
    it("Synchronously Discover a set of models based on tables or collections in a data source.", function(done) {
      /* example - 
      var models = oracle.discoverModels({owner: 'MYORG'});
      var ProductModel = models.Product;
      */
      done(new Error('test not implemented'));
    });
  });

  describe('dataSource.enable(operation)', function() {
    it("Enable a data source operation", function(done) {
      /* example - 
      // all rest data source operations are
      // disabled by default
      var rest = asteroid.createDataSource({
        connector: require('asteroid-rest'),
        url: 'http://maps.googleapis.com/maps/api'
        enableAll: true
      });
      
      // enable an operation
      twitter.enable('find');
      
      // enable remote access
      twitter.enableRemote('find')
      
      */
      done(new Error('test not implemented'));
    });
  });

  describe('dataSource.disable(operation)', function() {
    it("Disable a data source operation", function(done) {
      /* example - 
      // all rest data source operations are
      // disabled by default
      var oracle = asteroid.createDataSource({
        connector: require('asteroid-oracle'),
        host: '...',
        ...
      });
      // disable an operation completely
      oracle.disable('destroyAll');
      
      // or only disable it as a remote method
      oracle.disableRemote('destroyAll');
      */
      done(new Error('test not implemented'));
    });
  });

  describe('dataSource.operations()', function() {
    it("List the enabled and disabled operations.", function(done) {
      /* example - 
      console.log(oracle.operations());
      
      {
        find: {
          allowRemote: true,
          accepts: [...],
          returns: [...]
          enabled: true
        },
        ...
      }
      var memory = asteroid.createDataSource({
        connector: require('asteroid-memory')
      });
      
      {
        "dependencies": {
          "asteroid-oracle": "latest"
        }
      }
      var CoffeeShop = asteroid.createModel('coffee-shop', {
        location: 'GeoPoint'
      });
      CoffeeShop.attach(oracle);
      var here = new GeoPoint({lat: 10.32424, long: 5.84978});
      CoffeeShop.all({where: {location: {near: here}}}, function(err, nearbyShops) {
        console.info(nearbyShops); // [CoffeeShop, ...]
      });
      */
      done(new Error('test not implemented'));
    });
  });
});