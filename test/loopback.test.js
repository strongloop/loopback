describe('loopback', function() {
  describe('loopback.createDataSource(options)', function(){
    it('Create a data source with a connector.', function() {
      var dataSource = loopback.createDataSource({
        connector: loopback.Memory
      });
      assert(dataSource.connector);
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
});
