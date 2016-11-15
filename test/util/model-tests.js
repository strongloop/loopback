// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var assert = require('assert');
var async = require('async');
var describe = require('./describe');
var loopback = require('../../');
var ACL = loopback.ACL;
var Change = loopback.Change;
var PersistedModel = loopback.PersistedModel;
var RemoteObjects = require('strong-remoting');
var TaskEmitter = require('strong-task-emitter');

module.exports = function defineModelTestsWithDataSource(options) {
  describe('Model Tests', function() {
    var User, dataSource;

    if (options.beforeEach) {
      beforeEach(options.beforeEach);
    }

    beforeEach(function() {
      var test = this;

      // setup a model / datasource
      dataSource = this.dataSource || loopback.createDataSource(options.dataSource);

      var extend = PersistedModel.extend;

      // create model hook
      PersistedModel.extend = function() {
        var extendedModel = extend.apply(PersistedModel, arguments);

        if (options.onDefine) {
          options.onDefine.call(test, extendedModel);
        }

        return extendedModel;
      };

      User = PersistedModel.extend('UtilUser', {
        id: {id: true, type: String, defaultFn: 'guid'},
        'first': String,
        'last': String,
        'age': Number,
        'password': String,
        'gender': String,
        'domain': String,
        'email': String,
      }, {
        trackChanges: options.trackChanges !== false,
        enableRemoteReplication: options.enableRemoteReplication,
      });

      User.attachTo(dataSource);
      User.handleChangeError = function(err) {
        console.warn('WARNING: unhandled change-tracking error');
        console.warn(err);
      };
    });

    describe('Model.validatesPresenceOf(properties...)', function() {
      it('Require a model to include a property to be considered valid', function() {
        User.validatesPresenceOf('first', 'last', 'age');
        var joe = new User({first: 'joe'});
        assert(joe.isValid() === false, 'model should not validate');
        assert(joe.errors.last, 'should have a missing last error');
        assert(joe.errors.age, 'should have a missing age error');
      });
    });

    describe('Model.validatesLengthOf(property, options)', function() {
      it('Require a property length to be within a specified range', function() {
        User.validatesLengthOf('password', {min: 5, message: {min: 'Password is too short'}});
        var joe = new User({password: '1234'});
        assert(joe.isValid() === false, 'model should not be valid');
        assert(joe.errors.password, 'should have password error');
      });
    });

    describe('Model.validatesInclusionOf(property, options)', function() {
      it('Require a value for `property` to be in the specified array', function() {
        User.validatesInclusionOf('gender', {in: ['male', 'female']});
        var foo = new User({gender: 'bar'});
        assert(foo.isValid() === false, 'model should not be valid');
        assert(foo.errors.gender, 'should have gender error');
      });
    });

    describe('Model.validatesExclusionOf(property, options)', function() {
      it('Require a value for `property` to not exist in the specified array', function() {
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
      it('Require a value for `property` to be a specific type of `Number`', function() {
        User.validatesNumericalityOf('age', {int: true});
        var joe = new User({age: 10.2});
        assert(joe.isValid() === false);
        var bob = new User({age: 0});
        assert(bob.isValid() === true);
        assert(joe.errors.age, 'model should have an age error');
      });
    });

    describe('myModel.isValid()', function() {
      it('Validate the model instance', function() {
        User.validatesNumericalityOf('age', {int: true});
        var user = new User({first: 'joe', age: 'flarg'});
        var valid = user.isValid();
        assert(valid === false);
        assert(user.errors.age, 'model should have age error');
      });

      it('Asynchronously validate the model', function(done) {
        User.validatesNumericalityOf('age', {int: true});
        var user = new User({first: 'joe', age: 'flarg'});
        user.isValid(function(valid) {
          assert(valid === false);
          assert(user.errors.age, 'model should have age error');

          done();
        });
      });
    });

    describe('Model.create([data], [callback])', function() {
      it('Create an instance of Model with given data and save to the attached data source',
      function(done) {
        User.create({first: 'Joe', last: 'Bob'}, function(err, user) {
          assert(user instanceof User);

          done();
        });
      });
    });

    describe('model.save([options], [callback])', function() {
      it('Save an instance of a Model to the attached data source', function(done) {
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
      it('Save specified attributes to the attached data source', function(done) {
        User.create({first: 'joe', age: 100}, function(err, user) {
          assert(!err);
          assert.equal(user.first, 'joe');

          user.updateAttributes({
            first: 'updatedFirst',
            last: 'updatedLast',
          }, function(err, updatedUser) {
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
      it('Update when record with id=data.id found, insert otherwise', function(done) {
        User.upsert({first: 'joe', id: 7}, function(err, user) {
          assert(!err);
          assert.equal(user.first, 'joe');

          User.upsert({first: 'bob', id: 7}, function(err, updatedUser) {
            assert(!err);
            assert.equal(updatedUser.first, 'bob');

            done();
          });
        });
      });
    });

    describe('model.destroy([callback])', function() {
      it('Remove a model from the attached data source', function(done) {
        User.create({first: 'joe', last: 'bob'}, function(err, user) {
          User.findById(user.id, function(err, foundUser) {
            if (err) return done(err);

            assert.equal(user.id, foundUser.id);
            User.deleteById(foundUser.id, function(err) {
              if (err) return done(err);

              User.find({where: {id: user.id}}, function(err, found) {
                if (err) return done(err);

                assert.equal(found.length, 0);

                done();
              });
            });
          });
        });
      });
    });

    describe('Model.deleteById(id, [callback])', function() {
      it('Delete a model instance from the attached data source', function(done) {
        User.create({first: 'joe', last: 'bob'}, function(err, user) {
          User.deleteById(user.id, function(err) {
            User.findById(user.id, function(err, notFound) {
              assert.equal(notFound, null);

              done();
            });
          });
        });
      });
    });

    describe('Model.findById(id, callback)', function() {
      it('Find an instance by id', function(done) {
        User.create({first: 'michael', last: 'jordan', id: 23}, function() {
          User.findById(23, function(err, user) {
            assert.equal(user.id, 23);
            assert.equal(user.first, 'michael');
            assert.equal(user.last, 'jordan');

            done();
          });
        });
      });
    });

    describe('Model.count([query], callback)', function() {
      it('Query count of Model instances in data source', function(done) {
        (new TaskEmitter())
          .task(User, 'create', {first: 'jill', age: 100})
          .task(User, 'create', {first: 'bob', age: 200})
          .task(User, 'create', {first: 'jan'})
          .task(User, 'create', {first: 'sam'})
          .task(User, 'create', {first: 'suzy'})
          .on('done', function() {
            User.count({age: {gt: 99}}, function(err, count) {
              assert.equal(count, 2);

              done();
            });
          });
      });
    });
  });
};
