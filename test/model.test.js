var async = require('async');
var loopback = require('../');
var ACL = loopback.ACL;
var Change = loopback.Change;
var defineModelTestsWithDataSource = require('./util/model-tests');
var PersistedModel = loopback.PersistedModel;

var describe = require('./util/describe');

describe('Model / PersistedModel', function() {
  defineModelTestsWithDataSource({
    dataSource: {
      connector: loopback.Memory
    }
  });

  describe('Model.validatesUniquenessOf(property, options)', function() {
    it('Ensure the value for `property` is unique', function(done) {
      var User = PersistedModel.extend('ValidatedUser', {
        'first': String,
        'last': String,
        'age': Number,
        'password': String,
        'gender': String,
        'domain': String,
        'email': String
      });

      var dataSource = loopback.createDataSource({
        connector: loopback.Memory
      });

      User.attachTo(dataSource);

      User.validatesUniquenessOf('email', {message: 'email is not unique'});

      var joe = new User({email: 'joe@joe.com'});
      var joe2 = new User({email: 'joe@joe.com'});

      joe.save(function() {
        joe2.save(function(err) {
          assert(err, 'should get a validation error');
          assert(joe2.errors.email, 'model should have email error');

          done();
        });
      });
    });
  });

  describe('Model.attachTo(dataSource)', function() {
    it('Attach a model to a [DataSource](#data-source)', function() {
      var MyModel = loopback.createModel('my-model', {name: String});
      var dataSource = loopback.createDataSource({
        connector: loopback.Memory
      });

      MyModel.attachTo(dataSource);

      MyModel.find(function(err, results) {
        assert(results.length === 0, 'should have data access methods after attaching to a data source');
      });
    });
  });
});

describe.onServer('Remote Methods', function() {

  var User, Post;
  var dataSource;
  var app;

  beforeEach(function() {
    User = PersistedModel.extend('user', {
      id: { id: true, type: String, defaultFn: 'guid' },
      'first': String,
      'last': String,
      'age': Number,
      'password': String,
      'gender': String,
      'domain': String,
      'email': String
    }, {
      trackChanges: true
    });

    Post = PersistedModel.extend('post', {
      id: { id: true, type: String, defaultFn: 'guid' },
      title: String,
      content: String
    }, {
      trackChanges: true
    });

    dataSource = loopback.createDataSource({
      connector: loopback.Memory
    });

    User.attachTo(dataSource);
    Post.attachTo(dataSource);

    User.hasMany(Post);

    User.login = function(username, password, fn) {
      if (username === 'foo' && password === 'bar') {
        fn(null, 123);
      } else {
        throw new Error('bad username and password!');
      }
    };

    loopback.remoteMethod(
      User.login,
      {
        accepts: [
          {arg: 'username', type: 'string', required: true},
          {arg: 'password', type: 'string', required: true}
        ],
        returns: {arg: 'sessionId', type: 'any', root: true},
        http: {path: '/sign-in', verb: 'get'}
      }
    );

    app = loopback();
    app.use(loopback.rest());
    app.model(User);
  });

  describe('Model.destroyAll(callback)', function() {
    it('Delete all Model instances from data source', function(done) {
      (new TaskEmitter())
        .task(User, 'create', {first: 'jill'})
        .task(User, 'create', {first: 'bob'})
        .task(User, 'create', {first: 'jan'})
        .task(User, 'create', {first: 'sam'})
        .task(User, 'create', {first: 'suzy'})
        .on('done', function() {
          User.count(function(err, count) {
            User.destroyAll(function() {
              User.count(function(err, count) {
                assert.equal(count, 0);
                done();
              });
            });
          });
        });
    });
  });

  describe('Example Remote Method', function() {
    it('Call the method using HTTP / REST', function(done) {
      request(app)
        .get('/users/sign-in?username=foo&password=bar')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          assert.equal(res.body, 123);
          done();
        });
    });

    it('Converts null result of findById to 404 Not Found', function(done) {
      request(app)
        .get('/users/not-found')
        .expect(404)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          var errorResponse = res.body.error;
          assert(errorResponse);
          assert.equal(errorResponse.code, 'MODEL_NOT_FOUND');
          done();
        });
    });

    it('Call the findById with filter.fields using HTTP / REST', function(done) {
      request(app)
        .post('/users')
        .send({first: 'x', last: 'y'})
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          var userId = res.body.id;
          assert(userId);
          request(app)
            .get('/users/' + userId + '?filter[fields]=first')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
              if (err) return done(err);
              assert.equal(res.body.first, 'x', 'first should be x');
              assert(res.body.last === undefined, 'last should not be present');
              done();
            });
        });
    });

    it('Call the findById with filter.include using HTTP / REST', function(done) {
      request(app)
        .post('/users')
        .send({first: 'x', last: 'y'})
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          var userId = res.body.id;
          assert(userId);
          request(app)
            .post('/users/' + userId + '/posts')
            .send({title: 'T1', content: 'C1'})
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
              if (err) return done(err);
              var post = res.body;
              request(app)
                .get('/users/' + userId + '?filter[include]=posts')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err, res) {
                  if (err) return done(err);
                  assert.equal(res.body.first, 'x', 'first should be x');
                  assert.equal(res.body.last, 'y', 'last should be y');
                  assert.deepEqual(post, res.body.posts[0]);
                  done();
                });
            });
        });
    });

  });

  describe('Model.beforeRemote(name, fn)', function() {
    it('Run a function before a remote method is called by a client', function(done) {
      var hookCalled = false;

      User.beforeRemote('create', function(ctx, user, next) {
        hookCalled = true;
        next();
      });

      // invoke save
      request(app)
        .post('/users')
        .send({data: {first: 'foo', last: 'bar'}})
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          assert(hookCalled, 'hook wasnt called');
          done();
        });
    });
  });

  describe('Model.afterRemote(name, fn)', function() {
    it('Run a function after a remote method is called by a client', function(done) {
      var beforeCalled = false;
      var afterCalled = false;

      User.beforeRemote('create', function(ctx, user, next) {
        assert(!afterCalled);
        beforeCalled = true;
        next();
      });
      User.afterRemote('create', function(ctx, user, next) {
        assert(beforeCalled);
        afterCalled = true;
        next();
      });

      // invoke save
      request(app)
        .post('/users')
        .send({data: {first: 'foo', last: 'bar'}})
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          assert(beforeCalled, 'before hook was not called');
          assert(afterCalled, 'after hook was not called');
          done();
        });
    });
  });

  describe('Model.afterRemoteError(name, fn)', function() {
    it('runs the function when method fails', function(done) {
      var actualError = 'hook not called';
      User.afterRemoteError('login', function(ctx, next) {
        actualError = ctx.error;
        next();
      });

      request(app).get('/users/sign-in?username=bob&password=123')
        .end(function(err, res) {
          if (err) return done(err);
          expect(actualError)
            .to.have.property('message', 'bad username and password!');
          done();
        });
    });
  });

  describe('Remote Method invoking context', function() {
    describe('ctx.req', function() {
      it('The express ServerRequest object', function(done) {
        var hookCalled = false;

        User.beforeRemote('create', function(ctx, user, next) {
          hookCalled = true;
          assert(ctx.req);
          assert(ctx.req.url);
          assert(ctx.req.method);
          assert(ctx.res);
          assert(ctx.res.write);
          assert(ctx.res.end);
          next();
        });

        // invoke save
        request(app)
          .post('/users')
          .send({data: {first: 'foo', last: 'bar'}})
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            if (err) return done(err);
            assert(hookCalled);
            done();
          });
      });
    });

    describe('ctx.res', function() {
      it('The express ServerResponse object', function(done) {
        var hookCalled = false;

        User.beforeRemote('create', function(ctx, user, next) {
          hookCalled = true;
          assert(ctx.req);
          assert(ctx.req.url);
          assert(ctx.req.method);
          assert(ctx.res);
          assert(ctx.res.write);
          assert(ctx.res.end);
          next();
        });

        // invoke save
        request(app)
          .post('/users')
          .send({data: {first: 'foo', last: 'bar'}})
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            if (err) return done(err);
            assert(hookCalled);
            done();
          });
      });
    });
  });

  describe('Model.hasMany(Model)', function() {
    it('Define a one to many relationship', function(done) {
      var Book = dataSource.createModel('book', {title: String, author: String});
      var Chapter = dataSource.createModel('chapter', {title: String});

      // by referencing model
      Book.hasMany(Chapter);

      Book.create({title: 'Into the Wild', author: 'Jon Krakauer'}, function(err, book) {
        // using 'chapters' scope for build:
        var c = book.chapters.build({title: 'Chapter 1'});
        book.chapters.create({title: 'Chapter 2'}, function() {
          c.save(function() {
            Chapter.count({bookId: book.id}, function(err, count) {
              assert.equal(count, 2);
              book.chapters({where: {title: 'Chapter 1'}}, function(err, chapters) {
                assert.equal(chapters.length, 1);
                assert.equal(chapters[0].title, 'Chapter 1');
                done();
              });
            });
          });
        });
      });
    });
  });

  describe('Model.properties', function() {
    it('Normalized properties passed in originally by loopback.createModel()', function() {
      var props = {
        s: String,
        n: {type: 'Number'},
        o: {type: 'String', min: 10, max: 100},
        d: Date,
        g: loopback.GeoPoint
      };

      var MyModel = loopback.createModel('foo', props);

      Object.keys(MyModel.definition.properties).forEach(function(key) {
        var p = MyModel.definition.properties[key];
        var o = MyModel.definition.properties[key];
        assert(p);
        assert(o);
        assert(typeof p.type === 'function');

        if (typeof o === 'function') {
          // the normalized property
          // should match the given property
          assert(
            p.type.name === o.name ||
            p.type.name === o
          );
        }
      });
    });
  });

  describe('Model.extend()', function() {
    it('Create a new model by extending an existing model', function() {
      var User = loopback.PersistedModel.extend('test-user', {
        email: String
      });

      User.foo = function() {
        return 'bar';
      };

      User.prototype.bar = function() {
        return 'foo';
      };

      var MyUser = User.extend('my-user', {
        a: String,
        b: String
      });

      assert.equal(MyUser.prototype.bar, User.prototype.bar);
      assert.equal(MyUser.foo, User.foo);

      var user = new MyUser({
        email: 'foo@bar.com',
        a: 'foo',
        b: 'bar'
      });

      assert.equal(user.email, 'foo@bar.com');
      assert.equal(user.a, 'foo');
      assert.equal(user.b, 'bar');
    });
  });

  describe('Model.extend() events', function() {
    it('create isolated emitters for subclasses', function() {
      var User1 = loopback.createModel('User1', {
        'first': String,
        'last': String
      });

      var User2 = loopback.createModel('User2', {
        'name': String
      });

      var user1Triggered = false;
      User1.once('x', function(event) {
        user1Triggered = true;
      });

      var user2Triggered = false;
      User2.once('x', function(event) {
        user2Triggered = true;
      });

      assert(User1.once !== User2.once);
      assert(User1.once !== loopback.Model.once);

      User1.emit('x', User1);

      assert(user1Triggered);
      assert(!user2Triggered);
    });

  });

  describe('Model.checkAccessTypeForMethod(remoteMethod)', function() {
    shouldReturn('create', ACL.WRITE);
    shouldReturn('updateOrCreate', ACL.WRITE);
    shouldReturn('upsert', ACL.WRITE);
    shouldReturn('exists', ACL.READ);
    shouldReturn('findById', ACL.READ);
    shouldReturn('find', ACL.READ);
    shouldReturn('findOne', ACL.READ);
    shouldReturn('destroyById', ACL.WRITE);
    shouldReturn('deleteById', ACL.WRITE);
    shouldReturn('removeById', ACL.WRITE);
    shouldReturn('count', ACL.READ);
    shouldReturn('unkown-model-method', ACL.EXECUTE);

    function shouldReturn(methodName, expectedAccessType) {
      describe(methodName, function() {
        it('should return ' + expectedAccessType, function() {
          var remoteMethod = {name: methodName};
          assert.equal(
            User._getAccessTypeForMethod(remoteMethod),
            expectedAccessType
          );
        });
      });
    }
  });

  describe('Model.getChangeModel()', function() {
    it('Get the Change Model', function() {
      var UserChange = User.getChangeModel();
      var change = new UserChange();
      assert(change instanceof Change);
    });
  });

  describe('Model.getSourceId(callback)', function() {
    it('Get the Source Id', function(done) {
      User.getSourceId(function(err, id) {
        assert.equal('memory-user', id);
        done();
      });
    });
  });

  describe('Model.checkpoint(callback)', function() {
    it('Create a checkpoint', function(done) {
      var Checkpoint = User.getChangeModel().getCheckpointModel();
      var tasks = [
        getCurrentCheckpoint,
        checkpoint
      ];
      var result;
      var current;

      async.series(tasks, function(err) {
        if (err) return done(err);

        assert.equal(result, current + 1);
        done();
      });

      function getCurrentCheckpoint(cb) {
        Checkpoint.current(function(err, cp) {
          current = cp;
          cb(err);
        });
      }

      function checkpoint(cb) {
        User.checkpoint(function(err, cp) {
          result = cp.seq;
          cb(err);
        });
      }
    });
  });

  describe('Model._getACLModel()', function() {
    it('should return the subclass of ACL', function() {
      var Model = require('../').Model;
      var originalValue = Model._ACL();
      var acl = ACL.extend('acl');
      Model._ACL(null); // Reset the ACL class for the base model
      var model = Model._ACL();
      Model._ACL(originalValue); // Reset the value back
      assert.equal(model, acl);
    });
  });

  describe('PersistedModel remote methods', function() {
    it('includes all aliases', function() {
      var app = loopback();
      var model = PersistedModel.extend('PersistedModelForAliases');
      app.dataSource('db', { connector: 'memory' });
      app.model(model, { dataSource: 'db' });

      // this code is used by loopback-sdk-angular codegen
      var metadata = app.handler('rest')
        .adapter
        .getClasses()
        .filter(function(c) { return c.name === model.modelName; })[0];

      var methodNames = [];
      metadata.methods.forEach(function(method) {
        methodNames.push(method.name);
        methodNames = methodNames.concat(method.sharedMethod.aliases || []);
      });

      expect(methodNames).to.have.members([
        // NOTE(bajtos) These three methods are disabled by default
        // Because all tests share the same global registry model
        // and one of the tests was enabling remoting of "destroyAll",
        // this test was seeing this method (with all aliases) as public
        // 'destroyAll', 'deleteAll', 'remove',
        'create',
        'upsert', 'updateOrCreate',
        'exists',
        'findById',
        'find',
        'findOne',
        'updateAll', 'update',
        'deleteById',
        'destroyById',
        'removeById',
        'count',
        'prototype.updateAttributes',
        'createChangeStream'
      ]);
    });
  });

  describe('Model.getApp(cb)', function() {
    var app, TestModel;
    beforeEach(function setup() {
      app = loopback();
      TestModel = loopback.createModel('TestModelForGetApp'); // unique name
      app.dataSource('db', { connector: 'memory' });
    });

    it('calls the callback when already attached', function(done) {
      app.model(TestModel, { dataSource: 'db' });
      TestModel.getApp(function(err, a) {
        if (err) return done(err);
        expect(a).to.equal(app);
        done();
      });
      // fails on time-out when not implemented correctly
    });

    it('calls the callback after attached', function(done) {
      TestModel.getApp(function(err, a) {
        if (err) return done(err);
        expect(a).to.equal(app);
        done();
      });
      app.model(TestModel, { dataSource: 'db' });
      // fails on time-out when not implemented correctly
    });
  });
});
