// Copyright IBM Corp. 2014,2019. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
const assert = require('assert');
const loopback = require('../');
const request = require('supertest');

describe('hidden properties', function() {
  beforeEach(function(done) {
    const app = this.app = loopback();
    const Product = this.Product = loopback.PersistedModel.extend(
      'product',
      {},
      {hidden: ['secret']},
    );
    Product.attachTo(loopback.memory());

    const Category = this.Category = loopback.PersistedModel.extend('category');
    Category.attachTo(loopback.memory());
    Category.hasMany(Product);

    app.model(Product);
    app.model(Category);
    app.use(loopback.rest());

    Category.create({
      name: 'my category',
    }, function(err, category) {
      category.products.create({
        name: 'pencil',
        secret: 'a secret',
      }, done);
    });
  });

  afterEach(function(done) {
    const Product = this.Product;
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

        const product = res.body[0];
        assert.equal(product.secret, undefined);

        done();
      });
  });

  it('should hide a property of nested models', function(done) {
    const app = this.app;
    request(app)
      .get('/categories?filter[include]=products')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);

        const category = res.body[0];
        const product = category.products[0];
        assert.equal(product.secret, undefined);

        done();
      });
  });
});
