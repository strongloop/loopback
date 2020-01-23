// Copyright IBM Corp. 2013,2019. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
const assert = require('assert');
const async = require('async');
const path = require('path');

const http = require('http');
const express = require('express');
const loopback = require('../');
const PersistedModel = loopback.PersistedModel;

const describe = require('./util/describe');
const expect = require('./helpers/expect');
const it = require('./util/it');
const request = require('supertest');
const sinon = require('sinon');

describe('app', function() {
  let app;
  beforeEach(function() {
    app = loopback({localRegistry: true, loadBuiltinModels: true});
  });

  describe.onServer('.middleware(phase, handler)', function() {
    let steps;

    beforeEach(function setup() {
      steps = [];
    });

    it('runs middleware in phases', function(done) {
      const PHASES = [
        'initial', 'session', 'auth', 'parse',
        'routes', 'files', 'final',
      ];

      PHASES.forEach(function(name) {
        app.middleware(name, namedHandler(name));
      });
      app.use(namedHandler('main'));

      executeMiddlewareHandlers(app, function(err) {
        if (err) return done(err);

        expect(steps).to.eql([
          'initial', 'session', 'auth', 'parse',
          'main', 'routes', 'files', 'final',
        ]);

        done();
      });
    });

    it('preserves order of handlers in the same phase', function(done) {
      app.middleware('initial', namedHandler('first'));
      app.middleware('initial', namedHandler('second'));

      executeMiddlewareHandlers(app, function(err) {
        if (err) return done(err);

        expect(steps).to.eql(['first', 'second']);

        done();
      });
    });

    it('supports `before:` and `after:` prefixes', function(done) {
      app.middleware('routes:before', namedHandler('routes:before'));
      app.middleware('routes:after', namedHandler('routes:after'));
      app.use(namedHandler('main'));

      executeMiddlewareHandlers(app, function(err) {
        if (err) return done(err);

        expect(steps).to.eql(['routes:before', 'main', 'routes:after']);

        done();
      });
    });

    it('allows extra handlers on express stack during app.use', function(done) {
      function handlerThatAddsHandler(name) {
        app.use(namedHandler('extra-handler'));
        return namedHandler(name);
      }

      let myHandler;
      app.middleware('routes:before',
        myHandler = handlerThatAddsHandler('my-handler'));
      const found = app._findLayerByHandler(myHandler);
      expect(found).to.be.an('object');
      expect(myHandler).to.equal(found.handle);
      expect(found).have.property('phase', 'routes:before');
      executeMiddlewareHandlers(app, function(err) {
        if (err) return done(err);

        expect(steps).to.eql(['my-handler', 'extra-handler']);

        done();
      });
    });

    it('allows handlers to be wrapped as __NR_handler on express stack',
      function(done) {
        const myHandler = namedHandler('my-handler');
        const wrappedHandler = function(req, res, next) {
          myHandler(req, res, next);
        };
        wrappedHandler['__NR_handler'] = myHandler;
        app.middleware('routes:before', wrappedHandler);
        const found = app._findLayerByHandler(myHandler);
        expect(found).to.be.an('object');
        expect(found).have.property('phase', 'routes:before');
        executeMiddlewareHandlers(app, function(err) {
          if (err) return done(err);

          expect(steps).to.eql(['my-handler']);

          done();
        });
      });

    it('allows handlers to be wrapped as __appdynamicsProxyInfo__ on express stack',
      function(done) {
        const myHandler = namedHandler('my-handler');
        const wrappedHandler = function(req, res, next) {
          myHandler(req, res, next);
        };
        wrappedHandler['__appdynamicsProxyInfo__'] = {
          orig: myHandler,
        };
        app.middleware('routes:before', wrappedHandler);
        const found = app._findLayerByHandler(myHandler);
        expect(found).to.be.an('object');
        expect(found).have.property('phase', 'routes:before');
        executeMiddlewareHandlers(app, function(err) {
          if (err) return done(err);

          expect(steps).to.eql(['my-handler']);

          done();
        });
      });

    it('allows handlers to be wrapped as a property on express stack',
      function(done) {
        const myHandler = namedHandler('my-handler');
        const wrappedHandler = function(req, res, next) {
          myHandler(req, res, next);
        };
        wrappedHandler['__handler'] = myHandler;
        app.middleware('routes:before', wrappedHandler);
        const found = app._findLayerByHandler(myHandler);
        expect(found).to.be.an('object');
        expect(found).have.property('phase', 'routes:before');
        executeMiddlewareHandlers(app, function(err) {
          if (err) return done(err);

          expect(steps).to.eql(['my-handler']);

          done();
        });
      });

    it('injects error from previous phases into the router', function(done) {
      const expectedError = new Error('expected error');

      app.middleware('initial', function(req, res, next) {
        steps.push('initial');

        next(expectedError);
      });

      // legacy solution for error handling
      app.use(function errorHandler(err, req, res, next) {
        expect(err).to.equal(expectedError);
        steps.push('error');

        next();
      });

      executeMiddlewareHandlers(app, function(err) {
        if (err) return done(err);

        expect(steps).to.eql(['initial', 'error']);

        done();
      });
    });

    it('passes unhandled error to callback', function(done) {
      const expectedError = new Error('expected error');

      app.middleware('initial', function(req, res, next) {
        next(expectedError);
      });

      executeMiddlewareHandlers(app, function(err) {
        expect(err).to.equal(expectedError);

        done();
      });
    });

    it('passes errors to error handlers in the same phase', function(done) {
      const expectedError = new Error('this should be handled by middleware');
      let handledError;

      app.middleware('initial', function(req, res, next) {
        // continue in the next tick, this verifies that the next
        // handler waits until the previous one is done
        process.nextTick(function() {
          next(expectedError);
        });
      });

      app.middleware('initial', function(err, req, res, next) {
        handledError = err;

        next();
      });

      executeMiddlewareHandlers(app, function(err) {
        if (err) return done(err);

        expect(handledError).to.equal(expectedError);

        done();
      });
    });

    it('scopes middleware to a string path', function(done) {
      app.middleware('initial', '/scope', pathSavingHandler());

      async.eachSeries(
        ['/', '/scope', '/scope/item', '/other'],
        function(url, next) { executeMiddlewareHandlers(app, url, next); },
        function(err) {
          if (err) return done(err);

          expect(steps).to.eql(['/scope', '/scope/item']);

          done();
        },
      );
    });

    it('scopes middleware to a regex path', function(done) {
      app.middleware('initial', /^\/(a|b)/, pathSavingHandler());

      async.eachSeries(
        ['/', '/a', '/b', '/c'],
        function(url, next) { executeMiddlewareHandlers(app, url, next); },
        function(err) {
          if (err) return done(err);

          expect(steps).to.eql(['/a', '/b']);

          done();
        },
      );
    });

    it('scopes middleware to a list of scopes', function(done) {
      app.middleware('initial', ['/scope', /^\/(a|b)/], pathSavingHandler());

      async.eachSeries(
        ['/', '/a', '/b', '/c', '/scope', '/other'],
        function(url, next) { executeMiddlewareHandlers(app, url, next); },
        function(err) {
          if (err) return done(err);

          expect(steps).to.eql(['/a', '/b', '/scope']);

          done();
        },
      );
    });

    it('sets req.url to a sub-path', function(done) {
      app.middleware('initial', ['/scope'], function(req, res, next) {
        steps.push(req.url);

        next();
      });

      executeMiddlewareHandlers(app, '/scope/id', function(err) {
        if (err) return done(err);

        expect(steps).to.eql(['/id']);

        done();
      });
    });

    it('exposes express helpers on req and res objects', function(done) {
      let req, res;

      app.middleware('initial', function(rq, rs, next) {
        req = rq;
        res = rs;

        next();
      });

      executeMiddlewareHandlers(app, function(err) {
        if (err) return done(err);

        expect(getObjectAndPrototypeKeys(req), 'request').to.include.members([
          'accepts',
          'get',
          'param',
          'params',
          'query',
          'res',
        ]);

        expect(getObjectAndPrototypeKeys(res), 'response').to.include.members([
          'cookie',
          'download',
          'json',
          'jsonp',
          'redirect',
          'req',
          'send',
          'sendFile',
          'set',
        ]);

        done();
      });
    });

    it('sets req.baseUrl and req.originalUrl', function(done) {
      let reqProps;
      app.middleware('initial', function(req, res, next) {
        reqProps = {baseUrl: req.baseUrl, originalUrl: req.originalUrl};

        next();
      });

      executeMiddlewareHandlers(app, '/test/url', function(err) {
        if (err) return done(err);

        expect(reqProps).to.eql({baseUrl: '', originalUrl: '/test/url'});

        done();
      });
    });

    it('preserves correct order of routes vs. middleware', function(done) {
      // This test verifies that `app.route` triggers sort of layers
      app.middleware('files', namedHandler('files'));
      app.get('/test', namedHandler('route'));

      executeMiddlewareHandlers(app, '/test', function(err) {
        if (err) return done(err);

        expect(steps).to.eql(['route', 'files']);

        done();
      });
    });

    it('preserves order of middleware in the same phase', function(done) {
      // while we are discouraging developers from depending on
      // the registration order of middleware in the same phase,
      // we must preserve the order for compatibility with `app.use`
      // and `app.route`.

      // we need at least 9 elements to expose non-stability
      // of the built-in sort function
      const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      numbers.forEach(function(n) {
        app.middleware('routes', namedHandler(n));
      });

      executeMiddlewareHandlers(app, function(err) {
        if (err) return done;

        expect(steps).to.eql(numbers);

        done();
      });
    });

    it('correctly mounts express apps', function(done) {
      let data, mountWasEmitted;
      const subapp = express();
      subapp.use(function(req, res, next) {
        data = {
          mountpath: req.app.mountpath,
          parent: req.app.parent,
        };

        next();
      });
      subapp.on('mount', function() { mountWasEmitted = true; });

      app.middleware('routes', '/mountpath', subapp);

      executeMiddlewareHandlers(app, '/mountpath/test', function(err) {
        if (err) return done(err);

        expect(mountWasEmitted, 'mountWasEmitted').to.be.true();
        expect(data).to.eql({
          mountpath: '/mountpath',
          parent: app,
        });

        done();
      });
    });

    it('restores req & res on return from mounted express app', function(done) {
      const expected = {};
      const actual = {};

      const subapp = express();
      subapp.use(function verifyTestAssumptions(req, res, next) {
        expect(req.__proto__).to.not.equal(expected.req);
        expect(res.__proto__).to.not.equal(expected.res);

        next();
      });

      app.middleware('initial', function saveOriginalValues(req, res, next) {
        expected.req = req.__proto__;
        expected.res = res.__proto__;

        next();
      });
      app.middleware('routes', subapp);
      app.middleware('final', function saveActualValues(req, res, next) {
        actual.req = req.__proto__;
        actual.res = res.__proto__;

        next();
      });

      executeMiddlewareHandlers(app, function(err) {
        if (err) return done(err);

        expect(actual.req, 'req').to.equal(expected.req);
        expect(actual.res, 'res').to.equal(expected.res);

        done();
      });
    });

    function namedHandler(name) {
      return function(req, res, next) {
        steps.push(name);
        next();
      };
    }

    function pathSavingHandler() {
      return function(req, res, next) {
        steps.push(req.originalUrl);

        next();
      };
    }

    function getObjectAndPrototypeKeys(obj) {
      const result = [];
      for (const k in obj) {
        result.push(k);
      }
      result.sort();
      return result;
    }
  });

  describe.onServer('.middlewareFromConfig', function() {
    it('provides API for loading middleware from JSON config', function(done) {
      const steps = [];
      const expectedConfig = {key: 'value'};

      const handlerFactory = function() {
        const args = Array.prototype.slice.apply(arguments);
        return function(req, res, next) {
          steps.push(args);

          next();
        };
      };

      // Config as an object (single arg)
      app.middlewareFromConfig(handlerFactory, {
        enabled: true,
        phase: 'session',
        params: expectedConfig,
      });

      // Config as a value (single arg)
      app.middlewareFromConfig(handlerFactory, {
        enabled: true,
        phase: 'session:before',
        params: 'before',
      });

      // Config as a list of args
      app.middlewareFromConfig(handlerFactory, {
        enabled: true,
        phase: 'session:after',
        params: ['after', 2],
      });

      // Disabled by configuration
      app.middlewareFromConfig(handlerFactory, {
        enabled: false,
        phase: 'initial',
        params: null,
      });

      // This should be triggered with matching verbs
      app.middlewareFromConfig(handlerFactory, {
        enabled: true,
        phase: 'routes:before',
        methods: ['get', 'head'],
        params: {x: 1},
      });

      // This should be skipped as the verb doesn't match
      app.middlewareFromConfig(handlerFactory, {
        enabled: true,
        phase: 'routes:before',
        methods: ['post'],
        params: {x: 2},
      });

      executeMiddlewareHandlers(app, function(err) {
        if (err) return done(err);

        expect(steps).to.eql([
          ['before'],
          [expectedConfig],
          ['after', 2],
          [{x: 1}],
        ]);

        done();
      });
    });

    it('scopes middleware from config to a list of scopes', function(done) {
      const steps = [];
      app.middlewareFromConfig(
        function factory() {
          return function(req, res, next) {
            steps.push(req.originalUrl);

            next();
          };
        },
        {
          phase: 'initial',
          paths: ['/scope', /^\/(a|b)/],
        },
      );

      async.eachSeries(
        ['/', '/a', '/b', '/c', '/scope', '/other'],
        function(url, next) { executeMiddlewareHandlers(app, url, next); },
        function(err) {
          if (err) return done(err);

          expect(steps).to.eql(['/a', '/b', '/scope']);

          done();
        },
      );
    });
  });

  describe.onServer('.defineMiddlewarePhases(nameOrArray)', function() {
    let app;
    beforeEach(function() {
      app = loopback();
    });

    it('adds the phase just before `routes` by default', function(done) {
      app.defineMiddlewarePhases('custom');
      verifyMiddlewarePhases(['custom', 'routes'], done);
    });

    it('merges phases adding to the start of the list', function(done) {
      app.defineMiddlewarePhases(['first', 'routes', 'subapps']);
      verifyMiddlewarePhases([
        'first',
        'initial', // this was the original first phase
        'routes',
        'subapps',
      ], done);
    });

    it('merges phases preserving the order', function(done) {
      app.defineMiddlewarePhases([
        'initial',
        'postinit', 'preauth', // add
        'auth', 'routes',
        'subapps', // add
        'final',
        'last', // add
      ]);
      verifyMiddlewarePhases([
        'initial',
        'postinit', 'preauth', // new
        'auth', 'routes',
        'subapps', // new
        'files', 'final',
        'last', // new
      ], done);
    });

    it('throws helpful error on ordering conflict', function() {
      app.defineMiddlewarePhases(['first', 'second']);
      expect(function() { app.defineMiddlewarePhases(['second', 'first']); })
        .to.throw(/Ordering conflict.*first.*second/);
    });

    function verifyMiddlewarePhases(names, done) {
      const steps = [];
      names.forEach(function(it) {
        app.middleware(it, function(req, res, next) {
          steps.push(it);

          next();
        });
      });

      executeMiddlewareHandlers(app, function(err) {
        if (err) return done(err);

        expect(steps).to.eql(names);

        done();
      });
    }
  });

  describe('app.model(Model)', function() {
    let app, db, MyTestModel;
    beforeEach(function() {
      app = loopback();
      app.set('remoting', {errorHandler: {debug: true, log: false}});
      db = loopback.createDataSource({connector: loopback.Memory});
      MyTestModel = app.registry.createModel('MyTestModel');
    });

    it('Expose a `Model` to remote clients', function() {
      const Color = PersistedModel.extend('color', {name: String});
      app.model(Color);
      Color.attachTo(db);

      expect(app.models()).to.eql([Color]);
    });

    it('uses singular name as app.remoteObjects() key', function() {
      const Color = PersistedModel.extend('color', {name: String});
      app.model(Color);
      Color.attachTo(db);
      expect(app.remoteObjects()).to.eql({color: Color});
    });

    it('uses singular name as shared class name', function() {
      const Color = PersistedModel.extend('color', {name: String});
      app.model(Color);
      Color.attachTo(db);
      const classes = app.remotes().classes().map(function(c) { return c.name; });
      expect(classes).to.contain('color');
    });

    it('registers existing models to app.models', function() {
      const Color = db.createModel('color', {name: String});
      app.model(Color);
      expect(Color.app).to.be.equal(app);
      expect(Color.shared).to.equal(true);
      expect(app.models.color).to.equal(Color);
      expect(app.models.Color).to.equal(Color);
    });

    it('emits a `modelRemoted` event', function() {
      const Color = PersistedModel.extend('color', {name: String});
      Color.shared = true;
      let remotedClass;
      app.on('modelRemoted', function(sharedClass) {
        remotedClass = sharedClass;
      });
      app.model(Color);
      expect(remotedClass).to.exist();
      expect(remotedClass).to.eql(Color.sharedClass);
    });

    it('emits a `remoteMethodDisabled` event', function() {
      const Color = PersistedModel.extend('color', {name: String});
      Color.shared = true;
      let remoteMethodDisabledClass, disabledRemoteMethod;
      app.on('remoteMethodDisabled', function(sharedClass, methodName) {
        remoteMethodDisabledClass = sharedClass;
        disabledRemoteMethod = methodName;
      });
      app.model(Color);
      app.models.Color.disableRemoteMethodByName('findOne');
      expect(remoteMethodDisabledClass).to.exist();
      expect(remoteMethodDisabledClass).to.eql(Color.sharedClass);
      expect(disabledRemoteMethod).to.exist();
      expect(disabledRemoteMethod).to.eql('findOne');
    });

    it('emits a `remoteMethodAdded` event', function() {
      app.dataSource('db', {connector: 'memory'});
      const Book = app.registry.createModel(
        'Book',
        {name: 'string'},
        {plural: 'books'},
      );
      app.model(Book, {dataSource: 'db'});

      const Page = app.registry.createModel(
        'Page',
        {name: 'string'},
        {plural: 'pages'},
      );
      app.model(Page, {dataSource: 'db'});

      Book.hasMany(Page);

      let remoteMethodAddedClass;
      app.on('remoteMethodAdded', function(sharedClass) {
        remoteMethodAddedClass = sharedClass;
      });
      Book.nestRemoting('pages');
      expect(remoteMethodAddedClass).to.exist();
      expect(remoteMethodAddedClass).to.eql(Book.sharedClass);
    });

    it('accepts null dataSource', function(done) {
      app.model(MyTestModel, {dataSource: null});
      expect(MyTestModel.dataSource).to.eql(null);
      done();
    });

    it('accepts false dataSource', function(done) {
      app.model(MyTestModel, {dataSource: false});
      expect(MyTestModel.getDataSource()).to.eql(null);
      done();
    });

    it('does not require dataSource', function(done) {
      app.model(MyTestModel);
      done();
    });

    it('throws error if model typeof string is passed', function() {
      const fn = function() { app.model('MyTestModel'); };
      expect(fn).to.throw(/app(\.model|\.registry)/);
    });
  });

  describe('app.model(ModelCtor, config)', function() {
    it('attaches the model to a datasource', function() {
      const previousModel = loopback.registry.findModel('TestModel');
      app.dataSource('db', {connector: 'memory'});

      if (previousModel) {
        delete previousModel.dataSource;
      }

      assert(!previousModel || !previousModel.dataSource);
      const TestModel = app.registry.createModel('TestModel');
      app.model(TestModel, {dataSource: 'db'});
      expect(app.models.TestModel.dataSource).to.equal(app.dataSources.db);
    });
  });

  describe('app.deleteModelByName()', () => {
    let TestModel;
    beforeEach(setupTestModel);

    it('removes the model from app registries', () => {
      expect(Object.keys(app.models))
        .to.contain('test-model')
        .and.contain('TestModel')
        .and.contain('testModel');
      expect(app.models().map(m => m.modelName))
        .to.contain('test-model');

      app.deleteModelByName('test-model');

      expect(Object.keys(app.models))
        .to.not.contain('test-model')
        .and.not.contain('TestModel')
        .and.not.contain('testModel');
      expect(app.models().map(m => m.modelName))
        .to.not.contain('test-model');
    });

    it('removes the model from juggler registries', () => {
      expect(Object.keys(app.registry.modelBuilder.models))
        .to.contain('test-model');

      app.deleteModelByName('test-model');

      expect(Object.keys(app.registry.modelBuilder.models))
        .to.not.contain('test-model');
    });

    it('removes the model from remoting registries', () => {
      expect(Object.keys(app.remotes()._classes))
        .to.contain('test-model');

      app.deleteModelByName('test-model');

      expect(Object.keys(app.remotes()._classes))
        .to.not.contain('test-model');
    });

    it('emits "modelDeleted" event', () => {
      const spy = sinon.spy();
      app.on('modelDeleted', spy);

      app.deleteModelByName('test-model');

      sinon.assert.calledWith(spy, TestModel);
    });

    function setupTestModel() {
      TestModel = app.registry.createModel({
        name: 'test-model',
        base: 'Model',
      });
      app.model(TestModel, {dataSource: null});
    }
  });

  describe('app.models', function() {
    it('is unique per app instance', function() {
      app.dataSource('db', {connector: 'memory'});
      const Color = app.registry.createModel('Color');
      app.model(Color, {dataSource: 'db'});
      expect(app.models.Color).to.equal(Color);
      const anotherApp = loopback();
      expect(anotherApp.models.Color).to.equal(undefined);
    });
  });

  describe('app.dataSources', function() {
    it('is unique per app instance', function() {
      app.dataSource('ds', {connector: 'memory'});
      expect(app.datasources.ds).to.not.equal(undefined);
      const anotherApp = loopback();
      expect(anotherApp.datasources.ds).to.equal(undefined);
    });
  });

  describe('app.dataSource', function() {
    it('looks up the connector in `app.connectors`', function() {
      app.connector('custom', loopback.Memory);
      app.dataSource('custom', {connector: 'custom'});
      expect(app.dataSources.custom.name).to.equal('custom');
    });

    it('adds data source name to error messages', function() {
      app.connector('throwing', {
        initialize: function() { throw new Error('expected test error'); },
      });

      expect(function() {
        app.dataSource('bad-ds', {connector: 'throwing'});
      }).to.throw(/bad-ds.*throwing/);
    });

    it('adds app reference to the data source object', function() {
      app.dataSource('ds', {connector: 'memory'});
      expect(app.datasources.ds.app).to.not.equal(undefined);
      expect(app.datasources.ds.app).to.equal(app);
    });
  });

  describe.onServer('listen()', function() {
    it('starts http server', function(done) {
      const app = loopback();
      app.set('port', 0);
      app.get('/', function(req, res) { res.status(200).send('OK'); });

      const server = app.listen();

      expect(server).to.be.an.instanceOf(require('http').Server);

      request(server)
        .get('/')
        .expect(200, done);
    });

    it('updates port on `listening` event', function(done) {
      const app = loopback();
      app.set('port', 0);

      app.listen(function() {
        expect(app.get('port'), 'port').to.not.equal(0);

        done();
      });
    });

    it('updates `url` on `listening` event', function(done) {
      const app = loopback();
      app.set('port', 0);
      app.set('host', undefined);

      app.listen(function() {
        const expectedUrl = 'http://localhost:' + app.get('port') + '/';
        expect(app.get('url'), 'url').to.equal(expectedUrl);

        done();
      });
    });

    it('forwards to http.Server.listen on more than one arg', function(done) {
      const app = loopback();
      app.set('port', 1);
      app.listen(0, '127.0.0.1', function() {
        expect(app.get('port'), 'port').to.not.equal(0).and.not.equal(1);
        expect(this.address().address).to.equal('127.0.0.1');

        done();
      });
    });

    it('forwards to http.Server.listen when the single arg is not a function', function(done) {
      const app = loopback();
      app.set('port', 1);
      app.listen(0).on('listening', function() {
        expect(app.get('port'), 'port') .to.not.equal(0).and.not.equal(1);

        done();
      });
    });

    it('uses app config when no parameter is supplied', function(done) {
      const app = loopback();
      // Http listens on all interfaces by default
      // Custom host serves as an indicator whether
      // the value was used by app.listen
      app.set('host', '127.0.0.1');
      app.listen()
        .on('listening', function() {
          expect(this.address().address).to.equal('127.0.0.1');

          done();
        });
    });
  });

  describe.onServer('enableAuth', function() {
    it('should set app.isAuthEnabled to true', function() {
      expect(app.isAuthEnabled).to.not.equal(true);
      app.enableAuth();
      expect(app.isAuthEnabled).to.equal(true);
    });

    it('auto-configures required models to provided dataSource', function() {
      const AUTH_MODELS = ['User', 'ACL', 'AccessToken', 'Role', 'RoleMapping'];
      const app = loopback({localRegistry: true, loadBuiltinModels: true});
      require('../lib/builtin-models')(app.registry);
      const db = app.dataSource('db', {connector: 'memory'});

      app.enableAuth({dataSource: 'db'});

      expect(Object.keys(app.models)).to.include.members(AUTH_MODELS);

      AUTH_MODELS.forEach(function(m) {
        const Model = app.models[m];
        expect(Model.dataSource, m + '.dataSource').to.equal(db);
        expect(Model.shared, m + '.shared').to.equal(m === 'User');
      });
    });

    it('detects already configured subclass of a required model', function() {
      const app = loopback({localRegistry: true, loadBuiltinModels: true});
      const db = app.dataSource('db', {connector: 'memory'});
      const Customer = app.registry.createModel('Customer', {}, {base: 'User'});
      app.model(Customer, {dataSource: 'db'});

      // Fix AccessToken's "belongsTo user" relation to use our new Customer model
      const AccessToken = app.registry.getModel('AccessToken');
      AccessToken.settings.relations.user.model = 'Customer';

      app.enableAuth({dataSource: 'db'});

      expect(Object.keys(app.models)).to.not.include('User');
    });
  });

  describe.onServer('app.get(\'/\', loopback.status())', function() {
    it('should return the status of the application', function(done) {
      const app = loopback();
      app.get('/', loopback.status());
      request(app)
        .get('/')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);

          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('started');
          expect(res.body.uptime, 'uptime').to.be.gte(0);

          const elapsed = Date.now() - Number(new Date(res.body.started));

          // elapsed should be a small positive number...
          expect(elapsed, 'elapsed').to.be.within(0, 300);

          done();
        });
    });
  });

  describe('app.connectors', function() {
    it('is unique per app instance', function() {
      app.connectors.foo = 'bar';
      const anotherApp = loopback();
      expect(anotherApp.connectors.foo).to.equal(undefined);
    });

    it('includes Remote connector', function() {
      expect(app.connectors.remote).to.equal(loopback.Remote);
    });

    it('includes Memory connector', function() {
      expect(app.connectors.memory).to.equal(loopback.Memory);
    });
  });

  describe('app.connector', function() {
    // any connector will do
    it('adds the connector to the registry', function() {
      app.connector('foo-bar', loopback.Memory);
      expect(app.connectors['foo-bar']).to.equal(loopback.Memory);
    });

    it('adds a classified alias', function() {
      app.connector('foo-bar', loopback.Memory);
      expect(app.connectors.FooBar).to.equal(loopback.Memory);
    });

    it('adds a camelized alias', function() {
      app.connector('FOO-BAR', loopback.Memory);
      expect(app.connectors.FOOBAR).to.equal(loopback.Memory);
    });
  });

  describe('app.settings', function() {
    it('can be altered via `app.set(key, value)`', function() {
      app.set('write-key', 'write-value');
      expect(app.settings).to.have.property('write-key', 'write-value');
    });

    it('can be read via `app.get(key)`', function() {
      app.settings['read-key'] = 'read-value';
      expect(app.get('read-key')).to.equal('read-value');
    });

    it('is unique per app instance', function() {
      const app1 = loopback();
      const app2 = loopback();

      expect(app1.settings).to.not.equal(app2.settings);

      app1.set('key', 'value');
      expect(app2.get('key'), 'app2 value').to.equal(undefined);
    });
  });

  it('exposes loopback as a property', function() {
    const app = loopback();
    expect(app.loopback).to.equal(loopback);
  });

  function setupUserModels(app, options, done) {
    app.dataSource('db', {connector: 'memory'});
    const UserAccount = app.registry.createModel(
      'UserAccount',
      {name: 'string'},
      options,
    );
    const UserRole = app.registry.createModel(
      'UserRole',
      {name: 'string'},
    );
    app.model(UserAccount, {dataSource: 'db'});
    app.model(UserRole, {dataSource: 'db'});
    UserAccount.hasMany(UserRole);
    UserAccount.create({
      name: 'user',
    }, function(err, user) {
      if (err) return done(err);
      app.use(loopback.rest());
      done();
    });
  }

  describe('Model-level normalizeHttpPath option', function() {
    let app;
    beforeEach(function() {
      app = loopback();
    });

    it.onServer('honours Model-level setting of `false`', function(done) {
      setupUserModels(app, {
        remoting: {normalizeHttpPath: false},
      }, function(err) {
        if (err) return done(err);
        request(app).get('/UserAccounts').expect(200, function(err) {
          if (err) return done(err);
          request(app).get('/UserAccounts/1/userRoles').expect(200, function(err) {
            if (err) return done(err);
            done();
          });
        });
      });
    });

    it.onServer('honours Model-level setting of `true`', function(done) {
      setupUserModels(app, {
        remoting: {normalizeHttpPath: true},
      }, function(err) {
        if (err) return done(err);
        request(app).get('/user-accounts').expect(200, function(err) {
          if (err) return done(err);
          request(app).get('/user-accounts/1/user-roles').expect(200, function(err) {
            if (err) return done(err);
            done();
          });
        });
      });
    });
  });
  describe('app-level normalizeHttpPath option', function() {
    let app;
    beforeEach(function() {
      app = loopback();
    });

    it.onServer('honours app-level setting of `false`', function(done) {
      app.set('remoting', {rest: {normalizeHttpPath: false}});
      setupUserModels(app, null, function(err) {
        if (err) return done(err);
        request(app).get('/UserAccounts').expect(200, function(err) {
          if (err) return done(err);
          request(app).get('/UserAccounts/1/userRoles').expect(200, function(err) {
            if (err) return done(err);
            done();
          });
        });
      });
    });

    it.onServer('honours app-level setting of `true`', function(done) {
      app.set('remoting', {rest: {normalizeHttpPath: true}});
      setupUserModels(app, null, function(err) {
        if (err) return done(err);
        request(app).get('/user-accounts').expect(200, function(err) {
          if (err) return done(err);
          request(app).get('/user-accounts/1/user-roles').expect(200, function(err) {
            if (err) return done(err);
            done();
          });
        });
      });
    });
  });

  describe('Model-level and app-level normalizeHttpPath options', function() {
    let app;
    beforeEach(function() {
      app = loopback();
    });

    it.onServer('prioritizes Model-level setting over the app-level one', function(done) {
      app.set('remoting', {rest: {normalizeHttpPath: true}});
      setupUserModels(app, {
        remoting: {normalizeHttpPath: false},
      }, function(err) {
        if (err) return done(err);
        request(app).get('/UserAccounts').expect(200, function(err) {
          if (err) return done(err);
          request(app).get('/UserAccounts/1/userRoles').expect(200, function(err) {
            if (err) return done(err);
            done();
          });
        });
      });
    });
  });
});

function executeMiddlewareHandlers(app, urlPath, callback) {
  let handlerError = undefined;
  const server = http.createServer(function(req, res) {
    app.handle(req, res, function(err) {
      if (err) {
        handlerError = err;
        res.statusCode = err.status || err.statusCode || 500;
        res.end(err.stack || err);
      } else {
        res.statusCode = 204;
        res.end();
      }
    });
  });

  if (callback === undefined && typeof urlPath === 'function') {
    callback = urlPath;
    urlPath = '/test/url';
  }

  request(server)
    .get(urlPath)
    .end(function(err) {
      callback(handlerError || err);
    });
}
