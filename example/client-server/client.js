var loopback = require('../../');
var client = loopback();
var CartItem = require('./models').CartItem;
var remote = loopback.createDataSource({
  connector: loopback.Remote,
  url: 'http://localhost:3000'
});

client.model(CartItem);
CartItem.attachTo(remote);

// call the remote method
CartItem.sum(1, function(err, total) {
  console.log('result:', err || total);
});

// call a built in remote method
CartItem.find(function(err, items) {
  console.log(items);
});
