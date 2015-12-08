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
var deprecate = require('depd')('loopback');

/**
 * Change list entry.
 *
 * @property {String} id Hash of the modelName and ID.
 * @property {String} rev The current model revision.
 * @property {String} prev The previous model revision.
 * @property {Number} checkpoint The current checkpoint at time of the change.
 * @property {String} modelName Model name.
 * @property {String} modelId Model ID.
 * @property {Object} settings Extends the `Model.settings` object.
 * @property {String} settings.hashAlgorithm Algorithm used to create cryptographic hash, used as argument
 * to [crypto.createHash](http://nodejs.org/api/crypto.html#crypto_crypto_createhash_algorithm).  Default is sha1.
 * @property {Boolean} settings.ignoreErrors By default, when changes are rectified, an error will throw an exception.
 * However, if this setting is true, then errors will not throw exceptions.
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
    var Change = this;
    var errors = [];

    var tasks = modelIds.map(function(id) {
      return function(cb) {
        Change.findOrCreateChange(modelName, id, function(err, change) {
          if (err) return next(err);
          change.rectify(next);
        });

        function next(err) {
          if (err) {
            err.modelName = modelName;
            err.modelId = id;
            errors.push(err);
          }
          cb();
        }
      };
    });

    async.parallel(tasks, function(err) {
      if (err) return callback(err);
      if (errors.length) {
        var desc = errors
          .map(function(e) {
            return '#' + e.modelId + ' - ' + e.toString();
          })
          .join('\n');

        var msg = 'Cannot rectify ' + modelName + ' changes:\n' + desc;
        err = new Error(msg);
        err.details = { errors: errors };
        return callback(err);
      }
      callback();
    });
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
        Change.updateOrCreate(ch, callback);
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
    var currentRev = this.rev;

    change.debug('rectify change');

    cb = cb || function(err) {
      if (err) throw new Error(err);
    };

    change.currentRevision(function(err, rev) {
      if (err) return cb(err);

      // avoid setting rev and prev to the same value
      if (currentRev === rev) {
        change.debug('rev and prev are equal (not updating anything)');
        return cb(null, change);
      }

      // FIXME(@bajtos) Allo callers to pass in the checkpoint value
      // (or even better - a memoized async function to get the cp value)
      // That will enable `rectifyAll` to cache the checkpoint value
      change.constructor.getCheckpointModel().current(
        function(err, checkpoint) {
          if (err) return cb(err);
          doRectify(checkpoint, rev);
        }
      );
    });

    function doRectify(checkpoint, rev) {
      if (rev) {
        if (currentRev === rev) {
          change.debug('ASSERTION FAILED: Change currentRev==rev ' +
            'should have been already handled');
          return cb(null, change);
        } else {
          change.rev = rev;
          change.debug('updated revision (was ' + currentRev + ')');
          if (change.checkpoint !== checkpoint) {
            // previous revision is updated only across checkpoints
            change.prev = currentRev;
            change.debug('updated prev');
          }
        }
      } else {
        change.rev = null;
        change.debug('updated revision (was ' + currentRev + ')');
        if (change.checkpoint !== checkpoint) {
          // previous revision is updated only across checkpoints
          if (currentRev) {
            change.prev = currentRev;
          } else if (!change.prev) {
            change.debug('ERROR - could not determing prev');
            change.prev = Change.UNKNOWN;
          }
          change.debug('updated prev');
        }
      }

      if (change.checkpoint != checkpoint) {
        debug('update checkpoint to', checkpoint);
        change.checkpoint = checkpoint;
      }

      if (change.prev === Change.UNKNOWN) {
        // this occurs when a record of a change doesn't exist
        // and its current revision is null (not found)
        change.remove(cb);
      } else {
        change.save(cb);
      }
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
      if (err) return cb(err);
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
    assert(inst, 'Change.revisionForInst() requires an instance object.');
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
        modelId: {inq: modelIds}
      }
    }, function(err, allLocalChanges) {
      if (err) return callback(err);
      var deltas = [];
      var conflicts = [];
      var localModelIds = [];

      var localChanges = allLocalChanges.filter(function(c) {
        return c.checkpoint >= since;
      });

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
        if (localModelIds.indexOf(id) !== -1) return;

        var d = remoteChangeIndex[id];
        var oldChange = allLocalChanges.filter(function(c) {
          return c.modelId === id;
        })[0];

        if (oldChange) {
          d.prev = oldChange.rev;
        } else {
          d.prev = null;
        }

        deltas.push(d);
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
      async.each(
        changes,
        function(c, next) { c.rectify(next); },
        cb);
    });
  };

  /**
   * Get the checkpoint model.
   * @return {Checkpoint}
   */

  Change.getCheckpointModel = function() {
    var checkpointModel = this.Checkpoint;
    if (checkpointModel) return checkpointModel;
    // FIXME(bajtos) This code creates multiple different models with the same
    // model name, which is not a valid supported usage of juggler's API.
    this.Checkpoint = checkpointModel = loopback.Checkpoint.extend('checkpoint');
    assert(this.dataSource, 'Cannot getCheckpointModel(): ' + this.modelName +
      ' is not attached to a dataSource');
    checkpointModel.attachTo(this.dataSource);
    return checkpointModel;
  };

  Change.handleError = function(err) {
    deprecate('Change.handleError is deprecated, ' +
      'you should pass errors to your callback instead.');

    if (!this.settings.ignoreErrors) {
      throw err;
    }
  };

  Change.prototype.debug = function() {
    if (debug.enabled) {
      var args = Array.prototype.slice.call(arguments);
      args[0] = args[0] + ' %s';
      args.push(this.modelName);
      debug.apply(this, args);
      debug('\tid', this.id);
      debug('\trev', this.rev);
      debug('\tprev', this.prev);
      debug('\tcheckpoint', this.checkpoint);
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
      var SourceModel = conflict.SourceModel;
      SourceModel.findLastChange(conflict.modelId, function(err, change) {
        if (err) return cb(err);
        sourceChange = change;
        cb();
      });
    }

    function getTargetChange(cb) {
      var TargetModel = conflict.TargetModel;
      TargetModel.findLastChange(conflict.modelId, function(err, change) {
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
   * Set the source change's previous revision to the current revision of the
   * (conflicting) target change. Since the changes are no longer conflicting
   * and appear as if the source change was based on the target, they will be
   * replicated normally as part of the next replicate() call.
   *
   * This is effectively resolving the conflict using the source version.
   *
   * @callback {Function} callback
   * @param {Error} err
   */

  Conflict.prototype.resolve = function(cb) {
    var conflict = this;
    conflict.TargetModel.findLastChange(
      this.modelId,
      function(err, targetChange) {
        if (err) return cb(err);
        conflict.SourceModel.updateLastChange(
          conflict.modelId,
          { prev: targetChange.rev },
          cb);
      });
  };

  /**
   * Resolve the conflict using the instance data in the source model.
   *
   * @callback {Function} callback
   * @param {Error} err
   */
  Conflict.prototype.resolveUsingSource = function(cb) {
    this.resolve(function(err) {
      // don't forward any cb arguments from resolve()
      cb(err);
    });
  };

  /**
   * Resolve the conflict using the instance data in the target model.
   *
   * @callback {Function} callback
   * @param {Error} err
   */
  Conflict.prototype.resolveUsingTarget = function(cb) {
    var conflict = this;

    conflict.models(function(err, source, target) {
      if (err) return done(err);
      if (target === null) {
        return conflict.SourceModel.deleteById(conflict.modelId, done);
      }
      var inst = new conflict.SourceModel(
        target.toObject(),
        { persisted: true });
      inst.save(done);
    });

    function done(err) {
      // don't forward any cb arguments from internal calls
      cb(err);
    }
  };

  /**
   * Return a new Conflict instance with swapped Source and Target models.
   *
   * This is useful when resolving a conflict in one-way
   * replication, where the source data must not be changed:
   *
   * ```js
   * conflict.swapParties().resolveUsingTarget(cb);
   * ```
   *
   * @returns {Conflict} A new Conflict instance.
   */
  Conflict.prototype.swapParties = function() {
    var Ctor = this.constructor;
    return new Ctor(this.modelId, this.TargetModel, this.SourceModel);
  };

  /**
   * Resolve the conflict using the supplied instance data.
   *
   * @param {Object} data The set of changes to apply on the model
   * instance. Use `null` value to delete the source instance instead.
   * @callback {Function} callback
   * @param {Error} err
   */

  Conflict.prototype.resolveManually = function(data, cb) {
    var conflict = this;
    if (!data) {
      return conflict.SourceModel.deleteById(conflict.modelId, done);
    }

    conflict.models(function(err, source, target) {
      if (err) return done(err);
      var inst = source || new conflict.SourceModel(target);
      inst.setAttributes(data);
      inst.save(function(err) {
        if (err) return done(err);
        conflict.resolve(done);
      });
    });

    function done(err) {
      // don't forward any cb arguments from internal calls
      cb(err);
    }
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
