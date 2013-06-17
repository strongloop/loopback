describe('asteroid', function() {
  describe('asteroid.createDataSource(options)', function(){
    it('Create a data source with a connector.', function() {
      var dataSource = asteroid.createDataSource({
        connector: asteroid.Memory
      });
      assert(dataSource.connector());
    });
  });
  
  describe('asteroid.remoteMethod(Model, fn, [options]);', function() {
    it("Setup a remote method.", function() {
      var Product = asteroid.createModel('product', {price: Number});
      
      Product.stats = function(fn) {
        // ...
      }
      
      asteroid.remoteMethod(
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
});