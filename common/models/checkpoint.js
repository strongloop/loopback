/**
 * Module Dependencies.
 */

var assert = require('assert');

/**
 * Checkpoint list entry.
 *
 * @property id {Number} the sequencial identifier of a checkpoint
 * @property time {Number} the time when the checkpoint was created
 * @property sourceId {String}  the source identifier
 *
 * @class Checkpoint
 * @inherits {PersistedModel}
 */

module.exports = function(Checkpoint) {

  // Workaround for https://github.com/strongloop/loopback/issues/292
  Checkpoint.definition.rawProperties.time.default =
    Checkpoint.definition.properties.time.default = function() {
      return new Date();
    };

  /**
   * Get the current checkpoint id
   * @callback {Function} callback
   * @param {Error} err
   * @param {Number} checkpointId The current checkpoint id
   */

  Checkpoint.current = function(cb) {
    var Checkpoint = this;
    this.find({
      limit: 1,
      order: 'seq DESC'
    }, function(err, checkpoints) {
      if (err) return cb(err);
      var checkpoint = checkpoints[0];
      if (checkpoint) {
        cb(null, checkpoint.seq);
      } else {
        Checkpoint.create({seq: 0}, function(err, checkpoint) {
          if (err) return cb(err);
          cb(null, checkpoint.seq);
        });
      }
    });
  };

  Checkpoint.beforeSave = function(next, model) {
    if (!model.getId() && model.seq === undefined) {
      model.constructor.current(function(err, seq) {
        if (err) return next(err);
        model.seq = seq + 1;
        next();
      });
    } else {
      next();
    }
  };
};
