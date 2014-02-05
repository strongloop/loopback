/**
 * Module Dependencies.
 */

var Model = require('../loopback').Model
  , loopback = require('../loopback')
  , crypto = require('crypto')
  , CJSON = {stringify: require('canonical-json')}
  , async = require('async')
  , assert = require('assert');

/**
 * Properties
 */

var properties = {
  id: {type: String, id: true},
  rev: {type: String},
  prev: {type: String},
  checkpoint: {type: Number},
  modelName: {type: String},
  modelId: {type: String}
};

/**
 * Options
 */

var options = {
  trackChanges: false,
  strict: true
};

/**
 * Change list entry.
 *
 * @property id {String} Hash of the modelName and id
 * @property rev {String} the current model revision
 * @property prev {String} the previous model revision
 * @property checkpoint {Number} the current checkpoint at time of the change
 * @property modelName {String}  the model name
 * @property modelId {String} the model id
 * 
 * @class
 * @inherits {Model}
 */

var Change = module.exports = Model.extend('Change', properties, options);

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
  var Change = this;

  Change.getter.id = function() {
    var hasModel = this.modelName && this.modelId;
    if(!hasModel) return null;

    return Change.idForModel(this.modelName, this.modelId);
  }
}
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

Change.track = function(modelName, modelIds, callback) {
  var tasks = [];
  var Change = this;

  modelIds.forEach(function(id) {
    tasks.push(function(cb) {
      Change.findOrCreate(modelName, id, function(err, change) {
        if(err) return Change.handleError(err, cb);
        change.rectify(cb);
      });
    });
  });
  async.parallel(tasks, callback);
}

/**
 * Get an identifier for a given model.
 * 
 * @param  {String} modelName
 * @param  {String} modelId 
 * @return {String}
 */

Change.idForModel = function(modelName, modelId) {
  return this.hash([modelName, modelId].join('-'));
}

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

Change.findOrCreate = function(modelName, modelId, callback) {
  var id = this.idForModel(modelName, modelId);
  var Change = this;

  console.log(modelId);
  
  if(!modelId) debugger;

  this.findById(id, function(err, change) {
    if(err) return callback(err);
    if(change) {
      callback(null, change);
    } else {
      var ch = new Change({
        id: id,
        modelName: modelName,
        modelId: modelId
      });
      ch.save(callback);
    }
  });
}

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

  if(this.rev) this.prev = this.rev;

  async.parallel(tasks, function(err) {
    if(err) return cb(err);
    change.save(cb);
  });

  function updateRevision(cb) {
    // get the current revision
    change.currentRevision(function(err, rev) {
      if(err) return Change.handleError(err, cb);
      change.rev = rev;
      cb();
    });
  }

  function updateCheckpoint(cb) {
    change.constructor.getCheckpointModel().current(function(err, checkpoint) {
      if(err) return Change.handleError(err);
      change.checkpoint = ++checkpoint;
      cb();
    });
  }
}

/**
 * Get a change's current revision based on current data.
 * @callback  {Function} callback
 * @param {Error} err
 * @param {String} rev The current revision
 */

Change.prototype.currentRevision = function(cb) {
  var model = this.getModelCtor();
  model.findById(this.modelId, function(err, inst) {
    if(err) return Change.handleError(err, cb);
    if(inst) {
      cb(null, Change.revisionForInst(inst));
    } else {
      cb(null, null);
    }
  });
}

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
}

/**
 * Get the revision string for the given object
 * @param  {Object} inst The data to get the revision string for
 * @return {String}      The revision string
 */

Change.revisionForInst = function(inst) {
  return this.hash(CJSON.stringify(inst));
}

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
  if(this.rev && this.prev) {
    return Change.UPDATE;
  }
  if(this.rev && !this.prev) {
    return Change.CREATE;
  }
  if(!this.rev && this.prev) {
    return Change.DELETE;
  }
  return Change.UNKNOWN;
}

/**
 * Get the `Model` class for `change.modelName`.
 * @return {Model}
 */

Change.prototype.getModelCtor = function() {
  // todo - not sure if this works with multiple data sources
  return loopback.getModel(this.modelName);
}

/**
 * Compare two changes.
 * @param  {Change} change
 * @return {Boolean}
 */

Change.prototype.equals = function(change) {
  return change.rev === this.rev;
}

/**
 * Determine if the change is based on the given change.
 * @param  {Change} change
 * @return {Boolean}
 */

Change.prototype.isBasedOn = function(change) {
  return this.prev === change.rev;
}

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
  var remoteChangeIndex = {};
  var modelIds = [];
  var Change = this;
  remoteChanges.map(function(ch) {
    ch = new Change(ch);
    modelIds.push(ch.modelId);
    remoteChangeIndex[ch.modelId] = ch;
    return ch;
  });

  // normalize `since`
  since = Number(since) || 0;
  this.find({
    where: {
      modelName: modelName,
      modelId: {inq: modelIds},
      checkpoint: {gt: since}
    }
  }, function(err, localChanges) {
    if(err) return callback(err);
    var deltas = [];
    var conflicts = [];
    var localModelIds = [];

    localChanges.forEach(function(localChange) {
      localChange = new Change(localChange);
      localModelIds.push(localChange.modelId);
      var remoteChange = remoteChangeIndex[localChange.modelId];

      if(!remoteChange) return;
      if(!localChange.equals(remoteChange)) {
        if(remoteChange.isBasedOn(localChange)) {
          deltas.push(remoteChange);
        } else {
          conflicts.push(localChange);
        }
      }
    });

    modelIds.forEach(function(id) {
      if(localModelIds.indexOf(id) === -1) {
        deltas.push(remoteChangeIndex[id]);
      }
    });

    callback(null, {
      deltas: deltas,
      conflicts: conflicts
    });
  });
}

/**
 * Correct all change list entries.
 * @param  {Function} callback
 */

Change.rectifyAll = function(cb) {
  // this should be optimized
  this.find(function(err, changes) {
    if(err) return cb(err);
    changes.forEach(function(change) {
      change.rectify();
    });
  });
}

/**
 * Get the checkpoint model.
 * @return {Checkpoint}
 */

Change.getCheckpointModel = function() {
  var checkpointModel = this.Checkpoint;
  if(checkpointModel) return checkpointModel;
  this.checkpoint = checkpointModel = require('./checkpoint').extend('checkpoint');
  checkpointModel.attachTo(this.dataSource);
  return checkpointModel;
}


/**
 * When two changes conflict a conflict is created.
 *
 * **Note: call `conflict.fetch()` to get the `target` and `source` models.
 * 
 * @param {Change} sourceChange The change object for the source model
 * @param {Change} targetChange The conflicting model's change object
 * @property {Model} source The source model instance
 * @property {Model} target The target model instance
 */

function Conflict(sourceChange, targetChange) {
  this.sourceChange = sourceChange;
  this.targetChange = targetChange;
}

Conflict.prototype.fetch = function(cb) {
  var conflict = this;
  var tasks = [
    getSourceModel,
    getTargetModel
  ];

  async.parallel(tasks, cb);

  function getSourceModel(change, cb) {
    conflict.sourceModel.getModel(function(err, model) {
      if(err) return cb(err);
      conflict.source = model;
      cb();
    });
  }

  function getTargetModel(cb) {
    conflict.targetModel.getModel(function(err, model) {
      if(err) return cb(err);
      conflict.target = model;
      cb();
    });
  }
}

Conflict.prototype.resolve = function(cb) {
  this.sourceChange.prev = this.targetChange.rev;
  this.sourceChange.save(cb);
}
