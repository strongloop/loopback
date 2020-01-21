// Copyright IBM Corp. 2013,2019. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
const assert = require('assert');
const loopback = require('../');

describe('Memory Connector', function() {
  it('Create a model using the memory connector', function(done) {
    // use the built in memory function
    // to create a memory data source
    let memory = loopback.memory();

    // or create it using the standard
    // data source creation api
    memory = loopback.createDataSource({
      connector: loopback.Memory,
    });

    // create a model using the
    // memory data source
    const properties = {
      name: String,
      price: Number,
    };

    const Product = memory.createModel('product', properties);

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
