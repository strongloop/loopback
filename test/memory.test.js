describe('Memory Connector', function() {
  it('Create a model using the memory connector', function(done) {
    // use the built in memory function
    // to create a memory data source
    var memory = loopback.memory();

    // or create it using the standard
    // data source creation api
    memory = loopback.createDataSource({
      connector: loopback.Memory
    });

    // create a model using the
    // memory data source
    var properties = {
      name: String,
      price: Number
    };

    var Product = memory.createModel('product', properties);

    Product.create([
      {name: 'apple', price: 0.79},
      {name: 'pear', price: 1.29},
      {name: 'orange', price: 0.59},
    ], count);

    function count() {
      Product.count(function(err, count) {
        assert.equal(count, 3);
        done();
      });
    }
  });
});
