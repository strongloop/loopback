var path = require('path');
var SIMPLE_APP = path.join(__dirname, 'fixtures', 'simple-app');
var loopback = require('../');
var DataModel = loopback.DataModel;

var describe = require('./util/describe');
var it = require('./util/it');

describe('app', function() {

  describe('app.model(Model)', function() {
    var app, db;
    beforeEach(function() {
      app = loopback();
      db = loopback.createDataSource({connector: loopback.Memory});
    });

    it("Expose a `Model` to remote clients", function() {
      var Color = DataModel.extend('color', {name: String});
      app.model(Color);
      Color.attachTo(db);

      expect(app.models()).to.eql([Color]);
    });

    it('uses singlar name as app.remoteObjects() key', function() {
      var Color = DataModel.extend('color', {name: String});
      app.model(Color);
      Color.attachTo(db);
      expect(app.remoteObjects()).to.eql({ color: Color });
    });

    it('uses singular name as shared class name', function() {
      var Color = DataModel.extend('color', {name: String});
      app.model(Color);
      Color.attachTo(db);
      var classes = app.remotes().classes().map(function(c) {return c.name});
      expect(classes).to.contain('color');
    });

    it.onServer('updates REST API when a new model is added', function(done) {
      app.use(loopback.rest());
      request(app).get('/colors').expect(404, function(err, res) {
        if (err) return done(err);
        var Color = DataModel.extend('color', {name: String});
        app.model(Color);
        Color.attachTo(db);
        request(app).get('/colors').expect(200, done);
      });
    });

    describe('in compat mode', function() {
      before(function() {
        loopback.compat.usePluralNamesForRemoting = true;
      });
      after(function() {
        loopback.compat.usePluralNamesForRemoting = false;
      });

      it('uses plural name as shared class name', function() {
        var Color = db.createModel('color', {name: String});
        app.model(Color);
        var classes = app.remotes().classes().map(function(c) {return c.name});
        expect(classes).to.contain('colors');
      });

      it('uses plural name as app.remoteObjects() key', function() {
        var Color = db.createModel('color', {name: String});
        app.model(Color);
        expect(app.remoteObjects()).to.eql({ colors: Color });
      });
    });
  });

  describe('app.model(name, config)', function () {
    var app;

    beforeEach(function() {
      app = loopback();
      app.boot({
        app: {port: 3000, host: '127.0.0.1'},
        // prevent loading of models.json, it is not available in the browser
        models: {},
        dataSources: {
          db: {
            connector: 'memory'
          }
        }
      });
    });

    it('Sugar for defining a fully built model', function () {
      app.model('foo', {
        dataSource: 'db'
      });

      var Foo = app.models.foo;
      var f = new Foo();

      assert(f instanceof loopback.Model);
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

  describe.onServer('app.boot([options])', function () {
    beforeEach(function () {
      app.boot({
        app: {
          port: 3000,
          host: '127.0.0.1',
          restApiRoot: '/rest-api',
          foo: {bar: 'bat'},
          baz: true
        },
        models: {
          'foo-bar-bat-baz': {
            options: {
              plural: 'foo-bar-bat-bazzies'
            },
            dataSource: 'the-db'
          }
        },
        dataSources: {
          'the-db': {
            connector: 'memory'
          }
        }
      });
    });

    it('should have port setting', function () {
      assert.equal(this.app.get('port'), 3000);
    });

    it('should have host setting', function() {
      assert.equal(this.app.get('host'), '127.0.0.1');
    });

    it('should have restApiRoot setting', function() {
      assert.equal(this.app.get('restApiRoot'), '/rest-api');
    });

    it('should have other settings', function () {
      expect(this.app.get('foo')).to.eql({
        bar: 'bat'
      });
      expect(this.app.get('baz')).to.eql(true);
    });

    describe('boot and models directories', function() {
      beforeEach(function() {
        var app = this.app = loopback();
        app.boot(SIMPLE_APP);
      });

      it('should run all modules in the boot directory', function () {
        assert(process.loadedFooJS);
        delete process.loadedFooJS;
      });

      it('should run all modules in the models directory', function () {
        assert(process.loadedBarJS);
        delete process.loadedBarJS;
      });
    });

    describe('PaaS and npm env variables', function() {
      beforeEach(function() {
        this.boot = function () {
          var app = loopback();
          app.boot({
            app: {
              port: undefined,
              host: undefined
            }
          });
          return app;
        }
      });

      it('should be honored', function() {
        var assertHonored = function (portKey, hostKey) {
          process.env[hostKey] = randomPort();
          process.env[portKey] = randomHost();
          var app = this.boot();
          assert.equal(app.get('port'), process.env[portKey]);
          assert.equal(app.get('host'), process.env[hostKey]);
          delete process.env[portKey];
          delete process.env[hostKey];
        }.bind(this);

        assertHonored('OPENSHIFT_SLS_PORT', 'OPENSHIFT_NODEJS_IP');
        assertHonored('npm_config_port', 'npm_config_host');
        assertHonored('npm_package_config_port', 'npm_package_config_host');
        assertHonored('OPENSHIFT_SLS_PORT', 'OPENSHIFT_SLS_IP');
        assertHonored('PORT', 'HOST');
      });

      it('should be honored in order', function() {
        process.env.npm_config_host = randomHost();
        process.env.OPENSHIFT_SLS_IP = randomHost();
        process.env.OPENSHIFT_NODEJS_IP = randomHost();
        process.env.HOST = randomHost();
        process.env.npm_package_config_host = randomHost();

        var app = this.boot();
        assert.equal(app.get('host'), process.env.npm_config_host);

        delete process.env.npm_config_host;
        delete process.env.OPENSHIFT_SLS_IP;
        delete process.env.OPENSHIFT_NODEJS_IP;
        delete process.env.HOST;
        delete process.env.npm_package_config_host;

        process.env.npm_config_port = randomPort();
        process.env.OPENSHIFT_SLS_PORT = randomPort();
        process.env.OPENSHIFT_NODEJS_PORT = randomPort();
        process.env.PORT = randomPort();
        process.env.npm_package_config_port = randomPort();

        var app = this.boot();
        assert.equal(app.get('host'), process.env.npm_config_host);
        assert.equal(app.get('port'), process.env.npm_config_port);

        delete process.env.npm_config_port;
        delete process.env.OPENSHIFT_SLS_PORT;
        delete process.env.OPENSHIFT_NODEJS_PORT;
        delete process.env.PORT;
        delete process.env.npm_package_config_port;
      });

      function randomHost() {
        return Math.random().toString().split('.')[1];
      }

      function randomPort() {
        return Math.floor(Math.random() * 10000);
      }

      it('should honor 0 for free port', function () {
        var app = loopback();
        app.boot({app: {port: 0}});
        assert.equal(app.get('port'), 0);
      });

      it('should default to port 3000', function () {
        var app = loopback();
        app.boot({app: {port: undefined}});
        assert.equal(app.get('port'), 3000);
      });
    });

    it('Instantiate models', function () {
      assert(app.models);
      assert(app.models.FooBarBatBaz);
      assert(app.models.fooBarBatBaz);
      assertValidDataSource(app.models.FooBarBatBaz.dataSource);
      assert.isFunc(app.models.FooBarBatBaz, 'find');
      assert.isFunc(app.models.FooBarBatBaz, 'create');
    });

    it('Attach models to data sources', function () {
      assert.equal(app.models.FooBarBatBaz.dataSource, app.dataSources.theDb);
    });

    it('Instantiate data sources', function () {
      assert(app.dataSources);
      assert(app.dataSources.theDb);
      assertValidDataSource(app.dataSources.theDb);
      assert(app.dataSources.TheDb);
    });
  });

  describe.onServer('app.boot(appRootDir)', function () {
    it('Load config files', function () {
      var app = loopback();

      app.boot(SIMPLE_APP);

      assert(app.models.foo);
      assert(app.models.Foo);
      assert(app.models.Foo.dataSource);
      assert.isFunc(app.models.Foo, 'find');
      assert.isFunc(app.models.Foo, 'create');
    });
  });

  describe.onServer('listen()', function() {
    it('starts http server', function(done) {
      var app = loopback();
      app.set('port', 0);
      app.get('/', function(req, res) { res.send(200, 'OK'); });

      var server = app.listen();

      expect(server).to.be.an.instanceOf(require('http').Server);

      request(server)
        .get('/')
        .expect(200, done);
    });

    it('updates port on "listening" event', function(done) {
      var app = loopback();
      app.set('port', 0);

      app.listen(function() {
        expect(app.get('port'), 'port').to.not.equal(0);
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
  });

  describe.onServer('app.get("/", loopback.status())', function () {
    it('should return the status of the application', function (done) {
      var app = loopback();
      app.get('/', loopback.status());
      request(app)
        .get('/')
        .expect(200)
        .end(function(err, res) {
          if(err) return done(err);

          assert.equal(typeof res.body, 'object');
          assert(res.body.started);
          // The number can be 0
          assert(res.body.uptime !== undefined);

          var elapsed = Date.now() - Number(new Date(res.body.started));

          // elapsed should be a positive number...
          assert(elapsed > 0);

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
});
