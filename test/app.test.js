/*jshint -W030 */

var async = require('async');
var path = require('path');

var http = require('http');
var express = require('express');
var loopback = require('../');
var PersistedModel = loopback.PersistedModel;

var describe = require('./util/describe');
var it = require('./util/it');

describe('app', function() {
  describe.onServer('.middleware(phase, handler)', function() {
    var app;
    var steps;

    beforeEach(function setup() {
      app = loopback();
      steps = [];
    });

    it('runs middleware in phases', function(done) {
      var PHASES = [
        'initial', 'session', 'auth', 'parse',
        'routes', 'files', 'final'
      ];

      PHASES.forEach(function(name) {
        app.middleware(name, namedHandler(name));
      });
      app.use(namedHandler('main'));

      executeMiddlewareHandlers(app, function(err) {
        if (err) return done(err);
        expect(steps).to.eql([
          'initial', 'session', 'auth', 'parse',
          'main', 'routes', 'files', 'final'
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

      var myHandler;
      app.middleware('routes:before',
        myHandler = handlerThatAddsHandler('my-handler'));
      var found = app._findLayerByHandler(myHandler);
      expect(found).to.be.object;
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
        var myHandler = namedHandler('my-handler');
        var wrappedHandler = function(req, res, next) {
          myHandler(req, res, next);
        };
        wrappedHandler['__NR_handler'] = myHandler;
        app.middleware('routes:before', wrappedHandler);
        var found = app._findLayerByHandler(myHandler);
        expect(found).to.be.object;
        expect(found).have.property('phase', 'routes:before');
        executeMiddlewareHandlers(app, function(err) {
          if (err) return done(err);
          expect(steps).to.eql(['my-handler']);
          done();
        });
      });

    it('allows handlers to be wrapped as a property on express stack',
      function(done) {
        var myHandler = namedHandler('my-handler');
        var wrappedHandler = function(req, res, next) {
          myHandler(req, res, next);
        };
        wrappedHandler['__handler'] = myHandler;
        app.middleware('routes:before', wrappedHandler);
        var found = app._findLayerByHandler(myHandler);
        expect(found).to.be.object;
        expect(found).have.property('phase', 'routes:before');
        executeMiddlewareHandlers(app, function(err) {
          if (err) return done(err);
          expect(steps).to.eql(['my-handler']);
          done();
        });
      });

    it('injects error from previous phases into the router', function(done) {
      var expectedError = new Error('expected error');

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
      var expectedError = new Error('expected error');

      app.middleware('initial', function(req, res, next) {
        next(expectedError);
      });

      executeMiddlewareHandlers(app, function(err) {
        expect(err).to.equal(expectedError);
        done();
      });
    });

    it('passes errors to error handlers in the same phase', function(done) {
      var expectedError = new Error('this should be handled by middleware');
      var handledError;

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
        });
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
        });
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
        });
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
      var req;
      var res;

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
          'res'
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
          'set'
        ]);

        done();
      });
    });

    it('sets req.baseUrl and req.originalUrl', function(done) {
      var reqProps;
      app.middleware('initial', function(req, res, next) {
        reqProps = { baseUrl: req.baseUrl, originalUrl: req.originalUrl };
        next();
      });

      executeMiddlewareHandlers(app, '/test/url', function(err) {
        if (err) return done(err);
        expect(reqProps).to.eql({ baseUrl: '', originalUrl: '/test/url' });
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
      var numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
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
      var data;
      var mountWasEmitted;
      var subapp = express();
      subapp.use(function(req, res, next) {
        data = {
          mountpath: req.app.mountpath,
          parent: req.app.parent
        };
        next();
      });
      subapp.on('mount', function() { mountWasEmitted = true; });

      app.middleware('routes', '/mountpath', subapp);

      executeMiddlewareHandlers(app, '/mountpath/test', function(err) {
        if (err) return done(err);
        expect(mountWasEmitted, 'mountWasEmitted').to.be.true;
        expect(data).to.eql({
          mountpath: '/mountpath',
          parent: app
        });
        done();
      });
    });

    it('restores req & res on return from mounted express app', function(done) {
      // jshint proto:true
      var expected = {};
      var actual = {};

      var subapp = express();
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
      var result = [];
      for (var k in obj) {
        result.push(k);
      }
      result.sort();
      return result;
    }
  });

  describe.onServer('.middlewareFromConfig', function() {
    it('provides API for loading middleware from JSON config', function(done) {
      var steps = [];
      var expectedConfig = { key: 'value' };

      var handlerFactory = function() {
        var args = Array.prototype.slice.apply(arguments);
        return function(req, res, next) {
          steps.push(args);
          next();
        };
      };

      // Config as an object (single arg)
      app.middlewareFromConfig(handlerFactory, {
        enabled: true,
        phase: 'session',
        params: expectedConfig
      });

      // Config as a value (single arg)
      app.middlewareFromConfig(handlerFactory, {
        enabled: true,
        phase: 'session:before',
        params: 'before'
      });

      // Config as a list of args
      app.middlewareFromConfig(handlerFactory, {
        enabled: true,
        phase: 'session:after',
        params: ['after', 2]
      });

      // Disabled by configuration
      app.middlewareFromConfig(handlerFactory, {
        enabled: false,
        phase: 'initial',
        params: null
      });

      // This should be triggered with matching verbs
      app.middlewareFromConfig(handlerFactory, {
        enabled: true,
        phase: 'routes:before',
        methods: ['get', 'head'],
        params: {x: 1}
      });

      // This should be skipped as the verb doesn't match
      app.middlewareFromConfig(handlerFactory, {
        enabled: true,
        phase: 'routes:before',
        methods: ['post'],
        params: {x: 2}
      });

      executeMiddlewareHandlers(app, function(err) {
        if (err) return done(err);
        expect(steps).to.eql([
          ['before'],
          [expectedConfig],
          ['after', 2],
          [{x: 1}]
        ]);
        done();
      });
    });

    it('scopes middleware to a list of scopes', function(done) {
      var steps = [];
      app.middlewareFromConfig(
        function factory() {
          return function(req, res, next) {
            steps.push(req.originalUrl);
            next();
          };
        },
        {
          phase: 'initial',
          paths: ['/scope', /^\/(a|b)/]
        });

      async.eachSeries(
        ['/', '/a', '/b', '/c', '/scope', '/other'],
        function(url, next) { executeMiddlewareHandlers(app, url, next); },
        function(err) {
          if (err) return done(err);
          expect(steps).to.eql(['/a', '/b', '/scope']);
          done();
        });
    });
  });

  describe.onServer('.defineMiddlewarePhases(nameOrArray)', function() {
    var app;
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
        'subapps'
      ], done);
    });

    it('merges phases preserving the order', function(done) {
      app.defineMiddlewarePhases([
        'initial',
        'postinit', 'preauth', // add
        'auth', 'routes',
        'subapps', // add
        'final',
        'last' // add
      ]);
      verifyMiddlewarePhases([
        'initial',
        'postinit', 'preauth', // new
        'auth', 'routes',
        'subapps', // new
        'files', 'final',
        'last' // new
      ], done);
    });

    it('throws helpful error on ordering conflict', function() {
      app.defineMiddlewarePhases(['first', 'second']);
      expect(function() { app.defineMiddlewarePhases(['second', 'first']); })
        .to.throw(/Ordering conflict.*first.*second/);
    });

    function verifyMiddlewarePhases(names, done) {
      var steps = [];
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
    var app;
    var db;
    beforeEach(function() {
      app = loopback();
      db = loopback.createDataSource({connector: loopback.Memory});
    });

    it('Expose a `Model` to remote clients', function() {
      var Color = PersistedModel.extend('color', {name: String});
      app.model(Color);
      Color.attachTo(db);

      expect(app.models()).to.eql([Color]);
    });

    it('uses singlar name as app.remoteObjects() key', function() {
      var Color = PersistedModel.extend('color', {name: String});
      app.model(Color);
      Color.attachTo(db);
      expect(app.remoteObjects()).to.eql({ color: Color });
    });

    it('uses singular name as shared class name', function() {
      var Color = PersistedModel.extend('color', {name: String});
      app.model(Color);
      Color.attachTo(db);
      var classes = app.remotes().classes().map(function(c) {return c.name;});
      expect(classes).to.contain('color');
    });

    it('registers existing models to app.models', function() {
      var Color = db.createModel('color', {name: String});
      app.model(Color);
      expect(Color.app).to.be.equal(app);
      expect(Color.shared).to.equal(true);
      expect(app.models.color).to.equal(Color);
      expect(app.models.Color).to.equal(Color);
    });

    it('emits a `modelRemoted` event', function() {
      var Color = PersistedModel.extend('color', {name: String});
      Color.shared = true;
      var remotedClass;
      app.on('modelRemoted', function(sharedClass) {
        remotedClass = sharedClass;
      });
      app.model(Color);
      expect(remotedClass).to.exist;
      expect(remotedClass).to.eql(Color.sharedClass);
    });

    it.onServer('updates REST API when a new model is added', function(done) {
      app.use(loopback.rest());
      request(app).get('/colors').expect(404, function(err, res) {
        if (err) return done(err);
        var Color = PersistedModel.extend('color', {name: String});
        app.model(Color);
        Color.attachTo(db);
        request(app).get('/colors').expect(200, done);
      });
    });

    it('accepts null dataSource', function() {
      app.model('MyTestModel', { dataSource: null });
    });

    it('accepts false dataSource', function() {
      app.model('MyTestModel', { dataSource: false });
    });

    it('should not require dataSource', function() {
      app.model('MyTestModel', {});
    });

  });

  describe('app.model(name, config)', function() {
    var app;

    beforeEach(function() {
      app = loopback();
      app.dataSource('db', {
        connector: 'memory'
      });
    });

    it('Sugar for defining a fully built model', function() {
      app.model('foo', {
        dataSource: 'db'
      });

      var Foo = app.models.foo;
      var f = new Foo();

      assert(f instanceof app.registry.getModel('Model'));
    });

    it('interprets extra first-level keys as options', function() {
      app.model('foo', {
        dataSource: 'db',
        base: 'User'
      });

      expect(app.models.foo.definition.settings.base).to.equal('User');
    });

    it('prefers config.options.key over config.key', function() {
      app.model('foo', {
        dataSource: 'db',
        base: 'User',
        options: {
          base: 'Application'
        }
      });

      expect(app.models.foo.definition.settings.base).to.equal('Application');
    });

    it('honors config.public options', function() {
      app.model('foo', {
        dataSource: 'db',
        public: false
      });
      expect(app.models.foo.app).to.equal(app);
      expect(app.models.foo.shared).to.equal(false);
    });

    it('defaults config.public to be true', function() {
      app.model('foo', {
        dataSource: 'db'
      });
      expect(app.models.foo.app).to.equal(app);
      expect(app.models.foo.shared).to.equal(true);
    });

  });

  describe('app.model(ModelCtor, config)', function() {
    it('attaches the model to a datasource', function() {
      var previousModel = loopback.registry.findModel('TestModel');
      app.dataSource('db', { connector: 'memory' });

      if (previousModel) {
        delete previousModel.dataSource;
      }

      assert(!previousModel || !previousModel.dataSource);
      app.model('TestModel', { dataSource: 'db' });
      expect(app.models.TestModel.dataSource).to.equal(app.dataSources.db);
    });
  });

  describe('app.models', function() {
    it('is unique per app instance', function() {
      app.dataSource('db', { connector: 'memory' });
      var Color = app.model('Color', { dataSource: 'db' });
      expect(app.models.Color).to.equal(Color);
      var anotherApp = loopback();
      expect(anotherApp.models.Color).to.equal(undefined);
    });
  });

  describe('app.dataSources', function() {
    it('is unique per app instance', function() {
      app.dataSource('ds', { connector: 'memory' });
      expect(app.datasources.ds).to.not.equal(undefined);
      var anotherApp = loopback();
      expect(anotherApp.datasources.ds).to.equal(undefined);
    });
  });

  describe('app.dataSource', function() {
    it('looks up the connector in `app.connectors`', function() {
      app.connector('custom', loopback.Memory);
      app.dataSource('custom', { connector: 'custom' });
      expect(app.dataSources.custom.name).to.equal(loopback.Memory.name);
    });
  });

  describe.onServer('listen()', function() {
    it('starts http server', function(done) {
      var app = loopback();
      app.set('port', 0);
      app.get('/', function(req, res) { res.status(200).send('OK'); });

      var server = app.listen();

      expect(server).to.be.an.instanceOf(require('http').Server);

      request(server)
        .get('/')
        .expect(200, done);
    });

    it('updates port on `listening` event', function(done) {
      var app = loopback();
      app.set('port', 0);

      app.listen(function() {
        expect(app.get('port'), 'port').to.not.equal(0);
        done();
      });
    });

    it('updates `url` on `listening` event', function(done) {
      var app = loopback();
      app.set('port', 0);
      app.set('host', undefined);

      app.listen(function() {
        var host = process.platform === 'win32' ? 'localhost' : app.get('host');
        var expectedUrl = 'http://' + host + ':' + app.get('port') + '/';
        expect(app.get('url'), 'url').to.equal(expectedUrl);
        done();
      });
    });

    it('forwards to http.Server.listen on more than one arg', function(done) {
      var app = loopback();
      app.set('port', 1);
      app.listen(0, '127.0.0.1', function() {
        expect(app.get('port'), 'port').to.not.equal(0).and.not.equal(1);
        expect(this.address().address).to.equal('127.0.0.1');
        done();
      });
    });

    it('forwards to http.Server.listen when the single arg is not a function',
      function(done) {
        var app = loopback();
        app.set('port', 1);
        app.listen(0).on('listening', function() {
          expect(app.get('port'), 'port') .to.not.equal(0).and.not.equal(1);
          done();
        });
      }
    );

    it('uses app config when no parameter is supplied', function(done) {
      var app = loopback();
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
      var AUTH_MODELS = ['User', 'ACL', 'AccessToken', 'Role', 'RoleMapping'];
      var app = loopback({ localRegistry: true, loadBuiltinModels: true });
      require('../lib/builtin-models')(app.registry);
      var db = app.dataSource('db', { connector: 'memory' });

      app.enableAuth({ dataSource: 'db' });

      expect(Object.keys(app.models)).to.include.members(AUTH_MODELS);

      AUTH_MODELS.forEach(function(m) {
        var Model = app.models[m];
        expect(Model.dataSource, m + '.dataSource').to.equal(db);
        expect(Model.shared, m + '.shared').to.equal(m === 'User');
      });
    });

    it('detects already configured subclass of a required model', function() {
      var app = loopback({ localRegistry: true, loadBuiltinModels: true });
      var db = app.dataSource('db', { connector: 'memory' });
      var Customer = app.registry.createModel('Customer', {}, { base: 'User' });
      app.model(Customer, { dataSource: 'db' });

      app.enableAuth({ dataSource: 'db' });

      expect(Object.keys(app.models)).to.not.include('User');
    });
  });

  describe.onServer('app.get(\'/\', loopback.status())', function() {
    it('should return the status of the application', function(done) {
      var app = loopback();
      app.get('/', loopback.status());
      request(app)
        .get('/')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);

          assert.equal(typeof res.body, 'object');
          assert(res.body.started);
          // The number can be 0
          assert(res.body.uptime !== undefined);

          var elapsed = Date.now() - Number(new Date(res.body.started));

          // elapsed should be a positive number...
          assert(elapsed >= 0);

          // less than 100 milliseconds
          assert(elapsed < 100);

          done();
        });
    });
  });

  describe('app.connectors', function() {
    it('is unique per app instance', function() {
      app.connectors.foo = 'bar';
      var anotherApp = loopback();
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
      var app1 = loopback();
      var app2 = loopback();

      expect(app1.settings).to.not.equal(app2.settings);

      app1.set('key', 'value');
      expect(app2.get('key'), 'app2 value').to.equal(undefined);
    });
  });

  it('exposes loopback as a property', function() {
    var app = loopback();
    expect(app.loopback).to.equal(loopback);
  });

  describe('normalizeHttpPath option', function() {
    var app;
    var db;
    beforeEach(function() {
      app = loopback();
      db = loopback.createDataSource({ connector: loopback.Memory });
    });

    it.onServer('normalizes the http path', function(done) {
      var UserAccount = PersistedModel.extend(
        'UserAccount',
        { name: String },
        {
          remoting: { normalizeHttpPath: true }
        });
      app.model(UserAccount);
      UserAccount.attachTo(db);

      app.use(loopback.rest());
      request(app).get('/user-accounts').expect(200, done);
    });
  });
});

function executeMiddlewareHandlers(app, urlPath, callback) {
  var server = http.createServer(function(req, res) {
    app.handle(req, res, callback);
  });

  if (callback === undefined && typeof urlPath === 'function') {
    callback = urlPath;
    urlPath = '/test/url';
  }

  request(server)
    .get(urlPath)
    .end(function(err) {
      if (err) return callback(err);
    });
}
