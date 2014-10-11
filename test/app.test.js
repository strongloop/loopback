var path = require('path');
var SIMPLE_APP = path.join(__dirname, 'fixtures', 'simple-app');
var loopback = require('../');
var PersistedModel = loopback.PersistedModel;

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
      var classes = app.remotes().classes().map(function(c) {return c.name});
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

    it("emits a `modelRemoted` event", function() {
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

    it('should not require dataSource', function() {
      app.model('MyTestModel', {});
    });

  });

  describe('app.model(name, config)', function () {
    var app;

    beforeEach(function() {
      app = loopback();
      app.dataSource('db', {
        connector: 'memory'
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
      app.dataSource('db', { connector: 'memory' });
      var TestModel = loopback.Model.extend('TestModel');
      // TestModel was most likely already defined in a different test,
      // thus TestModel.dataSource may be already set
      delete TestModel.dataSource;

      app.model(TestModel, { dataSource: 'db' });

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

    it('updates port on "listening" event', function(done) {
      var app = loopback();
      app.set('port', 0);

      app.listen(function() {
        expect(app.get('port'), 'port').to.not.equal(0);
        done();
      });
    });

    it('updates "url" on "listening" event', function(done) {
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

  it('exposes loopback as a property', function() {
    var app = loopback();
    expect(app.loopback).to.equal(loopback);
  });

  describe('normalizeHttpPath option', function() {
    var app, db;
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
