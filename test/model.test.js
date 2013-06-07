describe('Model', function() {

  describe('Model.validatesPresenceOf(properties...)', function() {
    it("Require a model to include a property to be considered valid.", function(done) {
      /* example - 
      User.validatesPresenceOf('first', 'last', 'age');
      */
      done(new Error('test not implemented'));
    });
  });

  describe('Model.validatesLengthOf(property, options)', function() {
    it("Require a property length to be within a specified range.", function(done) {
      /* example - 
      User.validatesLengthOf('password', {min: 5, message: {min: 'Password is too short'}});
      */
      done(new Error('test not implemented'));
    });
  });

  describe('Model.validatesInclusionOf(property, options)', function() {
    it("Require a value for `property` to be in the specified array.", function(done) {
      /* example - 
      User.validatesInclusionOf('gender', {in: ['male', 'female']});
      */
      done(new Error('test not implemented'));
    });
  });

  describe('Model.validatesExclusionOf(property, options)', function() {
    it("Require a value for `property` to not exist in the specified array.", function(done) {
      /* example - 
      User.validatesExclusionOf('domain', {in: ['www', 'billing', 'admin']});
      */
      done(new Error('test not implemented'));
    });
  });

  describe('Model.validatesNumericalityOf(property, options)', function() {
    it("Require a value for `property` to be a specific type of `Number`.", function(done) {
      /* example - 
      User.validatesNumericalityOf('age', {int: true});
      */
      done(new Error('test not implemented'));
    });
  });

  describe('Model.validatesUniquenessOf(property, options)', function() {
    it("Ensure the value for `property` is unique.", function(done) {
      /* example - 
      User.validatesUniquenessOf('email', {message: 'email is not unique'});
      */
      done(new Error('test not implemented'));
    });
  });

  describe('myModel.isValid()', function() {
    it("Validate the model instance.", function(done) {
      /* example - 
      user.isValid(function (valid) {
          if (!valid) {
              user.errors // hash of errors {attr: [errmessage, errmessage, ...], attr: ...}    
          }
      });
      */
      done(new Error('test not implemented'));
    });
  });

  describe('Model.attachTo(dataSource)', function() {
    it("Attach a model to a [DataSource](#data-source)", function(done) {
      /* example - 
      var oracle = asteroid.createDataSource({
        connector: 'oracle',
        host: '111.22.333.44',
        database: 'MYDB',
        username: 'username',
        password: 'password'
      });
      User.attachTo(oracle);
      
      */
      done(new Error('test not implemented'));
    });
  });

  describe('Model.create([data], [callback])', function() {
    it("Create an instance of Model with given data and save to the attached data source.", function(done) {
      /* example - 
      User.create({first: 'Joe', last: 'Bob'}, function(err, user) {
        console.log(user instanceof User); // true
      });
      */
      done(new Error('test not implemented'));
    });
  });

  describe('model.save([options], [callback])', function() {
    it("Save an instance of a Model to the attached data source.", function(done) {
      /* example - 
      var joe = new User({first: 'Joe', last: 'Bob'});
      joe.save(function(err, user) {
        if(user.errors) {
          console.log(user.errors);
        } else {
          console.log(user.id);
        }
      });
      */
      done(new Error('test not implemented'));
    });
  });

  describe('model.updateAttributes(data, [callback])', function() {
    it("Save specified attributes to the attached data source.", function(done) {
      /* example - 
      
      user.updateAttributes({
        first: 'updatedFirst',
        name: 'updatedLast'
      }, fn);
      */
      done(new Error('test not implemented'));
    });
  });

  describe('model.upsert(data, callback)', function() {
    it("Update when record with id=data.id found, insert otherwise", function(done) {
      /* example - 
      
      */
      done(new Error('test not implemented'));
    });
  });

  describe('model.destroy([callback])', function() {
    it("Remove a model from the attached data source.", function(done) {
      /* example - 
      model.destroy(function(err) {
        // model instance destroyed
      });
      
      */
      done(new Error('test not implemented'));
    });
  });

  describe('Model.destroyAll(callback)', function() {
    it("Delete all Model instances from data source", function(done) {
      done(new Error('test not implemented'));
    });
  });

  describe('Model.find(id, callback)', function() {
    it("Find instance by id.", function(done) {
      /* example - 
      User.find(23, function(err, user) {
        console.info(user.id); // 23
      });
      User.all({where: {age: {gt: 21}}, order: 'age DESC', limit: 10, skip: 10})
      */
      done(new Error('test not implemented'));
    });
  });

  describe('Model.count([query], callback)', function() {
    it("Query count of Model instances in data source", function(done) {
      /* example - 
      User.count({approved: true}, function(err, count) {
        console.log(count); // 2081
      });
      User.login = function (username, password, fn) {
        var passwordHash = hashPassword(password);
        this.findOne({username: username}, function (err, user) {
          var failErr = new Error('login failed');
      
          if(err) {
            fn(err);
          } else if(!user) {
            fn(failErr);
          } else if(user.password === passwordHash) {
            MySessionModel.create({userId: user.id}, function (err, session) {
              fn(null, session.id);
            });
          } else {
            fn(failErr);
          }
        });
      }
      
      asteroid.remoteMethod(
        User,
        User.login,
        {
          accepts: [
            {arg: 'username', type: 'string', required: true},
            {arg: 'password', type: 'string', required: true}
          ],
          returns: {arg: 'sessionId', type: 'any'},
          http: {path: '/sign-in'}
        }
      );
      
      User.prototype.logout = function (fn) {
        MySessionModel.destroyAll({userId: this.id}, fn);
      }
      
      asteroid.remoteMethod(User, User.prototype.logout);
      */
      done(new Error('test not implemented'));
    });
  });

  describe('ctx.me', function() {
    it("The id of the user calling the method remotely", function(done) {
      done(new Error('test not implemented'));
    });
  });

  describe('ctx.req', function() {
    it("The express ServerRequest object", function(done) {
      done(new Error('test not implemented'));
    });
  });

  describe('ctx.res', function() {
    it("The express ServerResponse object", function(done) {
      /* example - 
      
      */
      done(new Error('test not implemented'));
    });
  });

  describe('Model.hasMany(Model)', function() {
    it("Define a one to many relationship.", function(done) {
      /* example - 
      // by referencing model
      Book.hasMany(Chapter);
      // specify the name
      Book.hasMany('chapters', {model: Chapter});
      
      Book.create(function(err, book) {
        // using 'chapters' scope for build:
        var c = book.chapters.build({name: 'Chapter 1'});
        
        // same as:
        c = new Chapter({name: 'Chapter 1', bookId: book.id});
        
        // using 'chapters' scope for create:
        book.chapters.create();
        
        // same as:
        Chapter.create({bookId: book.id});
        // using scope for querying:
        book.chapters(function(err, chapters) {
          // all chapters with bookId = book.id
        });
        
        book.chapters({where: {name: 'test'}}, function(err, chapters) {
          // all chapters with bookId = book.id and name = 'test'
        });
      });
      
      */
      done(new Error('test not implemented'));
    });
  });

  describe('Model.hasAndBelongsToMany()', function() {
    it("TODO: implement / document", function(done) {
      /* example - 
      
      */
      done(new Error('test not implemented'));
    });
  });

  describe('Model.availableHooks()', function() {
    it("Return a list of available hooks.", function(done) {
      /* example - 
      console.log(User.availableHooks()); // ['save', ...]
      
      */
      done(new Error('test not implemented'));
    });
  });

  describe('Model.availableMethods()', function() {
    it("Returns the currently available api of a model as well as descriptions of any modified behavior or methods from attached data sources.", function(done) {
      /* example - 
      User.attachTo(oracle);
      console.log(User.availableMethods());
      
      {
        'User.all': {
          accepts: [{arg: 'filter', type: 'object', description: '...'}],
          returns: [{arg: 'users', type: ['User']}]
        },
        'User.find': {
          accepts: [{arg: 'id', type: 'any'}],
          returns: [{arg: 'items', type: 'User'}]
        },
        ...
      }
      var oracle = asteroid.createDataSource({
        connector: 'oracle',
        host: '111.22.333.44',
        database: 'MYDB',
        username: 'username',
        password: 'password'
      });
      
      */
      done(new Error('test not implemented'));
    });
  });
});