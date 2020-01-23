// Copyright IBM Corp. 2016,2019. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

const expect = require('chai').expect;
const loopback = require('..');
const supertest = require('supertest');

describe('OptionsFromRemotingContext', function() {
  let app, request, accessToken, userId, Product, actualOptions;

  beforeEach(setupAppAndRequest);
  beforeEach(resetActualOptions);

  context('when making updates via REST', function() {
    beforeEach(observeOptionsBeforeSave);

    it('injects options to create()', function() {
      return request.post('/products')
        .send({name: 'Pen'})
        .expect(200)
        .then(expectInjectedOptions);
    });

    it('injects options to patchOrCreate()', function() {
      return request.patch('/products')
        .send({id: 1, name: 'Pen'})
        .expect(200)
        .then(expectInjectedOptions);
    });

    it('injects options to replaceOrCreate()', function() {
      return request.put('/products')
        .send({id: 1, name: 'Pen'})
        .expect(200)
        .then(expectInjectedOptions);
    });

    it('injects options to patchOrCreateWithWhere()', function() {
      return request.post('/products/upsertWithWhere?where[name]=Pen')
        .send({name: 'Pencil'})
        .expect(200)
        .then(expectInjectedOptions);
    });

    it('injects options to replaceById()', function() {
      return Product.create({id: 1, name: 'Pen'})
        .then(function(p) {
          return request.put('/products/1')
            .send({name: 'Pencil'})
            .expect(200);
        })
        .then(expectInjectedOptions);
    });

    it('injects options to prototype.patchAttributes()', function() {
      return Product.create({id: 1, name: 'Pen'})
        .then(function(p) {
          return request.patch('/products/1')
            .send({name: 'Pencil'})
            .expect(200);
        })
        .then(expectInjectedOptions);
    });

    it('injects options to updateAll()', function() {
      return request.post('/products/update?where[name]=Pen')
        .send({name: 'Pencil'})
        .expect(200)
        .then(expectInjectedOptions);
    });
  });

  context('when deleting via REST', function() {
    beforeEach(observeOptionsBeforeDelete);

    it('injects options to deleteById()', function() {
      return Product.create({id: 1, name: 'Pen'})
        .then(function(p) {
          return request.delete('/products/1').expect(200);
        })
        .then(expectInjectedOptions);
    });
  });

  context('when querying via REST', function() {
    beforeEach(observeOptionsOnAccess);
    beforeEach(givenProductId1);

    it('injects options to find()', function() {
      return request.get('/products').expect(200)
        .then(expectInjectedOptions);
    });

    it('injects options to findById()', function() {
      return request.get('/products/1').expect(200)
        .then(expectInjectedOptions);
    });

    it('injects options to findOne()', function() {
      return request.get('/products/findOne?where[id]=1').expect(200)
        .then(expectInjectedOptions);
    });

    it('injects options to exists()', function() {
      return request.head('/products/1').expect(200)
        .then(expectInjectedOptions);
    });

    it('injects options to count()', function() {
      return request.get('/products/count').expect(200)
        .then(expectInjectedOptions);
    });
  });

  context('when invoking prototype methods', function() {
    beforeEach(observeOptionsOnAccess);
    beforeEach(givenProductId1);

    it('injects options to sharedCtor', function() {
      Product.prototype.dummy = function(cb) { cb(); };
      Product.remoteMethod('prototype.dummy', {});
      return request.post('/products/1/dummy').expect(204)
        .then(expectInjectedOptions);
    });
  });

  // Catch: because relations methods are defined on "modelFrom",
  // they will invoke createOptionsFromRemotingContext on "modelFrom" too,
  // despite the fact that under the hood a method on "modelTo" is called.

  context('hasManyThrough', function() {
    let Category, ThroughModel;

    beforeEach(givenCategoryHasManyProductsThroughAnotherModel);
    beforeEach(givenCategoryAndProduct);

    it('injects options to findById', function() {
      observeOptionsOnAccess(Product);
      return request.get('/categories/1/products/1').expect(200)
        .then(expectOptionsInjectedFromCategory);
    });

    it('injects options to destroyById', function() {
      observeOptionsBeforeDelete(Product);
      return request.del('/categories/1/products/1').expect(204)
        .then(expectOptionsInjectedFromCategory);
    });

    it('injects options to updateById', function() {
      observeOptionsBeforeSave(Product);
      return request.put('/categories/1/products/1')
        .send({description: 'a description'})
        .expect(200)
        .then(expectInjectedOptions);
    });

    context('through-model operations', function() {
      it('injects options to link', function() {
        observeOptionsBeforeSave(ThroughModel);
        return Product.create({id: 2, name: 'Car2'})
          .then(function() {
            return request.put('/categories/1/products/rel/2')
              .send({description: 'a description'})
              .expect(200);
          })
          .then(expectOptionsInjectedFromCategory);
      });

      it('injects options to unlink', function() {
        observeOptionsBeforeDelete(ThroughModel);
        return request.del('/categories/1/products/rel/1').expect(204)
          .then(expectOptionsInjectedFromCategory);
      });

      it('injects options to exists', function() {
        observeOptionsOnAccess(ThroughModel);
        return request.head('/categories/1/products/rel/1').expect(200)
          .then(expectOptionsInjectedFromCategory);
      });
    });

    context('scope operations', function() {
      it('injects options to get', function() {
        observeOptionsOnAccess(Product);
        return request.get('/categories/1/products').expect(200)
          .then(expectOptionsInjectedFromCategory);
      });

      it('injects options to create', function() {
        observeOptionsBeforeSave(Product);
        return request.post('/categories/1/products')
          .send({name: 'Pen'})
          .expect(200)
          .then(expectOptionsInjectedFromCategory);
      });

      it('injects options to delete', function() {
        observeOptionsBeforeDelete(ThroughModel);
        return request.del('/categories/1/products').expect(204)
          .then(expectOptionsInjectedFromCategory);
      });

      it('injects options to count', function() {
        observeOptionsOnAccess(ThroughModel);
        return request.get('/categories/1/products/count').expect(200)
          .then(expectOptionsInjectedFromCategory);
      });
    });

    function givenCategoryHasManyProductsThroughAnotherModel() {
      Category = app.registry.createModel(
        'Category',
        {name: String},
        {forceId: false, replaceOnPUT: true},
      );

      app.model(Category, {dataSource: 'db'});
      // This is a shortcut for creating CategoryProduct "through" model
      Category.hasAndBelongsToMany(Product);

      Category.createOptionsFromRemotingContext = function(ctx) {
        return {injectedFrom: 'Category'};
      };

      ThroughModel = app.registry.getModel('CategoryProduct');
    }

    function givenCategoryAndProduct() {
      return Category.create({id: 1, name: 'First Category'})
        .then(function(cat) {
          return cat.products.create({id: 1, name: 'Pen'});
        });
    }

    function expectOptionsInjectedFromCategory() {
      expect(actualOptions).to.have.property('injectedFrom', 'Category');
    }
  });

  context('hasOne', function() {
    let Category;

    beforeEach(givenCategoryHasOneProduct);
    beforeEach(givenCategoryId1);

    it('injects options to get', function() {
      observeOptionsOnAccess(Product);
      return givenProductInCategory1()
        .then(function() {
          return request.get('/categories/1/product').expect(200);
        })
        .then(expectOptionsInjectedFromCategory);
    });

    it('injects options to create', function() {
      observeOptionsBeforeSave(Product);
      return request.post('/categories/1/product')
        .send({name: 'Pen'})
        .expect(200)
        .then(expectOptionsInjectedFromCategory);
    });

    it('injects options to update', function() {
      return givenProductInCategory1()
        .then(function() {
          observeOptionsBeforeSave(Product);
          return request.put('/categories/1/product')
            .send({description: 'a description'})
            .expect(200);
        })
        .then(expectInjectedOptions);
    });

    it('injects options to destroy', function() {
      observeOptionsBeforeDelete(Product);
      return givenProductInCategory1()
        .then(function() {
          return request.del('/categories/1/product').expect(204);
        })
        .then(expectOptionsInjectedFromCategory);
    });

    function givenCategoryHasOneProduct() {
      Category = app.registry.createModel(
        'Category',
        {name: String},
        {forceId: false, replaceOnPUT: true},
      );

      app.model(Category, {dataSource: 'db'});
      Category.hasOne(Product);

      Category.createOptionsFromRemotingContext = function(ctx) {
        return {injectedFrom: 'Category'};
      };
    }

    function givenCategoryId1() {
      return Category.create({id: 1, name: 'First Category'});
    }

    function givenProductInCategory1() {
      return Product.create({id: 1, name: 'Pen', categoryId: 1});
    }

    function expectOptionsInjectedFromCategory() {
      expect(actualOptions).to.have.property('injectedFrom', 'Category');
    }
  });

  context('belongsTo', function() {
    let Category;

    beforeEach(givenCategoryBelongsToProduct);

    it('injects options to get', function() {
      observeOptionsOnAccess(Product);
      return Product.create({id: 1, name: 'Pen'})
        .then(function() {
          return Category.create({id: 1, name: 'a name', productId: 1});
        })
        .then(function() {
          return request.get('/categories/1/product').expect(200);
        })
        .then(expectOptionsInjectedFromCategory);
    });

    function givenCategoryBelongsToProduct() {
      Category = app.registry.createModel(
        'Category',
        {name: String},
        {forceId: false, replaceOnPUT: true},
      );

      app.model(Category, {dataSource: 'db'});
      Category.belongsTo(Product);

      Category.createOptionsFromRemotingContext = function(ctx) {
        return {injectedFrom: 'Category'};
      };
    }

    function givenCategoryId1() {
      return Category.create({id: 1, name: 'First Category'});
    }

    function givenProductInCategory1() {
      return Product.create({id: 1, name: 'Pen', categoryId: 1});
    }

    function expectOptionsInjectedFromCategory() {
      expect(actualOptions).to.have.property('injectedFrom', 'Category');
    }
  });

  function setupAppAndRequest() {
    app = loopback({localRegistry: true});
    app.dataSource('db', {connector: 'memory'});

    Product = app.registry.createModel(
      'Product',
      {name: String},
      {forceId: false, replaceOnPUT: true},
    );

    Product.createOptionsFromRemotingContext = function(ctx) {
      return {injectedFrom: 'Product'};
    };

    app.model(Product, {dataSource: 'db'});

    app.use(loopback.rest());
    request = supertest(app);
  }

  function resetActualOptions() {
    actualOptions = undefined;
  }

  function observeOptionsBeforeSave() {
    const Model = arguments[0] || Product;
    Model.observe('before save', function(ctx, next) {
      actualOptions = ctx.options;
      next();
    });
  }

  function observeOptionsBeforeDelete() {
    const Model = arguments[0] || Product;
    Model.observe('before delete', function(ctx, next) {
      actualOptions = ctx.options;
      next();
    });
  }

  function observeOptionsOnAccess() {
    const Model = arguments[0] || Product;
    Model.observe('access', function(ctx, next) {
      actualOptions = ctx.options;
      next();
    });
  }

  function givenProductId1() {
    return Product.create({id: 1, name: 'Pen'});
  }

  function expectInjectedOptions(name) {
    expect(actualOptions).to.have.property('injectedFrom');
  }
});
