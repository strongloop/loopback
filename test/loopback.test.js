// Copyright IBM Corp. 2013,2019. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
const it = require('./util/it');
const describe = require('./util/describe');
const Domain = require('domain');
const EventEmitter = require('events').EventEmitter;
const loopback = require('../');
const expect = require('./helpers/expect');
const assert = require('assert');

describe('loopback', function() {
  let nameCounter = 0;
  let uniqueModelName;

  beforeEach(function() {
    uniqueModelName = 'TestModel-' + (++nameCounter);
  });

  describe('exports', function() {
    it('ValidationError', function() {
      expect(loopback.ValidationError).to.be.a('function')
        .and.have.property('name', 'ValidationError');
    });

    it.onServer('includes `faviconFile`', function() {
      const file = loopback.faviconFile;
      expect(file, 'faviconFile').to.not.equal(undefined);
      expect(require('fs').existsSync(loopback.faviconFile), 'file exists')
        .to.equal(true);
    });

    it.onServer('has `getCurrentContext` method', function() {
      expect(loopback.getCurrentContext).to.be.a('function');
    });

    it.onServer('exports all expected properties', function() {
      const EXPECTED = [
        'ACL',
        'AccessToken',
        'Application',
        'Change',
        'Checkpoint',
        'Connector',
        'DataSource',
        'DateString',
        'Email',
        'GeoPoint',
        'KeyValueModel',
        'Mail',
        'Memory',
        'Model',
        'PersistedModel',
        'Remote',
        'Role',
        'RoleMapping',
        'Route',
        'Router',
        'Scope',
        'User',
        'ValidationError',
        'application',
        'configureModel',
        'context',
        'createContext',
        'createDataSource',
        'createModel',
        'defaultDataSources',
        'errorHandler',
        'favicon',
        'faviconFile',
        'findModel',
        'getCurrentContext',
        'getModel',
        'getModelByType',
        'isBrowser',
        'isServer',
        'length',
        'memory',
        'modelBuilder',
        'name',
        'prototype',
        'query',
        'registry',
        'remoteMethod',
        'request',
        'response',
        'rest',
        'runInContext',
        'static',
        'status',
        'template',
        'token',
        'urlNotFound',
        'version',
      ];

      const actual = Object.getOwnPropertyNames(loopback);
      actual.sort();
      expect(actual).to.include.members(EXPECTED);
    });
  });

  describe('loopback(options)', function() {
    it('supports localRegistry:true', function() {
      const app = loopback({localRegistry: true});
      expect(app.registry).to.not.equal(loopback.registry);
    });

    it('does not load builtin models into the local registry', function() {
      const app = loopback({localRegistry: true});
      expect(app.registry.findModel('User')).to.equal(undefined);
    });

    it('supports loadBuiltinModels:true', function() {
      const app = loopback({localRegistry: true, loadBuiltinModels: true});
      expect(app.registry.findModel('User'))
        .to.have.property('modelName', 'User');
    });
  });

  describe('loopback.createDataSource(options)', function() {
    it('Create a data source with a connector.', function() {
      const dataSource = loopback.createDataSource({
        connector: loopback.Memory,
      });
      assert(dataSource.connector);
    });
  });

  describe('data source created by loopback', function() {
    it('should create model extending Model by default', function() {
      const dataSource = loopback.createDataSource({
        connector: loopback.Memory,
      });
      const m1 = dataSource.createModel('m1', {});
      assert(m1.prototype instanceof loopback.Model);
    });
  });

  describe('model created by loopback', function() {
    it('should extend from Model by default', function() {
      const m1 = loopback.createModel('m1', {});
      assert(m1.prototype instanceof loopback.Model);
    });
  });

  describe('loopback.remoteMethod(Model, fn, [options]);', function() {
    it('Setup a remote method.', function() {
      const Product = loopback.createModel('product', {price: Number});

      Product.stats = function(fn) {
        // ...
      };

      loopback.remoteMethod(
        Product.stats,
        {
          returns: {arg: 'stats', type: 'array'},
          http: {path: '/info', verb: 'get'},
        },
      );

      assert.equal(Product.stats.returns.arg, 'stats');
      assert.equal(Product.stats.returns.type, 'array');
      assert.equal(Product.stats.http.path, '/info');
      assert.equal(Product.stats.http.verb, 'get');
      assert.equal(Product.stats.shared, true);
    });
  });

  describe('loopback.createModel(name, properties, options)', function() {
    describe('options.base', function() {
      it('should extend from options.base', function() {
        const MyModel = loopback.createModel('MyModel', {}, {
          foo: {
            bar: 'bat',
          },
        });
        const MyCustomModel = loopback.createModel('MyCustomModel', {}, {
          base: 'MyModel',
          foo: {
            bat: 'baz',
          },
        });
        assert(MyCustomModel.super_ === MyModel);
        assert.deepEqual(MyCustomModel.settings.foo, {bar: 'bat', bat: 'baz'});
        assert(MyCustomModel.super_.modelName === MyModel.modelName);
      });
    });

    describe('loopback.getModel and getModelByType', function() {
      it('should be able to get model by name', function() {
        const MyModel = loopback.createModel('MyModel', {}, {
          foo: {
            bar: 'bat',
          },
        });
        const MyCustomModel = loopback.createModel('MyCustomModel', {}, {
          base: 'MyModel',
          foo: {
            bat: 'baz',
          },
        });
        assert(loopback.getModel('MyModel') === MyModel);
        assert(loopback.getModel('MyCustomModel') === MyCustomModel);
        assert(loopback.findModel('Invalid') === undefined);
        assert(loopback.getModel(MyModel) === MyModel);
      });
      it('should be able to get model by type', function() {
        const MyModel = loopback.createModel('MyModel', {}, {
          foo: {
            bar: 'bat',
          },
        });
        const MyCustomModel = loopback.createModel('MyCustomModel', {}, {
          base: 'MyModel',
          foo: {
            bat: 'baz',
          },
        });
        assert(loopback.getModelByType(MyModel) === MyCustomModel);
        assert(loopback.getModelByType(MyCustomModel) === MyCustomModel);
      });

      it('should throw when the model does not exist', function() {
        expect(function() { loopback.getModel(uniqueModelName); })
          .to.throw(Error, new RegExp('Model not found: ' + uniqueModelName));
      });
    });

    it('configures remote methods', function() {
      const TestModel = loopback.createModel(uniqueModelName, {}, {
        methods: {
          staticMethod: {
            isStatic: true,
            http: {path: '/static'},
          },
          instanceMethod: {
            isStatic: false,
            http: {path: '/instance'},
          },
        },
      });

      const methodNames = TestModel.sharedClass.methods().map(function(m) {
        return m.stringName.replace(/^[^.]+\./, ''); // drop the class name
      });

      expect(methodNames).to.include.members([
        'staticMethod',
        'prototype.instanceMethod',
      ]);
    });
  });

  describe('loopback.createModel(config)', function() {
    it('creates the model', function() {
      const model = loopback.createModel({
        name: uniqueModelName,
      });

      expect(model.prototype).to.be.instanceof(loopback.Model);
    });

    it('interprets extra first-level keys as options', function() {
      const model = loopback.createModel({
        name: uniqueModelName,
        base: 'User',
      });

      expect(model.prototype).to.be.instanceof(loopback.User);
    });

    it('prefers config.options.key over config.key', function() {
      const model = loopback.createModel({
        name: uniqueModelName,
        base: 'User',
        options: {
          base: 'Application',
        },
      });

      expect(model.prototype).to.be.instanceof(loopback.Application);
    });
  });

  describe('loopback.configureModel(ModelCtor, config)', function() {
    it('adds new relations', function() {
      const model = loopback.Model.extend(uniqueModelName);

      loopback.configureModel(model, {
        dataSource: null,
        relations: {
          owner: {
            type: 'belongsTo',
            model: 'User',
          },
        },
      });

      expect(model.settings.relations).to.have.property('owner');
    });

    it('updates existing relations', function() {
      const model = loopback.Model.extend(uniqueModelName, {}, {
        relations: {
          owner: {
            type: 'belongsTo',
            model: 'User',
          },
        },
      });

      loopback.configureModel(model, {
        dataSource: false,
        relations: {
          owner: {
            model: 'Application',
          },
        },
      });

      expect(model.settings.relations.owner).to.eql({
        type: 'belongsTo',
        model: 'Application',
      });
    });

    it('updates relations before attaching to a dataSource', function() {
      const db = loopback.createDataSource({connector: loopback.Memory});
      const model = loopback.Model.extend(uniqueModelName);

      // This test used to work because User model was already attached
      // by other tests via `loopback.autoAttach()`
      // Now that autoAttach is gone, it turns out the tested functionality
      // does not work exactly as intended. To keep this change narrowly
      // focused on removing autoAttach, we are attaching the User model
      // to simulate the old test setup.
      loopback.User.attachTo(db);

      loopback.configureModel(model, {
        dataSource: db,
        relations: {
          owner: {
            type: 'belongsTo',
            model: 'User',
          },
        },
      });

      const owner = model.prototype.owner;
      expect(owner, 'model.prototype.owner').to.be.a('function');
      expect(owner._targetClass).to.equal('User');
    });

    it('adds new acls', function() {
      const model = loopback.Model.extend(uniqueModelName, {}, {
        acls: [
          {
            property: 'find',
            accessType: 'EXECUTE',
            principalType: 'ROLE',
            principalId: '$everyone',
            permission: 'DENY',
          },
        ],
      });

      loopback.configureModel(model, {
        dataSource: null,
        acls: [
          {
            property: 'find',
            accessType: 'EXECUTE',
            principalType: 'ROLE',
            principalId: 'admin',
            permission: 'ALLOW',
          },
        ],
      });

      expect(model.settings.acls).eql([
        {
          property: 'find',
          accessType: 'EXECUTE',
          principalType: 'ROLE',
          principalId: '$everyone',
          permission: 'DENY',
        },
        {
          property: 'find',
          accessType: 'EXECUTE',
          principalType: 'ROLE',
          principalId: 'admin',
          permission: 'ALLOW',
        },
      ]);
    });

    it('updates existing acls', function() {
      const model = loopback.Model.extend(uniqueModelName, {}, {
        acls: [
          {
            property: 'find',
            accessType: 'EXECUTE',
            principalType: 'ROLE',
            principalId: '$everyone',
            permission: 'DENY',
          },
        ],
      });

      loopback.configureModel(model, {
        dataSource: null,
        acls: [
          {
            property: 'find',
            accessType: 'EXECUTE',
            principalType: 'ROLE',
            principalId: '$everyone',
            permission: 'ALLOW',
          },
        ],
      });

      expect(model.settings.acls).eql([
        {
          property: 'find',
          accessType: 'EXECUTE',
          principalType: 'ROLE',
          principalId: '$everyone',
          permission: 'ALLOW',
        },
      ]);
    });

    it('updates existing settings', function() {
      const model = loopback.Model.extend(uniqueModelName, {}, {
        ttl: 10,
        emailVerificationRequired: false,
      });

      const baseName = model.settings.base.name;

      loopback.configureModel(model, {
        dataSource: null,
        options: {
          ttl: 20,
          realmRequired: true,
          base: 'X',
        },
      });

      expect(model.settings).to.have.property('ttl', 20);
      expect(model.settings).to.have.property('emailVerificationRequired',
        false);
      expect(model.settings).to.have.property('realmRequired', true);

      // configureModel MUST NOT change Model's base class
      expect(model.settings.base.name).to.equal(baseName);
    });

    it('configures remote methods', function() {
      const TestModel = loopback.createModel(uniqueModelName);
      loopback.configureModel(TestModel, {
        dataSource: null,
        methods: {
          staticMethod: {
            isStatic: true,
            http: {path: '/static'},
          },
          instanceMethod: {
            isStatic: false,
            http: {path: '/instance'},
          },
        },
      });

      const methodNames = TestModel.sharedClass.methods().map(function(m) {
        return m.stringName.replace(/^[^.]+\./, ''); // drop the class name
      });

      expect(methodNames).to.include.members([
        'staticMethod',
        'prototype.instanceMethod',
      ]);
    });
  });

  describe('loopback object', function() {
    it('inherits properties from express', function() {
      const express = require('express');
      for (const i in express) {
        expect(loopback).to.have.property(i, express[i]);
      }
    });

    it('exports all built-in models', function() {
      const expectedModelNames = [
        'Email',
        'User',
        'Application',
        'AccessToken',
        'Role',
        'RoleMapping',
        'ACL',
        'Scope',
        'Change',
        'Checkpoint',
      ];

      expect(Object.keys(loopback)).to.include.members(expectedModelNames);

      expectedModelNames.forEach(function(name) {
        expect(loopback[name], name).to.be.a('function');
        expect(loopback[name].modelName, name + '.modelName').to.eql(name);
      });
    });
  });

  describe('new remote method configuration', function() {
    function getAllMethodNamesWithoutClassName(TestModel) {
      return TestModel.sharedClass.methods().map(function(m) {
        return m.stringName.replace(/^[^.]+\./, ''); // drop the class name
      });
    }

    it('treats method names that don\'t start with "prototype." as "isStatic:true"', function() {
      const TestModel = loopback.createModel(uniqueModelName);
      loopback.configureModel(TestModel, {
        dataSource: null,
        methods: {
          staticMethod: {
            http: {path: '/static'},
          },
        },
      });

      const methodNames = getAllMethodNamesWithoutClassName(TestModel);

      expect(methodNames).to.include('staticMethod');
    });

    it('treats method names starting with "prototype." as "isStatic:false"', function() {
      const TestModel = loopback.createModel(uniqueModelName);
      loopback.configureModel(TestModel, {
        dataSource: null,
        methods: {
          'prototype.instanceMethod': {
            http: {path: '/instance'},
          },
        },
      });

      const methodNames = getAllMethodNamesWithoutClassName(TestModel);

      expect(methodNames).to.include('prototype.instanceMethod');
    });

    // Skip this test in browsers because strong-globalize is not removing
    // `{{` and `}}` control characters from the string.
    it.onServer('throws when "isStatic:true" and method name starts with "prototype."', function() {
      const TestModel = loopback.createModel(uniqueModelName);
      expect(function() {
        loopback.configureModel(TestModel, {
          dataSource: null,
          methods: {
            'prototype.instanceMethod': {
              isStatic: true,
              http: {path: '/instance'},
            },
          },
        });
      }).to.throw(Error, 'Remoting metadata for ' + TestModel.modelName +
      '.prototype.instanceMethod "isStatic" does not match new method name-based style.');
    });

    it('use "isStatic:true" if method name does not start with "prototype."', function() {
      const TestModel = loopback.createModel(uniqueModelName);
      loopback.configureModel(TestModel, {
        dataSource: null,
        methods: {
          staticMethod: {
            isStatic: true,
            http: {path: '/static'},
          },
        },
      });

      const methodNames = getAllMethodNamesWithoutClassName(TestModel);

      expect(methodNames).to.include('staticMethod');
    });

    it('use "isStatic:false" if method name starts with "prototype."', function() {
      const TestModel = loopback.createModel(uniqueModelName);
      loopback.configureModel(TestModel, {
        dataSource: null,
        methods: {
          'prototype.instanceMethod': {
            isStatic: false,
            http: {path: '/instance'},
          },
        },
      });

      const methodNames = getAllMethodNamesWithoutClassName(TestModel);

      expect(methodNames).to.include('prototype.instanceMethod');
    });
  });

  describe('Remote method inheritance', function() {
    let app;

    beforeEach(setupLoopback);

    it('inherits remote methods defined via createModel', function() {
      const Base = app.registry.createModel('Base', {}, {
        methods: {
          greet: {
            http: {path: '/greet'},
          },
        },
      });

      const MyCustomModel = app.registry.createModel('MyCustomModel', {}, {
        base: 'Base',
        methods: {
          hello: {
            http: {path: '/hello'},
          },
        },
      });
      const methodNames = getAllMethodNamesWithoutClassName(MyCustomModel);

      expect(methodNames).to.include('greet');
      expect(methodNames).to.include('hello');
    });

    it('same remote method with different metadata should override parent', function() {
      const Base = app.registry.createModel('Base', {}, {
        methods: {
          greet: {
            http: {path: '/greet'},
          },
        },
      });

      const MyCustomModel = app.registry.createModel('MyCustomModel', {}, {
        base: 'Base',
        methods: {
          greet: {
            http: {path: '/hello'},
          },
        },
      });
      const methodNames = getAllMethodNamesWithoutClassName(MyCustomModel);
      const baseMethod = Base.sharedClass.findMethodByName('greet');
      const customMethod = MyCustomModel.sharedClass.findMethodByName('greet');

      // Base Method
      expect(baseMethod.http).to.eql({path: '/greet'});
      expect(baseMethod.http.path).to.equal('/greet');
      expect(baseMethod.http.path).to.not.equal('/hello');

      // Custom Method
      expect(methodNames).to.include('greet');
      expect(customMethod.http).to.eql({path: '/hello'});
      expect(customMethod.http.path).to.equal('/hello');
      expect(customMethod.http.path).to.not.equal('/greet');
    });

    it('does not inherit remote methods defined via configureModel', function() {
      const Base = app.registry.createModel('Base');
      app.registry.configureModel(Base, {
        dataSource: null,
        methods: {
          greet: {
            http: {path: '/greet'},
          },
        },
      });

      const MyCustomModel = app.registry.createModel('MyCustomModel', {}, {
        base: 'Base',
        methods: {
          hello: {
            http: {path: '/hello'},
          },
        },
      });
      const methodNames = getAllMethodNamesWithoutClassName(MyCustomModel);

      expect(methodNames).to.not.include('greet');
      expect(methodNames).to.include('hello');
    });

    it('does not inherit remote methods defined via configureModel after child model ' +
        'was created', function() {
      const Base = app.registry.createModel('Base');
      const MyCustomModel = app.registry.createModel('MyCustomModel', {}, {
        base: 'Base',
      });

      app.registry.configureModel(Base, {
        dataSource: null,
        methods: {
          greet: {
            http: {path: '/greet'},
          },
        },
      });

      app.registry.configureModel(MyCustomModel, {
        dataSource: null,
        methods: {
          hello: {
            http: {path: '/hello'},
          },
        },
      });
      const baseMethodNames = getAllMethodNamesWithoutClassName(Base);
      const methodNames = getAllMethodNamesWithoutClassName(MyCustomModel);

      expect(baseMethodNames).to.include('greet');
      expect(methodNames).to.not.include('greet');
      expect(methodNames).to.include('hello');
    });

    function setupLoopback() {
      app = loopback({localRegistry: true});
    }

    function getAllMethodNamesWithoutClassName(Model) {
      return Model.sharedClass.methods().map(function(m) {
        return m.stringName.replace(/^[^.]+\./, ''); // drop the class name
      });
    }
  });

  describe('Hiding shared methods', function() {
    let app;

    beforeEach(setupLoopback);

    it('hides remote methods using fixed method names', function() {
      const TestModel = app.registry.createModel(uniqueModelName);
      app.model(TestModel, {
        dataSource: null,
        methods: {
          staticMethod: {
            isStatic: true,
            http: {path: '/static'},
          },
        },
        options: {
          remoting: {
            sharedMethods: {
              staticMethod: false,
            },
          },
        },
      });

      const publicMethods = getSharedMethods(TestModel);

      expect(publicMethods).not.to.include.members([
        'staticMethod',
      ]);
    });

    it('hides remote methods using a glob pattern', function() {
      const TestModel = app.registry.createModel(uniqueModelName);
      app.model(TestModel, {
        dataSource: null,
        methods: {
          staticMethod: {
            isStatic: true,
            http: {path: '/static'},
          },
          instanceMethod: {
            isStatic: false,
            http: {path: '/instance'},
          },
        },
        options: {
          remoting: {
            sharedMethods: {
              'prototype.*': false,
            },
          },
        },
      });

      const publicMethods = getSharedMethods(TestModel);

      expect(publicMethods).to.include.members([
        'staticMethod',
      ]);
      expect(publicMethods).not.to.include.members([
        'instanceMethod',
      ]);
    });

    it('hides all remote methods using *', function() {
      const TestModel = app.registry.createModel(uniqueModelName);
      app.model(TestModel, {
        dataSource: null,
        methods: {
          staticMethod: {
            isStatic: true,
            http: {path: '/static'},
          },
          instanceMethod: {
            isStatic: false,
            http: {path: '/instance'},
          },
        },
        options: {
          remoting: {
            sharedMethods: {
              '*': false,
            },
          },
        },
      });

      const publicMethods = getSharedMethods(TestModel);

      expect(publicMethods).to.be.empty();
    });

    it('hides methods for related models using globs (model configured first)', function() {
      const TestModel = app.registry.createModel('TestModel');
      const RelatedModel = app.registry.createModel('RelatedModel');
      app.dataSource('test', {connector: 'memory'});
      app.model(TestModel, {
        dataSource: 'test',
        relations: {
          related: {
            type: 'hasOne',
            model: RelatedModel,
          },
        },
        options: {
          remoting: {
            sharedMethods: {
              '*__related': false,
            },
          },
        },
      });
      app.model(RelatedModel, {dataSource: 'test'});

      const publicMethods = getSharedMethods(TestModel);

      expect(publicMethods).to.not.include.members([
        'prototype.__create__related',
      ]);
    });

    it('hides methods for related models using globs (related model configured first)', function() {
      const TestModel = app.registry.createModel('TestModel');
      const RelatedModel = app.registry.createModel('RelatedModel');
      app.dataSource('test', {connector: 'memory'});
      app.model(RelatedModel, {dataSource: 'test'});
      app.model(TestModel, {
        dataSource: 'test',
        relations: {
          related: {
            type: 'hasOne',
            model: RelatedModel,
          },
        },
        options: {
          remoting: {
            sharedMethods: {
              '*__related': false,
            },
          },
        },
      });

      const publicMethods = getSharedMethods(TestModel);

      expect(publicMethods).to.not.include.members([
        'prototype.__create__related',
      ]);
    });

    function setupLoopback() {
      app = loopback({localRegistry: true});
    }

    function getSharedMethods(Model) {
      return Model.sharedClass
        .methods()
        .filter(function(m) {
          return m.shared === true;
        })
        .map(function(m) {
          return m.stringName.replace(/^[^.]+\./, ''); // drop the class name
        });
    }
  });
});
