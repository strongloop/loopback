var loopback = require('../../');
var server = module.exports = loopback();
var CartItem = require('./models').CartItem;
var memory = loopback.createDataSource({
  connector: loopback.Memory
});

server.use(loopback.rest());
server.model(CartItem);

CartItem.attachTo(memory);

// test data
CartItem.create([
  {item: 'red hat', qty: 6, price: 19.99, cartId: 1},
  {item: 'green shirt', qty: 1, price: 14.99, cartId: 1},
  {item: 'orange pants', qty: 58, price: 9.99, cartId: 1}
]);

CartItem.sum(1, function(err, total) {
  console.log(total);
});

server.listen(3000);
