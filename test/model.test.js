describe('Model', function() {

  var User, memory;

  beforeEach(function () {
    memory = loopback.createDataSource({connector: loopback.Memory});
    User = memory.createModel('user', {
      'first': String,
      'last': String,
      'age': Number,
      'password': String,
      'gender': String,
      'domain': String,
      'email': String
    });
  });

  describe('Model.validatesPresenceOf(properties...)', function() {
    it("Require a model to include a property to be considered valid", function() {
      User.validatesPresenceOf('first', 'last', 'age');
      var joe = new User({first: 'joe'});
      assert(joe.isValid() === false, 'model should not validate');
      assert(joe.errors.last, 'should have a missing last error');
      assert(joe.errors.age, 'should have a missing age error');
    });
  });

  describe('Model.validatesLengthOf(property, options)', function() {
    it("Require a property length to be within a specified range", function() {
      User.validatesLengthOf('password', {min: 5, message: {min: 'Password is too short'}});
      var joe = new User({password: '1234'});
      assert(joe.isValid() === false, 'model should not be valid');
      assert(joe.errors.password, 'should have password error');
    });
  });

  describe('Model.validatesInclusionOf(property, options)', function() {
    it("Require a value for `property` to be in the specified array", function() {
      User.validatesInclusionOf('gender', {in: ['male', 'female']});
      var foo = new User({gender: 'bar'});
      assert(foo.isValid() === false, 'model should not be valid');
      assert(foo.errors.gender, 'should have gender error');
    });
  });

  describe('Model.validatesExclusionOf(property, options)', function() {
    it("Require a value for `property` to not exist in the specified array", function() {
      User.validatesExclusionOf('domain', {in: ['www', 'billing', 'admin']});
      var foo = new User({domain: 'www'});
      var bar = new User({domain: 'billing'});
      var bat = new User({domain: 'admin'});
      assert(foo.isValid() ===  false);
      assert(bar.isValid() === false);
      assert(bat.isValid() === false);
      assert(foo.errors.domain, 'model should have a domain error');
      assert(bat.errors.domain, 'model should have a domain error');
      assert(bat.errors.domain, 'model should have a domain error');
    });
  });

  describe('Model.validatesNumericalityOf(property, options)', function() {
    it("Require a value for `property` to be a specific type of `Number`", function() {
      User.validatesNumericalityOf('age', {int: true});
      var joe = new User({age: 10.2});
      assert(joe.isValid() === false);
      var bob = new User({age: 0});
      assert(bob.isValid() === true);
      assert(joe.errors.age, 'model should have an age error');
    });
  });

  describe('Model.validatesUniquenessOf(property, options)', function() {
    it("Ensure the value for `property` is unique", function(done) {
      User.validatesUniquenessOf('email', {message: 'email is not unique'});
      
      var joe = new User({email: 'joe@joe.com'});
      var joe2 = new User({email: 'joe@joe.com'});
      
      joe.save(function () {
        joe2.save(function (err) {
          assert(err, 'should get a validation error');
          assert(joe2.errors.email, 'model should have email error');
          
          done();
        });
      });
    });
  });

  describe('myModel.isValid()', function() {
    it("Validate the model instance", function() {
      User.validatesNumericalityOf('age', {int: true});
      var user = new User({first: 'joe', age: 'flarg'})
      var valid = user.isValid();
      assert(valid === false);
      assert(user.errors.age, 'model should have age error');
    });
    
    it('Asynchronously validate the model', function(done) {
      User.validatesNumericalityOf('age', {int: true});
      var user = new User({first: 'joe', age: 'flarg'})
      user.isValid(function (valid) {
        assert(valid === false);
        assert(user.errors.age, 'model should have age error');
        done();
      });
    });
  });

  describe('Model.attachTo(dataSource)', function() {
    it("Attach a model to a [DataSource](#data-source)", function() {
      var MyModel = loopback.createModel('my-model', {name: String});
      
      assert(MyModel.find === undefined, 'should not have data access methods');
      
      MyModel.attachTo(memory);
      
      assert(typeof MyModel.find === 'function', 'should have data access methods after attaching to a data source');
    });
  });

  describe('Model.create([data], [callback])', function() {
    it("Create an instance of Model with given data and save to the attached data source", function(done) {
      User.create({first: 'Joe', last: 'Bob'}, function(err, user) {
        assert(user instanceof User);
        done();
      });
    });
  });

  describe('model.save([options], [callback])', function() {
    it("Save an instance of a Model to the attached data source", function(done) {
      var joe = new User({first: 'Joe', last: 'Bob'});
      joe.save(function(err, user) {
        assert(user.id);
        assert(!err);
        assert(!user.errors);
        done();
      });
    });
  });

  describe('model.updateAttributes(data, [callback])', function() {
    it("Save specified attributes to the attached data source", function(done) {
      User.create({first: 'joe', age: 100}, function (err, user) {
        assert(!err);
        assert.equal(user.first, 'joe');
        
        user.updateAttributes({
          first: 'updatedFirst',
          last: 'updatedLast'
        }, function (err, updatedUser) {
          assert(!err);
          assert.equal(updatedUser.first, 'updatedFirst');
          assert.equal(updatedUser.last, 'updatedLast');
          assert.equal(updatedUser.age, 100);
          done();
        });
      });
    });
  });

  describe('Model.upsert(data, callback)', function() {
    it("Update when record with id=data.id found, insert otherwise", function(done) {
      User.upsert({first: 'joe', id: 7}, function (err, user) {
        assert(!err);
        assert.equal(user.first, 'joe');
        
        User.upsert({first: 'bob', id: 7}, function (err, updatedUser) {
          assert(!err);
          assert.equal(updatedUser.first, 'bob');
          done();
        });
      });
    });
  });

  describe('model.destroy([callback])', function() {
    it("Remove a model from the attached data source", function(done) {
      User.create({first: 'joe', last: 'bob'}, function (err, user) {
        User.findById(user.id, function (err, foundUser) {
          assert.equal(user.id, foundUser.id);
          foundUser.destroy(function () {
            User.findById(user.id, function (err, notFound) {
              assert(!err);
              assert.equal(notFound, null);
              done();
            });
          });
        });
      });
    });
  });

    describe('Model.deleteById([callback])', function () {
        it("Delete a model instance from the attached data source", function (done) {
            User.create({first: 'joe', last: 'bob'}, function (err, user) {
                User.deleteById(user.id, function (err) {
                    User.findById(user.id, function (err, notFound) {
                        assert(!err);
                        assert.equal(notFound, null);
                        done();
                    });
                });
            });
        });
    });

    describe('Model.destroyAll(callback)', function() {
    it("Delete all Model instances from data source", function(done) {
      (new TaskEmitter())
        .task(User, 'create', {first: 'jill'})
        .task(User, 'create', {first: 'bob'})
        .task(User, 'create', {first: 'jan'})
        .task(User, 'create', {first: 'sam'})
        .task(User, 'create', {first: 'suzy'})
        .on('done', function () {
          User.count(function (err, count) {
            assert.equal(count, 5);
            User.destroyAll(function () {
              User.count(function (err, count) {
                assert.equal(count, 0);
                done();
              });
            });
          });
        });
    });
  });

  describe('Model.findById(id, callback)', function() {
    it("Find an instance by id", function(done) {
      User.create({first: 'michael', last: 'jordan', id: 23}, function () {
        User.findById(23, function (err, user) {
          assert.equal(user.id, 23);
          assert.equal(user.first, 'michael');
          assert.equal(user.last, 'jordan');
          done();
        });
      });
    });
  });

  describe('Model.count([query], callback)', function() {
    it("Query count of Model instances in data source", function(done) {
      (new TaskEmitter())
        .task(User, 'create', {first: 'jill', age: 100})
        .task(User, 'create', {first: 'bob', age: 200})
        .task(User, 'create', {first: 'jan'})
        .task(User, 'create', {first: 'sam'})
        .task(User, 'create', {first: 'suzy'})
        .on('done', function () {
          User.count({age: {gt: 99}}, function (err, count) {
            assert.equal(count, 2);
            done();
          });
        });
    });
  });

  describe('Remote Methods', function(){
    beforeEach(function () {
      User.login = function (username, password, fn) {
        if(username === 'foo' && password === 'bar') {
          fn(null, 123);
        } else {
          throw new Error('bad username and password!');
        }
      }

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
      
      app.use(loopback.rest());
      app.model(User);
    });
    
    describe('Example Remote Method', function () {
      it('Call the method using HTTP / REST', function(done) {
        request(app)
          .get('/users/sign-in?username=foo&password=bar')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res){
            if(err) return done(err);
            assert.equal(res.body, 123);
            done();
          });
      });
    });
  
    describe('Model.beforeRemote(name, fn)', function(){
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
            if(err) return done(err);
            assert(hookCalled, 'hook wasnt called');
            done();
          });
      });
    });
  
    describe('Model.afterRemote(name, fn)', function(){
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
            if(err) return done(err);
            assert(beforeCalled, 'before hook was not called');
            assert(afterCalled, 'after hook was not called');
            done();
          });
      });
    });
  
    describe('Remote Method invoking context', function () {
      // describe('ctx.user', function() {
      //   it("The remote user model calling the method remotely", function(done) {
      //     done(new Error('test not implemented'));
      //   });
      // });

      describe('ctx.req', function() {
        it("The express ServerRequest object", function(done) {
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
              if(err) return done(err);
              assert(hookCalled);
              done();
            });
        });
      });

      describe('ctx.res', function() {
        it("The express ServerResponse object", function(done) {
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
              if(err) return done(err);
              assert(hookCalled);
              done();
            });
        });
      });
    })
  });

  describe('Model.hasMany(Model)', function() {
    it("Define a one to many relationship", function(done) {
      var Book = memory.createModel('book', {title: String, author: String});
      var Chapter = memory.createModel('chapter', {title: String});
      
      // by referencing model
      Book.hasMany(Chapter);
      
      Book.create({title: 'Into the Wild', author: 'Jon Krakauer'}, function(err, book) {
        // using 'chapters' scope for build:
        var c = book.chapters.build({title: 'Chapter 1'});
        book.chapters.create({title: 'Chapter 2'}, function () {
          c.save(function () {
            Chapter.count({bookId: book.id}, function (err, count) {
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
  
  describe('Model.properties', function(){
    it('Normalized properties passed in originally by loopback.createModel()', function() {
      var props = {
        s: String,
        n: {type: 'Number'},
        o: {type: 'String', min: 10, max: 100},
        d: Date,
        g: loopback.GeoPoint
      };
      
      var MyModel = loopback.createModel('foo', props);
      
      Object.keys(MyModel.definition.properties).forEach(function (key) {
        var p = MyModel.definition.properties[key];
        var o = MyModel.definition.properties[key];
        assert(p);
        assert(o);
        assert(typeof p.type === 'function');
        
        if(typeof o === 'function') {
          // the normalized property
          // should match the given property
          assert(
            p.type.name === o.name
            ||
            p.type.name === o
          )
        }
      });
    });
  });
    
  describe('Model.extend()', function(){
    it('Create a new model by extending an existing model', function() {
      var User = loopback.Model.extend('test-user', {
        email: String
      });
      
      User.foo = function () {
        return 'bar';
      }
      
      User.prototype.bar = function () {
        return 'foo';
      }
      
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

  // describe('Model.hasAndBelongsToMany()', function() {
  //   it("TODO: implement / document", function(done) {
  //     /* example - 
  //     
  //     */
  //     done(new Error('test not implemented'));
  //   });
  // });

  // describe('Model.remoteMethods()', function() {
  //   it("Return a list of enabled remote methods", function() {
  //     app.model(User);
  //     User.remoteMethods(); // ['save', ...]
  //   });
  // });

  // describe('Model.availableMethods()', function() {
  //   it("Returns the currently available api of a model as well as descriptions of any modified behavior or methods from attached data sources", function(done) {
  //     /* example - 
  //     User.attachTo(oracle);
  //     console.log(User.availableMethods());
  //     
  //     {
  //       'User.all': {
  //         accepts: [{arg: 'filter', type: 'object', description: '...'}],
  //         returns: [{arg: 'users', type: ['User']}]
  //       },
  //       'User.find': {
  //         accepts: [{arg: 'id', type: 'any'}],
  //         returns: [{arg: 'items', type: 'User'}]
  //       },
  //       ...
  //     }
  //     var oracle = loopback.createDataSource({
  //       connector: 'oracle',
  //       host: '111.22.333.44',
  //       database: 'MYDB',
  //       username: 'username',
  //       password: 'password'
  //     });
  //     
  //     */
  //     done(new Error('test not implemented'));
  //   });
  // });
  
//   describe('Model.before(name, fn)', function(){
//     it('Run a function before a method is called', function() {
//       // User.before('save', function(user, next) {
// //         console.log('about to save', user);
// //         
// //         next();
// //       });
// //       
// //       User.before('delete', function(user, next) {
// //         // prevent all delete calls
// //         next(new Error('deleting is disabled'));
// //       });
// //       User.beforeRemote('save', function(ctx, user, next) {
// //         if(ctx.user.id === user.id) {
// //           next();
// //         } else {
// //           next(new Error('must be logged in to update'))
// //         }
// //       });
// 
//       throw new Error('not implemented');
//     });
//   });
//   
//   describe('Model.after(name, fn)', function(){
//     it('Run a function after a method is called', function() {
// 
//       throw new Error('not implemented');
//     });
//   });
});
