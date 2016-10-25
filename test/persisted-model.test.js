// Copyright IBM Corp. 2013,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var expect = require('chai').expect;
var loopback = require('..');
var supertest = require('supertest');

describe('PersistedModel', function() {
  var app, request, accessToken, userId, Product, actualOptions;

  beforeEach(setupAppAndRequest);

  context('when making updates via REST', function() {
    beforeEach(observeOptionsBeforeSave);

    it('injects options to create()', function(done) {
      request.post('/products')
        .send({ name: 'Pen' })
        .expect(200, function(err) {
          if (err) return done(err);
          expect(actualOptions).to.have.property('remotingContext');
          done();
        });
    });

    it('injects options to patchOrCreate()', function(done) {
      request.patch('/products')
        .send({ id: 1, name: 'Pen' })
        .expect(200, function(err) {
          if (err) return done(err);
          expect(actualOptions).to.have.property('remotingContext');
          done();
        });
    });

    it('injects options to replaceOrCreate()', function(done) {
      request.put('/products')
        .send({ id: 1, name: 'Pen' })
        .expect(200, function(err) {
          if (err) return done(err);
          expect(actualOptions).to.have.property('remotingContext');
          done();
        });
    });

    it('injects options to patchOrCreateWithWhere()', function(done) {
      request.post('/products/upsertWithWhere?where[name]=Pen')
        .send({ name: 'Pencil' })
        .expect(200, function(err) {
          if (err) return done(err);
          expect(actualOptions).to.have.property('remotingContext');
          done();
        });
    });

    it('injects options to replaceById()', function(done) {
      Product.create({ id: 1, name: 'Pen' }, function(err, p) {
        if (err) return done(err);
        request.put('/products/1')
          .send({ name: 'Pencil' })
          .expect(200, function(err) {
            if (err) return done(err);
            expect(actualOptions).to.have.property('remotingContext');
            done();
          });
      });
    });

    it('injects options to prototype.patchAttributes()', function(done) {
      Product.create({ id: 1, name: 'Pen' }, function(err, p) {
        if (err) return done(err);
        request.patch('/products/1')
          .send({ name: 'Pencil' })
          .expect(200, function(err) {
            if (err) return done(err);
            expect(actualOptions).to.have.property('remotingContext');
            done();
          });
      });
    });

    it('injects options to updateAll()', function(done) {
      request.post('/products/update?where[name]=Pen')
        .send({ name: 'Pencil' })
        .expect(200, function(err) {
          if (err) return done(err);
          expect(actualOptions).to.have.property('remotingContext');
          done();
        });
    });
  });

  context('when deleting via REST', function() {
    beforeEach(observeOptionsBeforeDelete);

    it('injects options to deleteById()', function(done) {
      Product.create({ id: 1, name: 'Pen' }, function(err, p) {
        if (err) return done(err);
        request.delete('/products/1')
          .expect(200, function(err) {
            if (err) return done(err);
            expect(actualOptions).to.have.property('remotingContext');
            done();
          });
      });
    });
  });

  context('when querying via REST', function() {
    beforeEach(observeOptionsOnAccess);
    beforeEach(createProductId1);

    it('injects options to find()', function(done) {
      request.get('/products').expect(200, function(err) {
        if (err) return done(err);
        expect(actualOptions).to.have.property('remotingContext');
        done();
      });
    });

    it('injects options to findById()', function(done) {
      request.get('/products/1').expect(200, function(err) {
        if (err) return done(err);
        expect(actualOptions).to.have.property('remotingContext');
        done();
      });
    });

    it('injects options to findOne()', function(done) {
      request.get('/products/findOne?where[id]=1').expect(200, function(err) {
        if (err) return done(err);
        expect(actualOptions).to.have.property('remotingContext');
        done();
      });
    });

    it('injects options to exists()', function(done) {
      request.head('/products/1').expect(200, function(err) {
        if (err) return done(err);
        expect(actualOptions).to.have.property('remotingContext');
        done();
      });
    });

    it('injects options to count()', function(done) {
      request.get('/products/count').expect(200, function(err) {
        if (err) return done(err);
        expect(actualOptions).to.have.property('remotingContext');
        done();
      });
    });
  });

  context('when invoking prototype methods', function() {
    beforeEach(observeOptionsOnAccess);
    beforeEach(createProductId1);

    it('injects options to sharedCtor', function(done) {
      Product.prototype.dummy = function(cb) { cb(); };
      Product.remoteMethod('prototype.dummy', {});
      request.post('/products/1/dummy').expect(204, function(err) {
        if (err) return done(err);
        expect(actualOptions).to.have.property('remotingContext');
        done();
      });
    });
  });

  function setupAppAndRequest() {
    app = loopback({ localRegistry: true });
    app.dataSource('db', { connector: 'memory' });

    Product = app.registry.createModel(
      'Product',
      { name: String },
      { forceId: false, replaceOnPUT: true });

    app.model(Product, { dataSource: 'db' });

    app.use(loopback.rest());
    request = supertest(app);
  }

  function observeOptionsBeforeSave() {
    Product.observe('before save', function(ctx, next) {
      actualOptions = ctx.options;
      next();
    });
  }

  function observeOptionsBeforeDelete() {
    Product.observe('before delete', function(ctx, next) {
      actualOptions = ctx.options;
      next();
    });
  }

  function observeOptionsOnAccess() {
    Product.observe('access', function(ctx, next) {
      actualOptions = ctx.options;
      next();
    });
  }

  function createProductId1() {
    return Product.create({ id: 1, name: 'Pen' });
  }
  function observeOptionsOnAccess() {
    Product.observe('access', function(ctx, next) {
      actualOptions = ctx.options;
      next();
    });
  }

  function createProductId1() {
    return Product.create({ id: 1, name: 'Pen' });
  }
});
