/*!
 * Module Dependencies.
 */

var PersistedModel = require('../../lib/loopback').PersistedModel;
var loopback = require('../../lib/loopback');
var crypto = require('crypto');
var CJSON = {stringify: require('canonical-json')};
var async = require('async');
var assert = require('assert');
var debug = require('debug')('loopback:change');

/**
 * Change list entry.
 *
 * @property {String} id Hash of the modelName and id
 * @property {String} rev The current model revision
 * @property {String} prev The previous model revision
 * @property {Number} checkpoint The current checkpoint at time of the change
 * @property {String} modelName Model name
 * @property {String} modelId Model ID
 *
 * @class Change
 * @inherits {PersistedModel}
 */

module.exports = function(Change) {

  /*!
   * Constants
   */

  Change.UPDATE = 'update';
  Change.CREATE = 'create';
  Change.DELETE = 'delete';
  Change.UNKNOWN = 'unknown';

  /*!
   * Conflict Class
   */

  Change.Conflict = Conflict;

  /*!
   * Setup the extended model.
   */

  Change.setup = function() {
    PersistedModel.setup.call(this);
    var Change = this;

    Change.getter.id = function() {
      var hasModel = this.modelName && this.modelId;
      if (!hasModel) return null;

      return Change.idForModel(this.modelName, this.modelId);
    };
  };
  Change.setup();

  /**
   * Track the recent change of the given modelIds.
   *
   * @param  {String}   modelName
   * @param  {Array}    modelIds
   * @callback {Function} callback
   * @param {Error} err
   * @param {Array} changes Changes that were tracked
   */

  Change.rectifyModelChanges = function(modelName, modelIds, callback) {
    var tasks = [];
    var Change = this;

    modelIds.forEach(function(id) {
      tasks.push(function(cb) {
        Change.findOrCreateChange(modelName, id, function(err, change) {
          if (err) return Change.handleError(err, cb);
          change.rectify(cb);
        });
      });
    });
    async.parallel(tasks, callback);
  };

  /**
   * Get an identifier for a given model.
   *
   * @param  {String} modelName
   * @param  {String} modelId
   * @return {String}
   */

  Change.idForModel = function(modelName, modelId) {
    return this.hash([modelName, modelId].join('-'));
  };

  /**
   * Find or create a change for the given model.
   *
   * @param  {String}   modelName
   * @param  {String}   modelId
   * @callback  {Function} callback
   * @param {Error} err
   * @param {Change} change
   * @end
   */

  Change.findOrCreateChange = function(modelName, modelId, callback) {
    assert(loopback.findModel(modelName), modelName + ' does not exist');
    var id = this.idForModel(modelName, modelId);
    var Change = this;

    this.findById(id, function(err, change) {
      if (err) return callback(err);
      if (change) {
        callback(null, change);
      } else {
        var ch = new Change({
          id: id,
          modelName: modelName,
          modelId: modelId
        });
        ch.debug('creating change');
        ch.save(callback);
      }
    });
  };

  /**
   * Update (or create) the change with the current revision.
   *
   * @callback {Function} callback
   * @param {Error} err
   * @param {Change} change
   */

  Change.prototype.rectify = function(cb) {
    var change = this;
    var tasks = [
      updateRevision,
      updateCheckpoint
    ];
    var currentRev = this.rev;

    change.debug('rectify change');

    cb = cb || function(err) {
      if (err) throw new Error(err);
    };

    async.parallel(tasks, function(err) {
      if (err) return cb(err);
      if (change.prev === Change.UNKNOWN) {
        // this occurs when a record of a change doesn't exist
        // and its current revision is null (not found)
        change.remove(cb);
      } else {
        change.save(cb);
      }
    });

    function updateRevision(cb) {
      // get the current revision
      change.currentRevision(function(err, rev) {
        if (err) return Change.handleError(err, cb);
        if (rev) {
          // avoid setting rev and prev to the same value
          if (currentRev !== rev) {
            change.rev = rev;
            change.prev = currentRev;
          } else {
            change.debug('rev and prev are equal (not updating rev)');
          }
        } else {
          change.rev = null;
          if (currentRev) {
            change.prev = currentRev;
          } else if (!change.prev) {
            change.debug('ERROR - could not determing prev');
            change.prev = Change.UNKNOWN;
          }
        }
        change.debug('updated revision (was ' + currentRev + ')');
        cb();
      });
    }

    function updateCheckpoint(cb) {
      change.constructor.getCheckpointModel().current(function(err, checkpoint) {
        if (err) return Change.handleError(err);
        change.checkpoint = checkpoint;
        cb();
      });
    }
  };

  /**
   * Get a change's current revision based on current data.
   * @callback  {Function} callback
   * @param {Error} err
   * @param {String} rev The current revision
   */

  Change.prototype.currentRevision = function(cb) {
    var model = this.getModelCtor();
    var id = this.getModelId();
    model.findById(id, function(err, inst) {
      if (err) return Change.handleError(err, cb);
      if (inst) {
        cb(null, Change.revisionForInst(inst));
      } else {
        cb(null, null);
      }
    });
  };

  /**
   * Create a hash of the given `string` with the `options.hashAlgorithm`.
   * **Default: `sha1`**
   *
   * @param  {String} str The string to be hashed
   * @return {String}     The hashed string
   */

  Change.hash = function(str) {
    return crypto
      .createHash(Change.settings.hashAlgorithm || 'sha1')
      .update(str)
      .digest('hex');
  };

  /**
   * Get the revision string for the given object
   * @param  {Object} inst The data to get the revision string for
   * @return {String}      The revision string
   */

  Change.revisionForInst = function(inst) {
    return this.hash(CJSON.stringify(inst));
  };

  /**
   * Get a change's type. Returns one of:
   *
   * - `Change.UPDATE`
   * - `Change.CREATE`
   * - `Change.DELETE`
   * - `Change.UNKNOWN`
   *
   * @return {String} the type of change
   */

  Change.prototype.type = function() {
    if (this.rev && this.prev) {
      return Change.UPDATE;
    }
    if (this.rev && !this.prev) {
      return Change.CREATE;
    }
    if (!this.rev && this.prev) {
      return Change.DELETE;
    }
    return Change.UNKNOWN;
  };

  /**
   * Compare two changes.
   * @param  {Change} change
   * @return {Boolean}
   */

  Change.prototype.equals = function(change) {
    if (!change) return false;
    var thisRev = this.rev || null;
    var thatRev = change.rev || null;
    return thisRev === thatRev;
  };

  /**
   * Does this change conflict with the given change.
   * @param  {Change} change
   * @return {Boolean}
   */

  Change.prototype.conflictsWith = function(change) {
    if (!change) return false;
    if (this.equals(change)) return false;
    if (Change.bothDeleted(this, change)) return false;
    if (this.isBasedOn(change)) return false;
    return true;
  };

  /**
   * Are both changes deletes?
   * @param  {Change} a
   * @param  {Change} b
   * @return {Boolean}
   */

  Change.bothDeleted = function(a, b) {
    return a.type() === Change.DELETE &&
      b.type() === Change.DELETE;
  };

  /**
   * Determine if the change is based on the given change.
   * @param  {Change} change
   * @return {Boolean}
   */

  Change.prototype.isBasedOn = function(change) {
    return this.prev === change.rev;
  };

  /**
   * Determine the differences for a given model since a given checkpoint.
   *
   * The callback will contain an error or `result`.
   *
   * **result**
   *
   * ```js
   * {
 *   deltas: Array,
 *   conflicts: Array
 * }
   * ```
   *
   * **deltas**
   *
   * An array of changes that differ from `remoteChanges`.
   *
   * **conflicts**
   *
   * An array of changes that conflict with `remoteChanges`.
   *
   * @param  {String}   modelName
   * @param  {Number}   since         Compare changes after this checkpoint
   * @param  {Change[]} remoteChanges A set of changes to compare
   * @callback  {Function} callback
   * @param {Error} err
   * @param {Object} result See above.
   */

  Change.diff = function(modelName, since, remoteChanges, callback) {
    if (!Array.isArray(remoteChanges) || remoteChanges.length === 0) {
      return callback(null, {deltas: [], conflicts: []});
    }
    var remoteChangeIndex = {};
    var modelIds = [];
    remoteChanges.forEach(function(ch) {
      modelIds.push(ch.modelId);
      remoteChangeIndex[ch.modelId] = new Change(ch);
    });

    // normalize `since`
    since = Number(since) || 0;
    this.find({
      where: {
        modelName: modelName,
        modelId: {inq: modelIds},
        checkpoint: {gte: since}
      }
    }, function(err, localChanges) {
      if (err) return callback(err);
      var deltas = [];
      var conflicts = [];
      var localModelIds = [];

      localChanges.forEach(function(localChange) {
        localChange = new Change(localChange);
        localModelIds.push(localChange.modelId);
        var remoteChange = remoteChangeIndex[localChange.modelId];
        if (remoteChange && !localChange.equals(remoteChange)) {
          if (remoteChange.conflictsWith(localChange)) {
            remoteChange.debug('remote conflict');
            localChange.debug('local conflict');
            conflicts.push(localChange);
          } else {
            remoteChange.debug('remote delta');
            deltas.push(remoteChange);
          }
        }
      });

      modelIds.forEach(function(id) {
        if (localModelIds.indexOf(id) === -1) {
          deltas.push(remoteChangeIndex[id]);
        }
      });

      callback(null, {
        deltas: deltas,
        conflicts: conflicts
      });
    });
  };

  /**
   * Correct all change list entries.
   * @param {Function} cb
   */

  Change.rectifyAll = function(cb) {
    debug('rectify all');
    var Change = this;
    // this should be optimized
    this.find(function(err, changes) {
      if (err) return cb(err);
      changes.forEach(function(change) {
        change.rectify();
      });
    });
  };

  /**
   * Get the checkpoint model.
   * @return {Checkpoint}
   */

  Change.getCheckpointModel = function() {
    var checkpointModel = this.Checkpoint;
    if (checkpointModel) return checkpointModel;
    this.Checkpoint = checkpointModel = loopback.Checkpoint.extend('checkpoint');
    assert(this.dataSource, 'Cannot getCheckpointModel(): ' + this.modelName
      + ' is not attached to a dataSource');
    checkpointModel.attachTo(this.dataSource);
    return checkpointModel;
  };

  Change.handleError = function(err) {
    if (!this.settings.ignoreErrors) {
      throw err;
    }
  };

  Change.prototype.debug = function() {
    if (debug.enabled) {
      var args = Array.prototype.slice.call(arguments);
      debug.apply(this, args);
      debug('\tid', this.id);
      debug('\trev', this.rev);
      debug('\tprev', this.prev);
      debug('\tmodelName', this.modelName);
      debug('\tmodelId', this.modelId);
      debug('\ttype', this.type());
    }
  };

  /**
   * Get the `Model` class for `change.modelName`.
   * @return {Model}
   */

  Change.prototype.getModelCtor = function() {
    return this.constructor.settings.trackModel;
  };

  Change.prototype.getModelId = function() {
    // TODO(ritch) get rid of the need to create an instance
    var Model = this.getModelCtor();
    var id = this.modelId;
    var m = new Model();
    m.setId(id);
    return m.getId();
  };

  Change.prototype.getModel = function(callback) {
    var Model = this.constructor.settings.trackModel;
    var id = this.getModelId();
    Model.findById(id, callback);
  };

  /**
   * When two changes conflict a conflict is created.
   *
   * **Note**: call `conflict.fetch()` to get the `target` and `source` models.
   *
   * @param {*} modelId
   * @param {PersistedModel} SourceModel
   * @param {PersistedModel} TargetModel
   * @property {ModelClass} source The source model instance
   * @property {ModelClass} target The target model instance
   * @class Change.Conflict
   */

  function Conflict(modelId, SourceModel, TargetModel) {
    this.SourceModel = SourceModel;
    this.TargetModel = TargetModel;
    this.SourceChange = SourceModel.getChangeModel();
    this.TargetChange = TargetModel.getChangeModel();
    this.modelId = modelId;
  }

  /**
   * Fetch the conflicting models.
   *
   * @callback {Function} callback
   * @param {Error} err
   * @param {PersistedModel} source
   * @param {PersistedModel} target
   */

  Conflict.prototype.models = function(cb) {
    var conflict = this;
    var SourceModel = this.SourceModel;
    var TargetModel = this.TargetModel;
    var source;
    var target;

    async.parallel([
      getSourceModel,
      getTargetModel
    ], done);

    function getSourceModel(cb) {
      SourceModel.findById(conflict.modelId, function(err, model) {
        if (err) return cb(err);
        source = model;
        cb();
      });
    }

    function getTargetModel(cb) {
      TargetModel.findById(conflict.modelId, function(err, model) {
        if (err) return cb(err);
        target = model;
        cb();
      });
    }

    function done(err) {
      if (err) return cb(err);
      cb(null, source, target);
    }
  };

  /**
   * Get the conflicting changes.
   *
   * @callback {Function} callback
   * @param {Error} err
   * @param {Change} sourceChange
   * @param {Change} targetChange
   */

  Conflict.prototype.changes = function(cb) {
    var conflict = this;
    var sourceChange;
    var targetChange;

    async.parallel([
      getSourceChange,
      getTargetChange
    ], done);

    function getSourceChange(cb) {
      conflict.SourceChange.findOne({where: {
        modelId: conflict.modelId
      }}, function(err, change) {
        if (err) return cb(err);
        sourceChange = change;
        cb();
      });
    }

    function getTargetChange(cb) {
      conflict.TargetChange.findOne({where: {
        modelId: conflict.modelId
      }}, function(err, change) {
        if (err) return cb(err);
        targetChange = change;
        cb();
      });
    }

    function done(err) {
      if (err) return cb(err);
      cb(null, sourceChange, targetChange);
    }
  };

  /**
   * Resolve the conflict.
   *
   * @callback {Function} callback
   * @param {Error} err
   */

  Conflict.prototype.resolve = function(cb) {
    var conflict = this;
    conflict.changes(function(err, sourceChange, targetChange) {
      if (err) return cb(err);
      sourceChange.prev = targetChange.rev;
      sourceChange.save(cb);
    });
  };

  /**
   * Determine the conflict type.
   *
   * Possible results are
   *
   *  - `Change.UPDATE`: Source and target models were updated.
   *  - `Change.DELETE`: Source and or target model was deleted.
   *  - `Change.UNKNOWN`: the conflict type is uknown or due to an error.
   *
   * @callback {Function} callback
   * @param {Error} err
   * @param {String} type The conflict type.
   */

  Conflict.prototype.type = function(cb) {
    var conflict = this;
    this.changes(function(err, sourceChange, targetChange) {
      if (err) return cb(err);
      var sourceChangeType = sourceChange.type();
      var targetChangeType = targetChange.type();
      if (sourceChangeType === Change.UPDATE && targetChangeType === Change.UPDATE) {
        return cb(null, Change.UPDATE);
      }
      if (sourceChangeType === Change.DELETE || targetChangeType === Change.DELETE) {
        return cb(null, Change.DELETE);
      }
      return cb(null, Change.UNKNOWN);
    });
  };
};
