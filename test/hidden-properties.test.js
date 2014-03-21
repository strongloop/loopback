var loopback = require('../');

describe('hidden properties', function () {
  beforeEach(function (done) {
    var app = this.app = loopback();
    var Product = this.Product = app.model('product', {
      properties: {
        secret: {}
      },
      dataSource: loopback.memory()
    });
    app.listen(done);
  });

  it('should hide a property remotely', function () {
    
  });
});
