var loopback = require('../');
var lt = require('loopback-testing');
var path = require('path');
var SIMPLE_APP = path.join(__dirname, 'fixtures', 'simple-integration-app');
var app = require(path.join(SIMPLE_APP, 'app.js'));
var assert = require('assert');
var expect = require('chai').expect;

describe('relations - integration', function () {

  lt.beforeEach.withApp(app);

  lt.beforeEach.givenModel('store');
  beforeEach(function(done) {
    this.widgetName = 'foo';
    this.store.widgets.create({
      name: this.widgetName
    }, function() {
      done();
    });
  });
  afterEach(function(done) {
    this.app.models.widget.destroyAll(done);
  });

  describe('/store/:id/widgets', function () {
    beforeEach(function() {
      this.url = '/api/stores/' + this.store.id + '/widgets';
    });
    lt.describe.whenCalledRemotely('GET', '/api/stores/:id/widgets', function() {
      it('should succeed with statusCode 200', function() {
        assert.equal(this.res.statusCode, 200);
      });
      describe('widgets (response.body)', function() {
        beforeEach(function() {
          this.widgets = this.res.body;
          this.widget = this.res.body[0];
        });      
        it('should be an array', function() {
          assert(Array.isArray(this.widgets));
        });
        it('should include a single widget', function() {
          assert(this.widgets.length === 1);
          assert(this.widget);
        });
        it('should be a valid widget', function() {
          assert(this.widget.id);
          assert.equal(this.widget.storeId, this.store.id);
          assert.equal(this.widget.name, this.widgetName);
        });
      });
    });
    describe('POST /api/store/:id/widgets', function() {
      beforeEach(function() {
        this.newWidgetName = 'baz';
        this.newWidget = {
          name: this.newWidgetName
        };
      });
      beforeEach(function(done) {
        this.http = this.post(this.url, this.newWidget);
        this.http.send(this.newWidget);
        this.http.end(function(err) {
          if(err) return done(err);
          this.req = this.http.req;
          this.res = this.http.res;
          done();
        }.bind(this));
      });
      it('should succeed with statusCode 200', function() {
        assert.equal(this.res.statusCode, 200);
      });
      describe('widget (response.body)', function() {
        beforeEach(function() {
          this.widget = this.res.body;
        });      
        it('should be an object', function() {
          assert(typeof this.widget === 'object');
          assert(!Array.isArray(this.widget));
        });
        it('should be a valid widget', function() {
          assert(this.widget.id);
          assert.equal(this.widget.storeId, this.store.id);
          assert.equal(this.widget.name, this.newWidgetName);
        });
      });
      it('should have a single widget with storeId', function (done) {
        this.app.models.widget.count({
          storeId: this.store.id
        }, function(err, count) {
          if(err) return done(err);
          assert.equal(count, 2);
          done();
        });
      });
    });
  });

  describe('/widgets/:id/store', function () {
    beforeEach(function (done) {
      var self = this;
      this.store.widgets.create({
        name: this.widgetName
      }, function(err, widget) {
        self.widget = widget;
        self.url = '/api/widgets/' + self.widget.id + '/store';
        done();
      });
    });
    lt.describe.whenCalledRemotely('GET', '/api/widgets/:id/store', function () {
      it('should succeed with statusCode 200', function () {
        assert.equal(this.res.statusCode, 200);
        assert.equal(this.res.body.id, this.store.id);
      });
    });
  });

  describe('hasAndBelongsToMany', function() {
    beforeEach(function defineProductAndCategoryModels() {
      var product = app.model(
        'product',
        { properties: { id: 'string', name: 'string' }, dataSource: 'db' }

      );
      var category = app.model(
        'category',
        { properties: { id: 'string', name: 'string' }, dataSource: 'db' }
      );
      product.hasAndBelongsToMany(category);
      category.hasAndBelongsToMany(product);
    });

    lt.beforeEach.givenModel('category');

    beforeEach(function createProductsInCategory(done) {
      var test = this;
      this.category.products.create({
        name: 'a-product'
      }, function(err, product) {
        if (err) return done(err);
        test.product = product;
        done();
      });
    });

    beforeEach(function createAnotherCategoryAndProduct(done) {
      app.models.category.create({ name: 'another-category' },
        function(err, cat) {
          if (err) return done(err);
          cat.products.create({ name: 'another-product' }, done);
        });
    });

    afterEach(function(done) {
      this.app.models.product.destroyAll(done);
    });

    it.skip('allows to find related objects via where filter', function(done) {
      //TODO https://github.com/strongloop/loopback-datasource-juggler/issues/94
      var expectedProduct = this.product;
      // Note: the URL format is not final
      this.get('/api/products?filter[where][categoryId]=' + this.category.id)
        .expect(200, function(err, res) {
          if (err) return done(err);
          expect(res.body).to.eql([
            {
              id: expectedProduct.id,
              name: expectedProduct.name
            }
          ]);
          done();
        });
    });

    it('allows to find related object via URL scope', function(done) {
      var expectedProduct = this.product;
      this.get('/api/categories/' + this.category.id + '/products')
        .expect(200, function(err, res) {
          if (err) return done(err);
          expect(res.body).to.eql([
            {
              id: expectedProduct.id,
              name: expectedProduct.name
            }
          ]);
          done();
        });
    });

    it('includes requested related models in `find`', function(done) {
      var expectedProduct = this.product;
      var url = '/api/categories/findOne?filter[where][id]=' +
        this.category.id + '&filter[include]=products';

      this.get(url)
        .expect(200, function(err, res) {
          expect(res.body).to.have.property('products');
          expect(res.body.products).to.eql([
            {
              id: expectedProduct.id,
              name: expectedProduct.name
            }
          ]);
          done();
        });
    });

    it.skip('includes requested related models in `findById`', function(done) {
      //TODO https://github.com/strongloop/loopback-datasource-juggler/issues/93
      var expectedProduct = this.product;
      // Note: the URL format is not final
      var url = '/api/categories/' + this.category.id + '?include=products';

      this.get(url)
        .expect(200, function(err, res) {
          expect(res.body).to.have.property('products');
          expect(res.body.products).to.eql([
            {
              id: expectedProduct.id,
              name: expectedProduct.name
            }
          ]);
          done();
        });
    });
  });
});
