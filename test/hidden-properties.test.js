var loopback = require('../');

describe('hidden properties', function() {
  beforeEach(function(done) {
    var app = this.app = loopback();
    var Product = this.Product = loopback.PersistedModel.extend('product',
      {},
      {hidden: ['secret']}
    );
    Product.attachTo(loopback.memory());

    var Category = this.Category = loopback.PersistedModel.extend('category');
    Category.attachTo(loopback.memory());
    Category.hasMany(Product);

    app.model(Product);
    app.model(Category);
    app.use(loopback.rest());

    Category.create({
      name: 'my category'
    }, function(err, category) {
      category.products.create({
        name: 'pencil',
        secret: 'a secret'
      }, done);
    });
  });

  afterEach(function(done) {
    var Product = this.Product;
    this.Category.destroyAll(function() {
      Product.destroyAll(done);
    });
  });

  it('should hide a property remotely', function(done) {
    request(this.app)
       .get('/products')
       .expect('Content-Type', /json/)
       .expect(200)
       .end(function(err, res) {
         if (err) return done(err);
         var product = res.body[0];
         assert.equal(product.secret, undefined);
         done();
       });
  });

  it('should hide a property of nested models', function(done) {
    var app = this.app;
    request(app)
      .get('/categories?filter[include]=products')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        var category = res.body[0];
        var product = category.products[0];
        assert.equal(product.secret, undefined);
        done();
      });
  });
});
