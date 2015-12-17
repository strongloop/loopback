var assert = require('assert');
var async = require('async');
var loopback = require('../');
var Change = loopback.Change;
var defineModelTestsWithDataSource = require('./util/model-tests');
var PersistedModel = loopback.PersistedModel;
var expect = require('chai').expect;
var debug = require('debug')('test');

describe('Replication / Change APIs', function() {
  var dataSource, SourceModel, TargetModel;
  var useSinceFilter;
  var tid = 0; // per-test unique id used e.g. to build unique model names

  beforeEach(function() {
    tid++;
    useSinceFilter = false;
    var test = this;
    dataSource = this.dataSource = loopback.createDataSource({
      connector: loopback.Memory
    });
    SourceModel = this.SourceModel = PersistedModel.extend(
      'SourceModel-' + tid,
      { id: { id: true, type: String, defaultFn: 'guid' } },
      { trackChanges: true });

    SourceModel.attachTo(dataSource);

    TargetModel = this.TargetModel = PersistedModel.extend(
      'TargetModel-' + tid,
      { id: { id: true, type: String, defaultFn: 'guid' } },
      { trackChanges: true });

    // NOTE(bajtos) At the moment, all models share the same Checkpoint
    // model. This causes the in-process replication to work differently
    // than client-server replication.
    // As a workaround, we manually setup unique Checkpoint for TargetModel.
    var TargetChange = TargetModel.Change;
    TargetChange.Checkpoint = loopback.Checkpoint.extend('TargetCheckpoint');
    TargetChange.Checkpoint.attachTo(dataSource);

    TargetModel.attachTo(dataSource);

    test.startingCheckpoint = -1;

    this.createInitalData = function(cb) {
      SourceModel.create({name: 'foo'}, function(err, inst) {
        if (err) return cb(err);
        test.model = inst;
        SourceModel.replicate(TargetModel, cb);
      });
    };
  });

  describe('optimization check rectifyChange Vs rectifyAllChanges', function() {
    beforeEach(function initialData(done) {
      var data = [{name: 'John', surname: 'Doe'}, {name: 'Jane', surname: 'Roe'}];
      async.waterfall([
        function(callback) {
          SourceModel.create(data, callback);
        },
        function(data, callback) {
          SourceModel.replicate(TargetModel, callback);
        }], function(err, result) {
        done(err);
      });
    });

    it('should call rectifyAllChanges if no id is passed for rectifyOnDelete', function(done) {
      SourceModel.rectifyChange = function() {
        return done(new Error('Should not call rectifyChange'));
      };
      SourceModel.rectifyAllChanges = function() {
        return done();
      };
      SourceModel.destroyAll({name: 'John'}, function(err, data) {
        if (err)
          return done(err);
      });
    });

    it('should call rectifyAllChanges if no id is passed for rectifyOnSave', function(done) {
      SourceModel.rectifyChange = function() {
        return done(new Error('Should not call rectifyChange'));
      };
      SourceModel.rectifyAllChanges = function() {
        return done();
      };
      var newData = {'name': 'Janie'};
      SourceModel.update({name: 'Jane'}, newData, function(err, data) {
        if (err)
          return done(err);
      });
    });

    it('rectifyOnDelete for Delete should call rectifyChange instead of rectifyAllChanges', function(done) {
      TargetModel.rectifyChange = function() {
        return done();
      };
      TargetModel.rectifyAllChanges = function() {
        return done(new Error('Should not call rectifyAllChanges'));
      };

      async.waterfall([
        function(callback) {
          SourceModel.destroyAll({name: 'John'}, callback);
        },
        function(data, callback) {
          SourceModel.replicate(TargetModel, callback);
          // replicate should call `rectifyOnSave` and then `rectifyChange` not `rectifyAllChanges` through `after save` operation
        }
      ], function(err, results) {
        if (err)
          return done(err);
      });
    });

    it('rectifyOnSave for Update should call rectifyChange instead of rectifyAllChanges', function(done) {
      TargetModel.rectifyChange = function() {
        return done();
      };
      TargetModel.rectifyAllChanges = function() {
        return done(new Error('Should not call rectifyAllChanges'));
      };

      var newData = {'name': 'Janie'};
      async.waterfall([
        function(callback) {
          SourceModel.update({name: 'Jane'}, newData, callback);
        },
        function(data, callback) {
          SourceModel.replicate(TargetModel, callback);
          // replicate should call `rectifyOnSave` and then `rectifyChange` not `rectifyAllChanges` through `after save` operation
        }], function(err, result) {
        if (err)
          return done(err);
      });
    });

    it('rectifyOnSave for Create should call rectifyChange instead of rectifyAllChanges', function(done) {
      TargetModel.rectifyChange = function() {
        return done();
      };
      TargetModel.rectifyAllChanges = function() {
        return done(new Error('Should not call rectifyAllChanges'));
      };

      var newData = [{name: 'Janie', surname: 'Doe'}];
      async.waterfall([
        function(callback) {
          SourceModel.create(newData, callback);
        },
        function(data, callback) {
          SourceModel.replicate(TargetModel, callback);
          // replicate should call `rectifyOnSave` and then `rectifyChange` not `rectifyAllChanges` through `after save` operation
        }
      ], function(err, result) {
        if (err)
          return done(err);
      });
    });
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

    it('excludes changes from older checkpoints', function(done) {
      var FUTURE_CHECKPOINT = 999;

      SourceModel.create({ name: 'foo' }, function(err) {
        if (err) return done(err);
        SourceModel.changes(FUTURE_CHECKPOINT, {}, function(err, changes) {
          if (err) return done(err);
          /*jshint -W030 */
          expect(changes).to.be.empty;
          done();
        });
      });
    });
  });

  describe('Model.replicate(since, targetModel, options, callback)', function() {

    function assertTargetModelEqualsSourceModel(conflicts, sourceModel,
      targetModel, done) {
      var sourceData;
      var targetData;

      assert(conflicts.length === 0);
      async.parallel([
        function(cb) {
          sourceModel.find(function(err, result) {
            if (err) return cb(err);
            sourceData = result;
            cb();
          });
        },
        function(cb) {
          targetModel.find(function(err, result) {
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
    }

    it('Replicate data using the target model', function(done) {
      var test = this;
      var options = {};

      this.SourceModel.create({name: 'foo'}, function(err) {
        if (err) return done(err);
        test.SourceModel.replicate(test.startingCheckpoint, test.TargetModel,
        options, function(err, conflicts) {
          if (err) return done(err);

          assertTargetModelEqualsSourceModel(conflicts, test.SourceModel,
            test.TargetModel, done);
        });
      });
    });

    it('Replicate data using the target model - promise variant', function(done) {
      var test = this;
      var options = {};

      this.SourceModel.create({name: 'foo'}, function(err) {
        if (err) return done(err);
        test.SourceModel.replicate(test.startingCheckpoint, test.TargetModel,
        options)
          .then(function(conflicts) {
            assertTargetModelEqualsSourceModel(conflicts, test.SourceModel,
              test.TargetModel, done);
          })
          .catch(function(err) {
            done(err);
          });
      });
    });

    it('applies "since" filter on source changes', function(done) {
      async.series([
        function createModelInSourceCp1(next) {
          SourceModel.create({ id: '1' }, next);
        },
        function checkpoint(next) {
          SourceModel.checkpoint(next);
        },
        function createModelInSourceCp2(next) {
          SourceModel.create({ id: '2' }, next);
        },
        function replicateLastChangeOnly(next) {
          SourceModel.currentCheckpoint(function(err, cp) {
            if (err) return done(err);
            SourceModel.replicate(cp, TargetModel, next);
          });
        },
        function verify(next) {
          TargetModel.find(function(err, list) {
            if (err) return done(err);
            // '1' should be skipped by replication
            expect(getIds(list)).to.eql(['2']);
            next();
          });
        }
      ], done);
    });

    it('applies "since" filter on source changes - promise variant', function(done) {
      async.series([
        function createModelInSourceCp1(next) {
          SourceModel.create({ id: '1' }, next);
        },
        function checkpoint(next) {
          SourceModel.checkpoint(next);
        },
        function createModelInSourceCp2(next) {
          SourceModel.create({ id: '2' }, next);
        },
        function replicateLastChangeOnly(next) {
          SourceModel.currentCheckpoint(function(err, cp) {
            if (err) return done(err);
            SourceModel.replicate(cp, TargetModel, {})
              .then(function(next) {
                done();
              })
              .catch(err);
          });
        },
        function verify(next) {
          TargetModel.find(function(err, list) {
            if (err) return done(err);
            // '1' should be skipped by replication
            expect(getIds(list)).to.eql(['2']);
            next();
          });
        }
      ], done);
    });

    it('applies "since" filter on target changes', function(done) {
      // Because the "since" filter is just an optimization,
      // there isn't really any observable behaviour we could
      // check to assert correct implementation.
      var diffSince = [];
      spyAndStoreSinceArg(TargetModel, 'diff', diffSince);

      SourceModel.replicate(10, TargetModel, function(err) {
        if (err) return done(err);
        expect(diffSince).to.eql([10]);
        done();
      });
    });

    it('applies "since" filter on target changes - promise variant', function(done) {
      // Because the "since" filter is just an optimization,
      // there isn't really any observable behaviour we could
      // check to assert correct implementation.
      var diffSince = [];
      spyAndStoreSinceArg(TargetModel, 'diff', diffSince);

      SourceModel.replicate(10, TargetModel, {})
        .then(function() {
          expect(diffSince).to.eql([10]);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('uses different "since" value for source and target', function(done) {
      var sourceSince = [];
      var targetSince = [];

      spyAndStoreSinceArg(SourceModel, 'changes', sourceSince);
      spyAndStoreSinceArg(TargetModel, 'diff', targetSince);

      var since = { source: 1, target: 2 };
      SourceModel.replicate(since, TargetModel, function(err) {
        if (err) return done(err);
        expect(sourceSince).to.eql([1]);
        expect(targetSince).to.eql([2]);
        done();
      });
    });

    it('uses different "since" value for source and target - promise variant', function(done) {
      var sourceSince = [];
      var targetSince = [];

      spyAndStoreSinceArg(SourceModel, 'changes', sourceSince);
      spyAndStoreSinceArg(TargetModel, 'diff', targetSince);

      var since = { source: 1, target: 2 };
      SourceModel.replicate(since, TargetModel, {})
        .then(function() {
          expect(sourceSince).to.eql([1]);
          expect(targetSince).to.eql([2]);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('picks up changes made during replication', function(done) {
      setupRaceConditionInReplication(function(cb) {
        // simulate the situation when another model is created
        // while a replication run is in progress
        SourceModel.create({ id: 'racer' }, cb);
      });

      var lastCp;
      async.series([
        function buildSomeDataToReplicate(next) {
          SourceModel.create({ id: 'init' }, next);
        },
        function getLastCp(next) {
          SourceModel.currentCheckpoint(function(err, cp) {
            if (err) return done(err);
            lastCp = cp;
            next();
          });
        },
        function replicate(next) {
          SourceModel.replicate(TargetModel, next);
        },
        function verifyAssumptions(next) {
          SourceModel.find(function(err, list) {
            expect(getIds(list), 'source ids')
              .to.eql(['init', 'racer']);

            TargetModel.find(function(err, list) {
              expect(getIds(list), 'target ids after first sync')
                .to.include.members(['init']);
              next();
            });
          });
        },
        function replicateAgain(next) {
          SourceModel.replicate(lastCp + 1, TargetModel, next);
        },
        function verify(next) {
          TargetModel.find(function(err, list) {
            expect(getIds(list), 'target ids').to.eql(['init', 'racer']);
            next();
          });
        }
      ], done);
    });

    it('returns new current checkpoints to callback', function(done) {
      var sourceCp, targetCp;
      async.series([
        bumpSourceCheckpoint,
        bumpTargetCheckpoint,
        bumpTargetCheckpoint,
        function replicate(cb) {
          expect(sourceCp).to.not.equal(targetCp);

          SourceModel.replicate(
            TargetModel,
            function(err, conflicts, newCheckpoints) {
              if (err) return cb(err);
              expect(conflicts, 'conflicts').to.eql([]);
              expect(newCheckpoints, 'currentCheckpoints').to.eql({
                source: sourceCp + 1,
                target: targetCp + 1
              });
              cb();
            });
        }
      ], done);

      function bumpSourceCheckpoint(cb) {
        SourceModel.checkpoint(function(err, inst) {
          if (err) return cb(err);
          sourceCp = inst.seq;
          cb();
        });
      }

      function bumpTargetCheckpoint(cb) {
        TargetModel.checkpoint(function(err, inst) {
          if (err) return cb(err);
          targetCp = inst.seq;
          cb();
        });
      }
    });

    it('leaves current target checkpoint empty', function(done) {
      async.series([
        function createTestData(next) {
          SourceModel.create({}, next);
        },
        replicateExpectingSuccess(),
        function verify(next) {
          TargetModel.currentCheckpoint(function(err, cp) {
            if (err) return next(err);
            TargetModel.getChangeModel().find(
              { where: { checkpoint: { gte: cp } } },
              function(err, changes) {
                if (err) return done(err);
                expect(changes).to.have.length(0);
                done();
              });
          });
        }
      ], done);
    });

    describe('with 3rd-party changes', function() {
      it('detects UPDATE made during UPDATE', function(done) {
        async.series([
          createModel(SourceModel, { id: '1' }),
          replicateExpectingSuccess(),
          function updateModel(next) {
            SourceModel.updateAll({ id: '1' }, { name: 'source' }, next);
          },
          function replicateWith3rdPartyModifyingData(next) {
            setupRaceConditionInReplication(function(cb) {
              var connector = TargetModel.dataSource.connector;
              if (connector.updateAttributes.length <= 4) {
                connector.updateAttributes(
                  TargetModel.modelName,
                  '1',
                  {name: '3rd-party'},
                  cb);
              } else {
                // 2.x connectors require `options`
                connector.updateAttributes(
                  TargetModel.modelName,
                  '1',
                  {name: '3rd-party'},
                  {}, // options
                  cb);
              }
            });

            SourceModel.replicate(
              TargetModel,
              function(err, conflicts, cps, updates) {
                if (err) return next(err);

                var conflictedIds = getPropValue(conflicts || [], 'modelId');
                expect(conflictedIds).to.eql(['1']);

                // resolve the conflict using ours
                conflicts[0].resolve(next);
              });
          },

          replicateExpectingSuccess(),
          verifyInstanceWasReplicated(SourceModel, TargetModel, '1')
        ], done);
      });

      it('detects CREATE made during CREATE', function(done) {
        async.series([
          // FIXME(bajtos) Remove the 'name' property once the implementation
          // of UPDATE is fixed to correctly remove properties
          createModel(SourceModel, { id: '1', name: 'source' }),
          function replicateWith3rdPartyModifyingData(next) {
            var connector = TargetModel.dataSource.connector;
            setupRaceConditionInReplication(function(cb) {
              if (connector.create.length <= 3) {
                connector.create(
                  TargetModel.modelName,
                  {id: '1', name: '3rd-party'},
                  cb);
              } else {
                // 2.x connectors require `options`
                connector.create(
                  TargetModel.modelName,
                  {id: '1', name: '3rd-party'},
                  {}, // options
                  cb);
              }
            });

            SourceModel.replicate(
              TargetModel,
              function(err, conflicts, cps, updates) {
                if (err) return next(err);

                var conflictedIds = getPropValue(conflicts || [], 'modelId');
                expect(conflictedIds).to.eql(['1']);

                // resolve the conflict using ours
                conflicts[0].resolve(next);
              });
          },

          replicateExpectingSuccess(),
          verifyInstanceWasReplicated(SourceModel, TargetModel, '1')
        ], done);
      });

      it('detects UPDATE made during DELETE', function(done) {
        async.series([
          createModel(SourceModel, { id: '1' }),
          replicateExpectingSuccess(),
          function deleteModel(next) {
            SourceModel.deleteById('1', next);
          },
          function replicateWith3rdPartyModifyingData(next) {
            setupRaceConditionInReplication(function(cb) {
              var connector = TargetModel.dataSource.connector;
              if (connector.updateAttributes.length <= 4) {
                connector.updateAttributes(
                  TargetModel.modelName,
                  '1',
                  {name: '3rd-party'},
                  cb);
              } else {
                // 2.x connectors require `options`
                connector.updateAttributes(
                  TargetModel.modelName,
                  '1',
                  {name: '3rd-party'},
                  {}, // options
                  cb);
              }
            });

            SourceModel.replicate(
              TargetModel,
              function(err, conflicts, cps, updates) {
                if (err) return next(err);

                var conflictedIds = getPropValue(conflicts || [], 'modelId');
                expect(conflictedIds).to.eql(['1']);

                // resolve the conflict using ours
                conflicts[0].resolve(next);
              });
          },

          replicateExpectingSuccess(),
          verifyInstanceWasReplicated(SourceModel, TargetModel, '1')
        ], done);
      });

      it('handles DELETE made during DELETE', function(done) {
        async.series([
          createModel(SourceModel, { id: '1' }),
          replicateExpectingSuccess(),
          function deleteModel(next) {
            SourceModel.deleteById('1', next);
          },
          function setup3rdPartyModifyingData(next) {
            var connector = TargetModel.dataSource.connector;
            setupRaceConditionInReplication(function(cb) {
              if (connector.destroy.length <= 3) {
                connector.destroy(
                  TargetModel.modelName,
                  '1',
                  cb);
              } else {
                // 2.x connectors require `options`
                connector.destroy(
                  TargetModel.modelName,
                  '1',
                  {}, // options
                  cb);
              }
            });
            next();
          },
          replicateExpectingSuccess(),
          verifyInstanceWasReplicated(SourceModel, TargetModel, '1')
        ], done);
      });
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
          id: test.model.id,
          name: 'source update'
        });
        assert.deepEqual(target.toJSON(), {
          id: test.model.id,
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
          id: test.model.id,
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
          id: test.model.id,
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

  describe('change detection', function() {
    it('detects "create"', function(done) {
      SourceModel.create({}, function(err, inst) {
        if (err) return done(err);
        assertChangeRecordedForId(inst.id, done);
      });
    });

    it('detects "updateOrCreate"', function(done) {
      givenReplicatedInstance(function(err, created) {
        if (err) return done(err);
        var data = created.toObject();
        created.name = 'updated';
        SourceModel.updateOrCreate(created, function(err, inst) {
          if (err) return done(err);
          assertChangeRecordedForId(inst.id, done);
        });
      });
    });

    it('detects "findOrCreate"', function(done) {
      // make sure we bypass find+create and call the connector directly
      SourceModel.dataSource.connector.findOrCreate =
        function(model, query, data, callback) {
          if (this.all.length <= 3) {
            this.all(model, query, function(err, list) {
              if (err || (list && list[0]))
                return callback(err, list && list[0], false);
              this.create(model, data, function(err) {
                callback(err, data, true);
              });
            }.bind(this));
          } else {
            // 2.x connectors requires `options`
            this.all(model, query, {}, function(err, list) {
              if (err || (list && list[0]))
                return callback(err, list && list[0], false);
              this.create(model, data, {}, function(err) {
                callback(err, data, true);
              });
            }.bind(this));
          }
        };

      SourceModel.findOrCreate(
        { where: { name: 'does-not-exist' } },
        { name: 'created' },
        function(err, inst) {
          if (err) return done(err);
          assertChangeRecordedForId(inst.id, done);
        });
    });

    it('detects "deleteById"', function(done) {
      givenReplicatedInstance(function(err, inst) {
        if (err) return done(err);
        SourceModel.deleteById(inst.id, function(err) {
          assertChangeRecordedForId(inst.id, done);
        });
      });
    });

    it('detects "deleteAll"', function(done) {
      givenReplicatedInstance(function(err, inst) {
        if (err) return done(err);
        SourceModel.deleteAll({ name: inst.name }, function(err) {
          if (err) return done(err);
          assertChangeRecordedForId(inst.id, done);
        });
      });
    });

    it('detects "updateAll"', function(done) {
      givenReplicatedInstance(function(err, inst) {
        if (err) return done(err);
        SourceModel.updateAll(
          { name: inst.name },
          { name: 'updated' },
          function(err) {
            if (err) return done(err);
            assertChangeRecordedForId(inst.id, done);
          });
      });
    });

    it('detects "prototype.save"', function(done) {
      givenReplicatedInstance(function(err, inst) {
        if (err) return done(err);
        inst.name = 'updated';
        inst.save(function(err) {
          if (err) return done(err);
          assertChangeRecordedForId(inst.id, done);
        });
      });
    });

    it('detects "prototype.updateAttributes"', function(done) {
      givenReplicatedInstance(function(err, inst) {
        if (err) return done(err);
        inst.updateAttributes({ name: 'updated' }, function(err) {
          if (err) return done(err);
          assertChangeRecordedForId(inst.id, done);
        });
      });
    });

    it('detects "prototype.delete"', function(done) {
      givenReplicatedInstance(function(err, inst) {
        if (err) return done(err);
        inst.delete(function(err) {
          assertChangeRecordedForId(inst.id, done);
        });
      });
    });

    function givenReplicatedInstance(cb) {
      SourceModel.create({ name: 'a-name' }, function(err, inst) {
        if (err) return cb(err);
        SourceModel.checkpoint(function(err) {
          if (err) return cb(err);
          cb(null, inst);
        });
      });
    }

    function assertChangeRecordedForId(id, cb) {
      SourceModel.getChangeModel().getCheckpointModel()
        .current(function(err, cp) {
          if (err) return cb(err);
          SourceModel.changes(cp - 1, {}, function(err, pendingChanges) {
            if (err) return cb(err);
            expect(pendingChanges, 'list of changes').to.have.length(1);
            var change = pendingChanges[0].toObject();
            expect(change).to.have.property('checkpoint', cp); // sanity check
            expect(change).to.have.property('modelName', SourceModel.modelName);
            // NOTE(bajtos) Change.modelId is always String
            // regardless of the type of the changed model's id property
            expect(change).to.have.property('modelId', '' + id);
            cb();
          });
        });
    }
  });

  describe('complex setup', function() {
    var sourceInstance, sourceInstanceId, AnotherModel;

    beforeEach(function createReplicatedInstance(done) {
      async.series([
        function createInstance(next) {
          SourceModel.create({ id: 'test-instance' }, function(err, result) {
            sourceInstance = result;
            sourceInstanceId = result.id;
            next(err);
          });
        },
        replicateExpectingSuccess(),
        verifySourceWasReplicated()
      ], done);
    });

    beforeEach(function setupThirdModel() {
      AnotherModel = this.AnotherModel = PersistedModel.extend(
        'AnotherModel-' + tid,
        { id: { id: true, type: String, defaultFn: 'guid' } },
        { trackChanges: true });

      // NOTE(bajtos) At the moment, all models share the same Checkpoint
      // model. This causes the in-process replication to work differently
      // than client-server replication.
      // As a workaround, we manually setup unique Checkpoint for AnotherModel.
      var AnotherChange = AnotherModel.Change;
      AnotherChange.Checkpoint = loopback.Checkpoint.extend('AnotherCheckpoint');
      AnotherChange.Checkpoint.attachTo(dataSource);

      AnotherModel.attachTo(dataSource);
    });

    it('correctly replicates without checkpoint filter', function(done) {
      async.series([
        updateSourceInstanceNameTo('updated'),
        replicateExpectingSuccess(),
        verifySourceWasReplicated(),

        function deleteInstance(next) {
          sourceInstance.remove(next);
        },
        replicateExpectingSuccess(),
        function verifyTargetModelWasDeleted(next) {
          TargetModel.find(function(err, list) {
            if (err) return next(err);
            expect(getIds(list)).to.not.contain(sourceInstance.id);
            next();
          });
        }
      ], done);
    });

    it('replicates multiple updates within the same CP', function(done) {
      async.series([
        replicateExpectingSuccess(),
        verifySourceWasReplicated(),

        updateSourceInstanceNameTo('updated'),
        updateSourceInstanceNameTo('again'),
        replicateExpectingSuccess(),
        verifySourceWasReplicated()
      ], done);
    });

    describe('clientA-server-clientB', function() {
      var ClientA, Server, ClientB;

      beforeEach(function() {
        ClientA  = SourceModel;
        Server = TargetModel;
        ClientB = AnotherModel;

        // NOTE(bajtos) The tests should ideally pass without the since
        // filter too. Unfortunately that's not possible with the current
        // implementation that remembers only the last two changes made.
        useSinceFilter = true;
      });

      it('replicates new models', function(done) {
        async.series([
          // Note that ClientA->Server was already replicated during setup
          replicateExpectingSuccess(Server, ClientB),
          verifySourceWasReplicated(ClientB)
        ], done);
      });

      it('propagates updates with no false conflicts', function(done) {
        async.series([
          updateSourceInstanceNameTo('v2'),
          replicateExpectingSuccess(ClientA, Server),

          replicateExpectingSuccess(Server, ClientB),

          updateSourceInstanceNameTo('v3'),
          replicateExpectingSuccess(ClientA, Server),
          updateSourceInstanceNameTo('v4'),
          replicateExpectingSuccess(ClientA, Server),

          replicateExpectingSuccess(Server, ClientB),
          verifySourceWasReplicated(ClientB)
        ], done);
      });

      it('propagates deletes with no false conflicts', function(done) {
        async.series([
          deleteSourceInstance(),
          replicateExpectingSuccess(ClientA, Server),
          replicateExpectingSuccess(Server, ClientB),
          verifySourceWasReplicated(ClientB)
        ], done);
      });

      describe('bidirectional sync', function() {
        beforeEach(function finishInitialSync(next) {
          // The fixture setup creates a new model instance and replicates
          // it from ClientA to Server. Since we are performing bidirectional
          // synchronization in this suite, we must complete the first sync,
          // otherwise some of the tests may fail.
          replicateExpectingSuccess(Server, ClientA)(next);
        });

        it('propagates CREATE', function(done) {
          async.series([
            sync(ClientA, Server),
            sync(ClientB, Server)
          ], done);
        });

        it('propagates CREATE+UPDATE', function(done) {
          async.series([
            // NOTE: ClientB has not fetched the new model instance yet
            updateSourceInstanceNameTo('v2'),
            sync(ClientA, Server),

            // ClientB fetches the created & updated instance from the server
            sync(ClientB, Server),
          ], done);
        });

        it('propagates DELETE', function(done) {
          async.series([
            // NOTE: ClientB has not fetched the new model instance yet
            updateSourceInstanceNameTo('v2'),
            sync(ClientA, Server),

            // ClientB fetches the created & updated instance from the server
            sync(ClientB, Server),
          ], done);

        });

        it('does not report false conflicts', function(done) {
          async.series([
            // client A makes some work
            updateSourceInstanceNameTo('v2'),
            sync(ClientA, Server),

            // ClientB fetches the change from the server
            sync(ClientB, Server),
            verifySourceWasReplicated(ClientB),

            // client B makes some work
            updateClientB('v5'),
            sync(Server, ClientB),
            updateClientB('v6'),
            sync(ClientB, Server),

            // client A fetches the changes
            sync(ClientA, Server)
          ], done);
        });

        it('handles UPDATE conflict resolved using "ours"', function(done) {
          testUpdateConflictIsResolved(
            function resolveUsingOurs(conflict, cb) {
              conflict.resolveUsingSource(cb);
            },
            done);
        });

        it('handles UPDATE conflict resolved using "theirs"', function(done) {
          testUpdateConflictIsResolved(
            function resolveUsingTheirs(conflict, cb) {
              // We sync ClientA->Server first
              expect(conflict.SourceModel.modelName)
                .to.equal(ClientB.modelName);
              conflict.resolveUsingTarget(cb);
            },
            done);
        });

        it('handles UPDATE conflict resolved manually', function(done) {
          testUpdateConflictIsResolved(
            function resolveManually(conflict, cb) {
              conflict.resolveManually({ name: 'manual' }, cb);
            },
            done);
        });

        it('handles DELETE conflict resolved using "ours"', function(done) {
          testDeleteConflictIsResolved(
            function resolveUsingOurs(conflict, cb) {
              conflict.resolveUsingSource(cb);
            },
            done);
        });

        it('handles DELETE conflict resolved using "theirs"', function(done) {
          testDeleteConflictIsResolved(
            function resolveUsingTheirs(conflict, cb) {
              // We sync ClientA->Server first
              expect(conflict.SourceModel.modelName)
                .to.equal(ClientB.modelName);
              conflict.resolveUsingTarget(cb);
            },
            done);
        });

        it('handles DELETE conflict resolved as manual delete', function(done) {
          testDeleteConflictIsResolved(
            function resolveManually(conflict, cb) {
              conflict.resolveManually(null, cb);
            },
            done);
        });

        it('handles DELETE conflict resolved manually', function(done) {
          testDeleteConflictIsResolved(
            function resolveManually(conflict, cb) {
              conflict.resolveManually({ name: 'manual' }, cb);
            },
            done);
        });
      });

      function testUpdateConflictIsResolved(resolver, cb) {
        async.series([
          // sync the new model to ClientB
          sync(ClientB, Server),
          verifyInstanceWasReplicated(ClientA, ClientB, sourceInstanceId),

          // ClientA makes a change
          updateSourceInstanceNameTo('a'),
          sync(ClientA, Server),

          // ClientB changes the same instance
          updateClientB('b'),

          function syncAndResolveConflict(next) {
            replicate(ClientB, Server, function(err, conflicts, cps) {
              if (err) return next(err);

              expect(conflicts).to.have.length(1);
              expect(conflicts[0].SourceModel.modelName)
                .to.equal(ClientB.modelName);

              debug('Resolving the conflict %j', conflicts[0]);
              resolver(conflicts[0], next);
            });
          },

          // repeat the last sync, it should pass now
          sync(ClientB, Server),
          // and sync back to ClientA too
          sync(ClientA, Server),

          verifyInstanceWasReplicated(ClientB, ClientA, sourceInstanceId)
        ], cb);
      }

      function testDeleteConflictIsResolved(resolver, cb) {
        async.series([
          // sync the new model to ClientB
          sync(ClientB, Server),
          verifyInstanceWasReplicated(ClientA, ClientB, sourceInstanceId),

          // ClientA makes a change
          function deleteInstanceOnClientA(next) {
            ClientA.deleteById(sourceInstanceId, next);
          },

          sync(ClientA, Server),

          // ClientB changes the same instance
          updateClientB('b'),

          function syncAndResolveConflict(next) {
            replicate(ClientB, Server, function(err, conflicts, cps) {
              if (err) return next(err);

              expect(conflicts).to.have.length(1);
              expect(conflicts[0].SourceModel.modelName)
                .to.equal(ClientB.modelName);

              debug('Resolving the conflict %j', conflicts[0]);
              resolver(conflicts[0], next);
            });
          },

          // repeat the last sync, it should pass now
          sync(ClientB, Server),
          // and sync back to ClientA too
          sync(ClientA, Server),

          verifyInstanceWasReplicated(ClientB, ClientA, sourceInstanceId)
        ], cb);
      }

      function updateClientB(name) {
        return function updateInstanceB(next) {
          ClientB.findById(sourceInstanceId, function(err, instance) {
            if (err) return next(err);
            instance.name = name;
            instance.save(next);
          });
        };
      }

      function sync(client, server) {
        return function syncBothWays(next) {
          async.series([
            // NOTE(bajtos) It's important to replicate from the client to the
            // server first, so that we can resolve any conflicts at the client
            replicateExpectingSuccess(client, server),
            replicateExpectingSuccess(server, client)
          ], next);
        };
      }

    });

    function updateSourceInstanceNameTo(value) {
      return function updateInstance(next) {
        debug('update source instance name to %j', value);
        sourceInstance.name = value;
        sourceInstance.save(next);
      };
    }

    function deleteSourceInstance(value) {
      return function deleteInstance(next) {
        debug('delete source instance', value);
        sourceInstance.remove(function(err) {
          sourceInstance = null;
          next(err);
        });
      };
    }

    function verifySourceWasReplicated(target) {
      if (!target) target = TargetModel;
      return function verify(next) {
        target.findById(sourceInstanceId, function(err, targetInstance) {
          if (err) return next(err);
          expect(targetInstance && targetInstance.toObject())
            .to.eql(sourceInstance && sourceInstance.toObject());
          next();
        });
      };
    }
  });

  var _since = {};
  function replicate(source, target, since, next) {
    if (typeof since === 'function') {
      next = since;
      since = undefined;
    }

    var sinceIx = source.modelName + ':to:' + target.modelName;
    if (since === undefined) {
      since = useSinceFilter ?
        _since[sinceIx] || -1 :
        -1;
    }

    debug('replicate from %s to %s since %j',
      source.modelName, target.modelName, since);

    source.replicate(since, target, function(err, conflicts, cps) {
      if (err) return next(err);
      if (conflicts.length === 0) {
        _since[sinceIx] = cps;
      }
      next(err, conflicts, cps);
    });
  }

  function createModel(Model, data) {
    return function create(next) {
      Model.create(data, next);
    };
  }

  function replicateExpectingSuccess(source, target, since) {
    if (!source) source = SourceModel;
    if (!target) target = TargetModel;

    return function doReplicate(next) {
      replicate(source, target, since, function(err, conflicts, cps) {
        if (err) return next(err);
        if (conflicts.length) {
          return next(new Error('Unexpected conflicts\n' +
            conflicts.map(JSON.stringify).join('\n')));
        }
        next();
      });
    };
  }

  function setupRaceConditionInReplication(fn) {
    var bulkUpdate = TargetModel.bulkUpdate;
    TargetModel.bulkUpdate = function(data, cb) {
      // simulate the situation when a 3rd party modifies the database
      // while a replication run is in progress
      var self = this;
      fn(function(err) {
        if (err) return cb(err);
        bulkUpdate.call(self, data, cb);
      });

      // apply the 3rd party modification only once
      TargetModel.bulkUpdate = bulkUpdate;
    };
  }

  function verifyInstanceWasReplicated(source, target, id) {
    return function verify(next) {
      source.findById(id, function(err, expected) {
        if (err) return next(err);
        target.findById(id, function(err, actual) {
          if (err) return next(err);
          expect(actual && actual.toObject())
            .to.eql(expected && expected.toObject());
          debug('replicated instance: %j', actual);
          next();
        });
      });
    };
  }

  function spyAndStoreSinceArg(Model, methodName, store) {
    var orig = Model[methodName];
    Model[methodName] = function(since) {
      store.push(since);
      orig.apply(this, arguments);
    };
  }

  function getPropValue(obj, name) {
    return Array.isArray(obj) ?
      obj.map(function(it) { return getPropValue(it, name); }) :
      obj[name];
  }

  function getIds(list) {
    return getPropValue(list, 'id');
  }
});
