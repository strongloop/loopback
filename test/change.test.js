var async = require('async');
var expect = require('chai').expect;

var Change;
var TestModel;

describe('Change', function() {
  beforeEach(function() {
    var memory = loopback.createDataSource({
      connector: loopback.Memory
    });
    TestModel = loopback.PersistedModel.extend('ChangeTestModel',
      {
        id: { id: true, type: 'string', defaultFn: 'guid' }
      },
      {
        trackChanges: true
      });
    this.modelName = TestModel.modelName;
    TestModel.attachTo(memory);
    Change = TestModel.getChangeModel();
  });

  beforeEach(function(done) {
    var test = this;
    test.data = {
      foo: 'bar'
    };
    TestModel.create(test.data, function(err, model) {
      if (err) return done(err);
      test.model = model;
      test.modelId = model.id;
      test.revisionForModel = Change.revisionForInst(model);
      done();
    });
  });

  describe('Change.getCheckpointModel()', function() {
    it('Shouldnt create two models if called twice', function() {
      assert.equal(Change.getCheckpointModel(), Change.getCheckpointModel());
    });
  });

  describe('change.id', function() {
    it('should be a hash of the modelName and modelId', function() {
      var change = new Change({
        rev: 'abc',
        modelName: 'foo',
        modelId: 'bar'
      });

      var hash = Change.hash([change.modelName, change.modelId].join('-'));

      assert.equal(change.id, hash);
    });
  });

  describe('Change.rectifyModelChanges(modelName, modelIds, callback)', function() {
    describe('using an existing untracked model', function() {
      beforeEach(function(done) {
        var test = this;
        Change.rectifyModelChanges(this.modelName, [this.modelId], function(err, trackedChanges) {
          if (err) return done(err);
          done();
        });
      });

      it('should create an entry', function(done) {
        var test = this;
        Change.find(function(err, trackedChanges) {
          assert.equal(trackedChanges[0].modelId, test.modelId.toString());
          done();
        });
      });

      it('should only create one change', function(done) {
        Change.count(function(err, count) {
          assert.equal(count, 1);
          done();
        });
      });
    });
  });

  describe('Change.findOrCreateChange(modelName, modelId, callback)', function() {

    describe('when a change doesnt exist', function() {
      beforeEach(function(done) {
        var test = this;
        Change.findOrCreateChange(this.modelName, this.modelId, function(err, result) {
          if (err) return done(err);
          test.result = result;
          done();
        });
      });

      it('should create an entry', function(done) {
        var test = this;
        Change.findById(this.result.id, function(err, change) {
          if (err) return done(err);
          assert.equal(change.id, test.result.id);
          done();
        });
      });
    });

    describe('when a change does exist', function() {
      beforeEach(function(done) {
        var test = this;
        Change.create({
          modelName: test.modelName,
          modelId: test.modelId
        }, function(err, change) {
          test.existingChange = change;
          done();
        });
      });

      beforeEach(function(done) {
        var test = this;
        Change.findOrCreateChange(this.modelName, this.modelId, function(err, result) {
          if (err) return done(err);
          test.result = result;
          done();
        });
      });

      it('should find the entry', function(done) {
        var test = this;
        assert.equal(test.existingChange.id, test.result.id);
        done();
      });
    });
  });

  describe('change.rectify(callback)', function() {
    var change;
    beforeEach(function(done) {
      Change.findOrCreate(
        {
          modelName: this.modelName,
          modelId: this.modelId
        },
        function(err, ch) {
          change = ch;
          done(err);
        });
    });

    it('should create a new change with the correct revision', function(done) {
      var test = this;
      change.rectify(function(err, ch) {
        assert.equal(ch.rev, test.revisionForModel);
        done();
      });
    });

    // This test is a low-level equivalent of the test in replication.test.js
    // called "replicates multiple updates within the same CP"
    it('should merge updates within the same checkpoint', function(done) {
      var test = this;
      var originalRev = this.revisionForModel;
      var cp;

      async.series([
        rectify,
        checkpoint,
        update,
        rectify,
        update,
        rectify,
        function(next) {
          expect(change.checkpoint, 'checkpoint').to.equal(cp);
          expect(change.type(), 'type').to.equal('update');
          expect(change.prev, 'prev').to.equal(originalRev);
          expect(change.rev, 'rev').to.equal(test.revisionForModel);
          next();
        }
      ], done);

      function rectify(next) {
        change.rectify(next);
      }

      function checkpoint(next) {
        TestModel.checkpoint(function(err, inst) {
          if (err) return next(err);
          cp = inst.seq;
          next();
        });
      }

      function update(next) {
        var model = test.model;

        model.name += 'updated';
        model.save(function(err) {
          test.revisionForModel = Change.revisionForInst(model);
          next(err);
        });
      }
    });

    it('should not change checkpoint when rev is the same', function(done) {
      var test = this;
      var originalCheckpoint = change.checkpoint;
      var originalRev = change.rev;

      TestModel.checkpoint(function(err, inst) {
        if (err) return done(err);

        change.rectify(function(err, c) {
          if (err) return done(err);
          expect(c.rev, 'rev').to.equal(originalRev); // sanity check
          expect(c.checkpoint, 'checkpoint').to.equal(originalCheckpoint);
          done();
        });
      });
    });
  });

  describe('change.currentRevision(callback)', function() {
    it('should get the correct revision', function(done) {
      var test = this;
      var change = new Change({
        modelName: this.modelName,
        modelId: this.modelId
      });

      change.currentRevision(function(err, rev) {
        assert.equal(rev, test.revisionForModel);
        done();
      });
    });
  });

  describe('Change.hash(str)', function() {
    // todo(ritch) test other hashing algorithms
    it('should hash the given string', function() {
      var str = 'foo';
      var hash = Change.hash(str);
      assert(hash !== str);
      assert(typeof hash === 'string');
    });
  });

  describe('Change.revisionForInst(inst)', function() {
    it('should return the same revision for the same data', function() {
      var a = {
        b: {
          b: ['c', 'd'],
          c: ['d', 'e']
        }
      };
      var b = {
        b: {
          c: ['d', 'e'],
          b: ['c', 'd']
        }
      };

      var aRev = Change.revisionForInst(a);
      var bRev = Change.revisionForInst(b);
      assert.equal(aRev, bRev);
    });
  });

  describe('change.type()', function() {
    it('CREATE', function() {
      var change = new Change({
        rev: this.revisionForModel
      });
      assert.equal(Change.CREATE, change.type());
    });
    it('UPDATE', function() {
      var change = new Change({
        rev: this.revisionForModel,
        prev: this.revisionForModel
      });
      assert.equal(Change.UPDATE, change.type());
    });
    it('DELETE', function() {
      var change = new Change({
        prev: this.revisionForModel
      });
      assert.equal(Change.DELETE, change.type());
    });
    it('UNKNOWN', function() {
      var change = new Change();
      assert.equal(Change.UNKNOWN, change.type());
    });
  });

  describe('change.getModelCtor()', function() {
    it('should get the correct model class', function() {
      var change = new Change({
        modelName: this.modelName
      });

      assert.equal(change.getModelCtor(), TestModel);
    });
  });

  describe('change.equals(otherChange)', function() {
    it('should return true when the change is equal', function() {
      var change = new Change({
        rev: this.revisionForModel
      });

      var otherChange = new Change({
        rev: this.revisionForModel
      });

      assert.equal(change.equals(otherChange), true);
    });

    it('should return true when both changes are deletes', function() {
      var REV = 'foo';
      var change = new Change({
        rev: null,
        prev: REV,
      });

      var otherChange = new Change({
        rev: undefined,
        prev: REV
      });

      assert.equal(change.type(), Change.DELETE);
      assert.equal(otherChange.type(), Change.DELETE);

      assert.equal(change.equals(otherChange), true);
    });
  });

  describe('change.isBasedOn(otherChange)', function() {
    it('should return true when the change is based on the other', function() {
      var change = new Change({
        prev: this.revisionForModel
      });

      var otherChange = new Change({
        rev: this.revisionForModel
      });

      assert.equal(change.isBasedOn(otherChange), true);
    });
  });

  describe('Change.diff(modelName, since, remoteChanges, callback)', function() {
    beforeEach(function(done) {
      Change.create([
        {rev: 'foo', modelName: this.modelName, modelId: 9, checkpoint: 1},
        {rev: 'bar', modelName: this.modelName, modelId: 10, checkpoint: 1},
        {rev: 'bat', modelName: this.modelName, modelId: 11, checkpoint: 1},
      ], done);
    });

    it('should return delta and conflict lists', function(done) {
      var remoteChanges = [
        // an update => should result in a delta
        {rev: 'foo2', prev: 'foo', modelName: this.modelName, modelId: 9, checkpoint: 1},
        // no change => should not result in a delta / conflict
        {rev: 'bar', prev: 'bar', modelName: this.modelName, modelId: 10, checkpoint: 1},
        // a conflict => should result in a conflict
        {rev: 'bat2', prev: 'bat0', modelName: this.modelName, modelId: 11, checkpoint: 1},
      ];

      Change.diff(this.modelName, 0, remoteChanges, function(err, diff) {
        if (err) return done(err);
        assert.equal(diff.deltas.length, 1);
        assert.equal(diff.conflicts.length, 1);
        done();
      });
    });

    it('should set "prev" to local revision in non-conflicting delta', function(done) {
      var updateRecord = {
        rev: 'foo-new',
        prev: 'foo',
        modelName: this.modelName,
        modelId: '9',
        checkpoint: 2
      };
      Change.diff(this.modelName, 0, [updateRecord], function(err, diff) {
        if (err) return done(err);
        expect(diff.conflicts, 'conflicts').to.have.length(0);
        expect(diff.deltas, 'deltas').to.have.length(1);
        var actual = diff.deltas[0].toObject();
        delete actual.id;
        expect(actual).to.eql({
          checkpoint: 2,
          modelId: '9',
          modelName: updateRecord.modelName,
          prev: 'foo', // this is the current local revision
          rev: 'foo-new',
        });
        done();
      });
    });

    it('should set "prev" to local revision in remote-only delta', function(done) {
      var updateRecord = {
        rev: 'foo-new',
        prev: 'foo-prev',
        modelName: this.modelName,
        modelId: '9',
        checkpoint: 2
      };
      // IMPORTANT: the diff call excludes the local change
      // with rev=foo CP=1
      Change.diff(this.modelName, 2, [updateRecord], function(err, diff) {
        if (err) return done(err);
        expect(diff.conflicts, 'conflicts').to.have.length(0);
        expect(diff.deltas, 'deltas').to.have.length(1);
        var actual = diff.deltas[0].toObject();
        delete actual.id;
        expect(actual).to.eql({
          checkpoint: 2,
          modelId: '9',
          modelName: updateRecord.modelName,
          prev: 'foo', // this is the current local revision
          rev: 'foo-new',
        });
        done();
      });
    });

    it('should set "prev" to null for a new instance', function(done) {
      var updateRecord = {
        rev: 'new-rev',
        prev: 'new-prev',
        modelName: this.modelName,
        modelId: 'new-id',
        checkpoint: 2
      };

      Change.diff(this.modelName, 0, [updateRecord], function(err, diff) {
        if (err) return done(err);
        expect(diff.conflicts).to.have.length(0);
        expect(diff.deltas).to.have.length(1);
        var actual = diff.deltas[0].toObject();
        delete actual.id;
        expect(actual).to.eql({
          checkpoint: 2,
          modelId: 'new-id',
          modelName: updateRecord.modelName,
          prev: null, // this is the current local revision
          rev: 'new-rev',
        });
        done();
      });
    });
  });
});
