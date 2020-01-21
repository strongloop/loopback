// Copyright IBM Corp. 2014,2019. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
const g = require('../../lib/globalize');
const loopback = require('../../');
const client = loopback();
const CartItem = require('./models').CartItem;
const remote = loopback.createDataSource({
  connector: loopback.Remote,
  url: 'http://localhost:3000',
});

client.model(CartItem);
CartItem.attachTo(remote);

// call the remote method
CartItem.sum(1, function(err, total) {
  g.log('result:%s', err || total);
});

// call a built in remote method
CartItem.find(function(err, items) {
  console.log(items);
});
