var loopback = require('../../');

var CartItem = exports.CartItem = loopback.PersistedModel.extend('CartItem', {
  tax: {type: Number, default: 0.1},
  price: Number,
  item: String,
  qty: {type: Number, default: 0},
  cartId: Number
});

CartItem.sum = function(cartId, callback) {
  this.find({where: {cartId: 1}}, function(err, items) {
    var total = items
      .map(function(item) {
        return item.total();
      })
      .reduce(function(cur, prev) {
        return prev + cur;
      }, 0);

    var ns = loopback.getCurrentContext();
    if (ns && ns.get('http')) {
      console.log('Remote call via url: %s', ns.get('http').req.url);
    }
    callback(null, total);
  });
}

CartItem.remoteMethod('sum',
  {
    accepts: {arg: 'cartId', type: 'number'},
    returns: {arg: 'total', type: 'number'}
  }
);

CartItem.prototype.total = function() {
  return this.price * this.qty * 1 + this.tax;
}
