var loopback = require('../');

describe('hidden properties', function () {
  beforeEach(function (done) {
    var app = this.app = loopback();
    var Product = this.Product = app.model('product', {
      options: {hidden: ['secret']},
      dataSource: loopback.memory()
    });
    app.use(loopback.rest());

    Product.create(
      {name: 'pencil', secret: 'secret'},
      done
    );
  });

  it('should hide a property remotely', function (done) {
     request(this.app)
        .get('/products')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res){
          if(err) return done(err);
          var product = res.body[0];
          assert.equal(product.secret, undefined);
          done();
        });
  });
});
