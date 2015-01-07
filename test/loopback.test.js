var it = require('./util/it');
var describe = require('./util/describe');
var Domain = require('domain');
var EventEmitter = require('events').EventEmitter;

describe('loopback', function() {
  var nameCounter = 0;
  var uniqueModelName;

  beforeEach(function() {
    uniqueModelName = 'TestModel-' + (++nameCounter);
  });

  describe('exports', function() {
    it('ValidationError', function() {
      expect(loopback.ValidationError).to.be.a('function')
        .and.have.property('name', 'ValidationError');
    });

    it.onServer('includes `faviconFile`', function() {
      var file = loopback.faviconFile;
      expect(file, 'faviconFile').to.not.equal(undefined);
      expect(require('fs').existsSync(loopback.faviconFile), 'file exists')
        .to.equal(true);
    });

    it.onServer('has `getCurrentContext` method', function() {
      expect(loopback.getCurrentContext).to.be.a('function');
    });
  });

  describe('loopback.createDataSource(options)', function() {
    it('Create a data source with a connector.', function() {
      var dataSource = loopback.createDataSource({
        connector: loopback.Memory
      });
      assert(dataSource.connector);
    });
  });

  describe('data source created by loopback', function() {
    it('should create model extending Model by default', function() {
      var dataSource = loopback.createDataSource({
        connector: loopback.Memory
      });
      var m1 = dataSource.createModel('m1', {});
      assert(m1.prototype instanceof loopback.Model);
    });
  });

  describe('model created by loopback', function() {
    it('should extend from Model by default', function() {
      var m1 = loopback.createModel('m1', {});
      assert(m1.prototype instanceof loopback.Model);
    });
  });

  describe('loopback.autoAttach', function() {
    it('doesn\'t overwrite model with datasource configured', function() {
      var ds1 = loopback.createDataSource('db1', {
        connector: loopback.Memory
      });

      // setup default data sources
      loopback.setDefaultDataSourceForType('db', ds1);

      var ds2 = loopback.createDataSource('db2', {
        connector: loopback.Memory
      });

      var model1 = ds2.createModel('m1', {});

      var model2 = loopback.createModel('m2');
      model2.autoAttach = 'db';

      // auto attach data sources to models
      loopback.autoAttach();

      assert(model1.dataSource === ds2);
      assert(model2.dataSource === ds1);
    });
  });

  describe('loopback.remoteMethod(Model, fn, [options]);', function() {
    it('Setup a remote method.', function() {
      var Product = loopback.createModel('product', {price: Number});

      Product.stats = function(fn) {
        // ...
      };

      loopback.remoteMethod(
        Product.stats,
        {
          returns: {arg: 'stats', type: 'array'},
          http: {path: '/info', verb: 'get'}
        }
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
        var MyModel = loopback.createModel('MyModel', {}, {
          foo: {
            bar: 'bat'
          }
        });
        var MyCustomModel = loopback.createModel('MyCustomModel', {}, {
          base: 'MyModel',
          foo: {
            bat: 'baz'
          }
        });
        assert(MyCustomModel.super_ === MyModel);
        assert.deepEqual(MyCustomModel.settings.foo, { bar: 'bat', bat: 'baz' });
        assert(MyCustomModel.super_.modelName === MyModel.modelName);
      });
    });

    describe('loopback.getModel and getModelByType', function() {
      it('should be able to get model by name', function() {
        var MyModel = loopback.createModel('MyModel', {}, {
          foo: {
            bar: 'bat'
          }
        });
        var MyCustomModel = loopback.createModel('MyCustomModel', {}, {
          base: 'MyModel',
          foo: {
            bat: 'baz'
          }
        });
        assert(loopback.getModel('MyModel') === MyModel);
        assert(loopback.getModel('MyCustomModel') === MyCustomModel);
        assert(loopback.findModel('Invalid') === undefined);
      });
      it('should be able to get model by type', function() {
        var MyModel = loopback.createModel('MyModel', {}, {
          foo: {
            bar: 'bat'
          }
        });
        var MyCustomModel = loopback.createModel('MyCustomModel', {}, {
          base: 'MyModel',
          foo: {
            bat: 'baz'
          }
        });
        assert(loopback.getModelByType(MyModel) === MyCustomModel);
        assert(loopback.getModelByType(MyCustomModel) === MyCustomModel);
      });

      it('should throw when the model does not exist', function() {
        expect(function() { loopback.getModel(uniqueModelName); })
          .to.throw(Error, new RegExp('Model not found: ' + uniqueModelName));
      });
    });
  });

  describe('loopback.createModel(config)', function() {
    it('creates the model', function() {
      var model = loopback.createModel({
        name: uniqueModelName
      });

      expect(model.prototype).to.be.instanceof(loopback.Model);
    });

    it('interprets extra first-level keys as options', function() {
      var model = loopback.createModel({
        name: uniqueModelName,
        base: 'User'
      });

      expect(model.prototype).to.be.instanceof(loopback.User);
    });

    it('prefers config.options.key over config.key', function() {
      var model = loopback.createModel({
        name: uniqueModelName,
        base: 'User',
        options: {
          base: 'Application'
        }
      });

      expect(model.prototype).to.be.instanceof(loopback.Application);
    });
  });

  describe('loopback.configureModel(ModelCtor, config)', function() {
    it('adds new relations', function() {
      var model = loopback.Model.extend(uniqueModelName);

      loopback.configureModel(model, {
        dataSource: null,
        relations: {
          owner: {
            type: 'belongsTo',
            model: 'User'
          }
        }
      });

      expect(model.settings.relations).to.have.property('owner');
    });

    it('updates existing relations', function() {
      var model = loopback.Model.extend(uniqueModelName, {}, {
        relations: {
          owner: {
            type: 'belongsTo',
            model: 'User'
          }
        }
      });

      loopback.configureModel(model, {
        dataSource: null,
        relations: {
          owner: {
            model: 'Application'
          }
        }
      });

      expect(model.settings.relations.owner).to.eql({
        type: 'belongsTo',
        model: 'Application'
      });
    });

    it('updates relations before attaching to a dataSource', function() {
      var db = loopback.createDataSource({ connector: loopback.Memory });
      var model = loopback.Model.extend(uniqueModelName);

      loopback.configureModel(model, {
        dataSource: db,
        relations: {
          owner: {
            type: 'belongsTo',
            model: 'User'
          }
        }
      });

      var owner = model.prototype.owner;
      expect(owner, 'model.prototype.owner').to.be.a('function');
      expect(owner._targetClass).to.equal('User');
    });

    it('adds new acls', function() {
      var model = loopback.Model.extend(uniqueModelName, {}, {
        acls: [
          {
            property: 'find',
            accessType: 'EXECUTE',
            principalType: 'ROLE',
            principalId: '$everyone',
            permission: 'DENY'
          }
        ]
      });

      loopback.configureModel(model, {
        dataSource: null,
        acls: [
          {
            property: 'find',
            accessType: 'EXECUTE',
            principalType: 'ROLE',
            principalId: 'admin',
            permission: 'ALLOW'
          }
        ]
      });

      expect(model.settings.acls).eql([
        {
          property: 'find',
          accessType: 'EXECUTE',
          principalType: 'ROLE',
          principalId: '$everyone',
          permission: 'DENY'
        },
        {
          property: 'find',
          accessType: 'EXECUTE',
          principalType: 'ROLE',
          principalId: 'admin',
          permission: 'ALLOW'
        }
      ]);
    });

    it('updates existing acls', function() {
      var model = loopback.Model.extend(uniqueModelName, {}, {
        acls: [
          {
            property: 'find',
            accessType: 'EXECUTE',
            principalType: 'ROLE',
            principalId: '$everyone',
            permission: 'DENY'
          }
        ]
      });

      loopback.configureModel(model, {
        dataSource: null,
        acls: [
          {
            property: 'find',
            accessType: 'EXECUTE',
            principalType: 'ROLE',
            principalId: '$everyone',
            permission: 'ALLOW'
          }
        ]
      });

      expect(model.settings.acls).eql([
        {
          property: 'find',
          accessType: 'EXECUTE',
          principalType: 'ROLE',
          principalId: '$everyone',
          permission: 'ALLOW'
        }
      ]);
    });

    it('updates existing settings', function() {
      var model = loopback.Model.extend(uniqueModelName, {}, {
        ttl: 10,
        emailVerificationRequired: false
      });

      loopback.configureModel(model, {
        dataSource: null,
        options: {
          ttl: 20,
          realmRequired: true,
          base: 'X'
        }
      });

      expect(model.settings).to.have.property('ttl', 20);
      expect(model.settings).to.have.property('emailVerificationRequired',
        false);
      expect(model.settings).to.have.property('realmRequired', true);
      expect(model.settings).to.not.have.property('base');
    });
  });

  describe('loopback object', function() {
    it('inherits properties from express', function() {
      var express = require('express');
      for (var i in express) {
        expect(loopback).to.have.property(i, express[i]);
      }
    });

    it('exports all built-in models', function() {
      var expectedModelNames = [
        'Email',
        'User',
        'Application',
        'AccessToken',
        'Role',
        'RoleMapping',
        'ACL',
        'Scope',
        'Change',
        'Checkpoint'
      ];

      expect(Object.keys(loopback)).to.include.members(expectedModelNames);

      expectedModelNames.forEach(function(name) {
        expect(loopback[name], name).to.be.a('function');
        expect(loopback[name].modelName, name + '.modelName').to.eql(name);
      });
    });
  });

  describe.onServer('loopback.getCurrentContext', function() {
    var app = loopback();
    var runInOtherDomain;
    var runnerInterval;

    before(function() {

      app.use(loopback.rest());
      app.dataSource('db', { connector: 'memory' });

      var TestModel = loopback.createModel({ name: 'TestModel' });
      app.model(TestModel, {dataSource: 'db', public: true});

      var emitterInOtherDomain = new EventEmitter();
      Domain.create().add(emitterInOtherDomain);

      runInOtherDomain = function(fn) {
        emitterInOtherDomain.once('run', fn);
      };

      runnerInterval = setInterval(
          function() {
            emitterInOtherDomain.emit('run');
          }, 10);

      // function for remote method
      TestModel.test = function(inst, cb) {
        var tmpCtx = loopback.getCurrentContext();
        if (tmpCtx) tmpCtx.set('data', 'test');
        if (process.domain) cb = process.domain.bind(cb);  // IMPORTANT
        runInOtherDomain(cb);
      };

      // remote method
      TestModel.remoteMethod('test', {
        accepts: {arg: 'inst', type: uniqueModelName},
        returns: {root: true},
        http: {path: '/test', verb: 'get'}
      });

      // after remote hook
      TestModel.afterRemote('**', function(ctxx, inst, next) {
        var tmpCtx = loopback.getCurrentContext();
        if (tmpCtx) {
          ctxx.result.data = tmpCtx.get('data');
        }else {
          ctxx.result.data = '';
        }
        next();
      });
    });

    after(function tearDownRunInOtherDomain() {
      clearInterval(runnerInterval);
    });

    it('passed if the patch is applied, otherwise failed', function(done) {
      request(app)
        .get('/TestModels/test')
        .end(function(err, res) {
          if (err) return done(err);
          assert.equal(res.body.data, 'test');
          done();
        });
    });
  });
});
