var path = require('path');
var SIMPLE_APP = path.join(__dirname, 'fixtures', 'simple-app');

describe('app', function() {

  describe('app.model(Model)', function() {
    it("Expose a `Model` to remote clients", function() {
      var app = loopback();
      var memory = loopback.createDataSource({connector: loopback.Memory});
      var Color = memory.createModel('color', {name: String});
      app.model(Color);
      assert.equal(app.models().length, 1);
    });
  });

  describe('app.model(name, properties, options)', function () {
    it('Sugar for defining a fully built model', function () {
      var app = loopback();
      app.boot({
        app: {port: 3000, host: '127.0.0.1'},
        dataSources: {
          db: {
            connector: 'memory'
          }
        }
      });

      app.model('foo', {
        dataSource: 'db'
      });

      var Foo = app.models.foo;
      var f = new Foo;

      assert(f instanceof loopback.Model);
    });
  });

  describe('app.boot([options])', function () {
    beforeEach(function () {
      var app = this.app = loopback();

      app.boot({
        app: {
          port: 3000, 
          host: '127.0.0.1',
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

        process.env.npm_config_port = randomPort();
        process.env.OPENSHIFT_SLS_PORT = randomPort();
        process.env.OPENSHIFT_NODEJS_PORT = randomPort();
        process.env.PORT = randomPort();
        process.env.npm_package_config_port = randomPort();

        var app = this.boot();
        assert.equal(app.get('host'), process.env.npm_config_host);
        assert.equal(app.get('port'), process.env.npm_config_port);
      });

      function randomHost() {
        return Math.random().toString().split('.')[1];
      }

      function randomPort() {
        return Math.floor(Math.random() * 10000);
      }
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

  describe('app.boot(appRootDir)', function () {
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

  describe('app.get("/", loopback.status())', function () {
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
          assert(res.body.uptime);

          var elapsed = Date.now() - Number(new Date(res.body.started));

          // elapsed should be a positive number...
          assert(elapsed > 0);

          // less than 100 milliseconds
          assert(elapsed < 100);

          done();
        });
    });
  });
});
