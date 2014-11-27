var async = require('async');
var loopback = require('../');
var ACL = loopback.ACL;
var Change = loopback.Change;
var defineModelTestsWithDataSource = require('./util/model-tests');
var PersistedModel = loopback.PersistedModel;

describe('Replication / Change APIs', function() {
  beforeEach(function() {
    var test = this;
    var dataSource = this.dataSource = loopback.createDataSource({
      connector: loopback.Memory
    });
    var SourceModel = this.SourceModel = PersistedModel.extend('SourceModel', {}, {
      trackChanges: true
    });
    SourceModel.attachTo(dataSource);

    var TargetModel = this.TargetModel = PersistedModel.extend('TargetModel', {}, {
      trackChanges: true
    });
    TargetModel.attachTo(dataSource);

    this.createInitalData = function(cb) {
      SourceModel.create({name: 'foo'}, function(err, inst) {
        if (err) return cb(err);
        test.model = inst;

        // give loopback a chance to register the change
        // TODO(ritch) get rid of this...
        setTimeout(function() {
          SourceModel.replicate(TargetModel, cb);
        }, 100);
      });
    };
  });

  describe('Model.changes(since, filter, callback)', function() {
    it('Get changes since the given checkpoint', function(done) {
      var test = this;
      this.SourceModel.create({name: 'foo'}, function(err) {
        if (err) return done(err);
        setTimeout(function() {
          test.SourceModel.changes(test.startingCheckpoint, {}, function(err, changes) {
            assert.equal(changes.length, 1);
            done();
          });
        }, 1);
      });
    });
  });

  describe('Model.replicate(since, targetModel, options, callback)', function() {
    it('Replicate data using the target model', function(done) {
      var test = this;
      var options = {};
      var sourceData;
      var targetData;

      this.SourceModel.create({name: 'foo'}, function(err) {
        setTimeout(replicate, 100);
      });

      function replicate() {
        test.SourceModel.replicate(test.startingCheckpoint, test.TargetModel,
        options, function(err, conflicts) {
          assert(conflicts.length === 0);
          async.parallel([
            function(cb) {
              test.SourceModel.find(function(err, result) {
                if (err) return cb(err);
                sourceData = result;
                cb();
              });
            },
            function(cb) {
              test.TargetModel.find(function(err, result) {
                if (err) return cb(err);
                targetData = result;
                cb();
              });
            }
          ], function(err) {
            if (err) return done(err);

            assert.deepEqual(sourceData, targetData);
            done();
          });
        });
      }
    });
  });

  describe('conflict detection - both updated', function() {
    beforeEach(function(done) {
      var SourceModel = this.SourceModel;
      var TargetModel = this.TargetModel;
      var test = this;

      test.createInitalData(createConflict);

      function createConflict(err, conflicts) {
        async.parallel([
          function(cb) {
            SourceModel.findOne(function(err, inst) {
              if (err) return cb(err);
              inst.name = 'source update';
              inst.save(cb);
            });
          },
          function(cb) {
            TargetModel.findOne(function(err, inst) {
              if (err) return cb(err);
              inst.name = 'target update';
              inst.save(cb);
            });
          }
        ], function(err) {
          if (err) return done(err);
          SourceModel.replicate(TargetModel, function(err, conflicts) {
            if (err) return done(err);
            test.conflicts = conflicts;
            test.conflict = conflicts[0];
            done();
          });
        });
      }
    });
    it('should detect a single conflict', function() {
      assert.equal(this.conflicts.length, 1);
      assert(this.conflict);
    });
    it('type should be UPDATE', function(done) {
      this.conflict.type(function(err, type) {
        assert.equal(type, Change.UPDATE);
        done();
      });
    });
    it('conflict.changes()', function(done) {
      var test = this;
      this.conflict.changes(function(err, sourceChange, targetChange) {
        assert.equal(typeof sourceChange.id, 'string');
        assert.equal(typeof targetChange.id, 'string');
        assert.equal(test.model.getId(), sourceChange.getModelId());
        assert.equal(sourceChange.type(), Change.UPDATE);
        assert.equal(targetChange.type(), Change.UPDATE);
        done();
      });
    });
    it('conflict.models()', function(done) {
      var test = this;
      this.conflict.models(function(err, source, target) {
        assert.deepEqual(source.toJSON(), {
          id: 1,
          name: 'source update'
        });
        assert.deepEqual(target.toJSON(), {
          id: 1,
          name: 'target update'
        });
        done();
      });
    });
  });

  describe('conflict detection - source deleted', function() {
    beforeEach(function(done) {
      var SourceModel = this.SourceModel;
      var TargetModel = this.TargetModel;
      var test = this;

      test.createInitalData(createConflict);

      function createConflict() {
        async.parallel([
          function(cb) {
            SourceModel.findOne(function(err, inst) {
              if (err) return cb(err);
              test.model = inst;
              inst.remove(cb);
            });
          },
          function(cb) {
            TargetModel.findOne(function(err, inst) {
              if (err) return cb(err);
              inst.name = 'target update';
              inst.save(cb);
            });
          }
        ], function(err) {
          if (err) return done(err);
          SourceModel.replicate(TargetModel, function(err, conflicts) {
            if (err) return done(err);
            test.conflicts = conflicts;
            test.conflict = conflicts[0];
            done();
          });
        });
      }
    });
    it('should detect a single conflict', function() {
      assert.equal(this.conflicts.length, 1);
      assert(this.conflict);
    });
    it('type should be DELETE', function(done) {
      this.conflict.type(function(err, type) {
        assert.equal(type, Change.DELETE);
        done();
      });
    });
    it('conflict.changes()', function(done) {
      var test = this;
      this.conflict.changes(function(err, sourceChange, targetChange) {
        assert.equal(typeof sourceChange.id, 'string');
        assert.equal(typeof targetChange.id, 'string');
        assert.equal(test.model.getId(), sourceChange.getModelId());
        assert.equal(sourceChange.type(), Change.DELETE);
        assert.equal(targetChange.type(), Change.UPDATE);
        done();
      });
    });
    it('conflict.models()', function(done) {
      var test = this;
      this.conflict.models(function(err, source, target) {
        assert.equal(source, null);
        assert.deepEqual(target.toJSON(), {
          id: 1,
          name: 'target update'
        });
        done();
      });
    });
  });

  describe('conflict detection - target deleted', function() {
    beforeEach(function(done) {
      var SourceModel = this.SourceModel;
      var TargetModel = this.TargetModel;
      var test = this;

      test.createInitalData(createConflict);

      function createConflict() {
        async.parallel([
          function(cb) {
            SourceModel.findOne(function(err, inst) {
              if (err) return cb(err);
              test.model = inst;
              inst.name = 'source update';
              inst.save(cb);
            });
          },
          function(cb) {
            TargetModel.findOne(function(err, inst) {
              if (err) return cb(err);
              inst.remove(cb);
            });
          }
        ], function(err) {
          if (err) return done(err);
          SourceModel.replicate(TargetModel, function(err, conflicts) {
            if (err) return done(err);
            test.conflicts = conflicts;
            test.conflict = conflicts[0];
            done();
          });
        });
      }
    });
    it('should detect a single conflict', function() {
      assert.equal(this.conflicts.length, 1);
      assert(this.conflict);
    });
    it('type should be DELETE', function(done) {
      this.conflict.type(function(err, type) {
        assert.equal(type, Change.DELETE);
        done();
      });
    });
    it('conflict.changes()', function(done) {
      var test = this;
      this.conflict.changes(function(err, sourceChange, targetChange) {
        assert.equal(typeof sourceChange.id, 'string');
        assert.equal(typeof targetChange.id, 'string');
        assert.equal(test.model.getId(), sourceChange.getModelId());
        assert.equal(sourceChange.type(), Change.UPDATE);
        assert.equal(targetChange.type(), Change.DELETE);
        done();
      });
    });
    it('conflict.models()', function(done) {
      var test = this;
      this.conflict.models(function(err, source, target) {
        assert.equal(target, null);
        assert.deepEqual(source.toJSON(), {
          id: 1,
          name: 'source update'
        });
        done();
      });
    });
  });

  describe('conflict detection - both deleted', function() {
    beforeEach(function(done) {
      var SourceModel = this.SourceModel;
      var TargetModel = this.TargetModel;
      var test = this;

      test.createInitalData(createConflict);

      function createConflict() {
        async.parallel([
          function(cb) {
            SourceModel.findOne(function(err, inst) {
              if (err) return cb(err);
              test.model = inst;
              inst.remove(cb);
            });
          },
          function(cb) {
            TargetModel.findOne(function(err, inst) {
              if (err) return cb(err);
              inst.remove(cb);
            });
          }
        ], function(err) {
          if (err) return done(err);
          SourceModel.replicate(TargetModel, function(err, conflicts) {
            if (err) return done(err);
            test.conflicts = conflicts;
            test.conflict = conflicts[0];
            done();
          });
        });
      }
    });
    it('should not detect a conflict', function() {
      assert.equal(this.conflicts.length, 0);
      assert(!this.conflict);
    });
  });
});
