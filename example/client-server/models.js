// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

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
