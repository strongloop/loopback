// Copyright IBM Corp. 2014,2018. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

/**
 * Module Dependencies.
 */

'use strict';
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
   * @param {Number} checkpoint The current checkpoint seq
   */
  Checkpoint.current = function(cb) {
    var Checkpoint = this;
    Checkpoint._getSingleton(function(err, cp) {
      cb(err, cp.seq);
    });
  };

  Checkpoint._getSingleton = function(cb) {
    var query = {limit: 1}; // match all instances, return only one
    var initialData = {seq: 1};
    this.findOrCreate(query, initialData, cb);
  };

  /**
   * Increase the current checkpoint if it already exists otherwise initialize it
   * @callback {Function} callback
   * @param {Error} err
   * @param {Object} checkpoint The current checkpoint
   */
  Checkpoint.bumpLastSeq = function(cb) {
    var Checkpoint = this;
    Checkpoint._getSingleton(function(err, cp) {
      if (err) return cb(err);
      var originalSeq = cp.seq;
      cp.seq++;
      // Update the checkpoint but only if it was not changed under our hands
      Checkpoint.updateAll({id: cp.id, seq: originalSeq}, {seq: cp.seq}, function(err, info) {
        if (err) return cb(err);
        // possible outcomes
        // 1) seq was updated to seq+1 - exactly what we wanted!
        // 2) somebody else already updated seq to seq+1 and our call was a no-op.
        //   That should be ok, checkpoints are time based, so we reuse the one created just now
        //  3) seq was bumped more than once, so we will be using a value that is behind the latest seq.
        //    @bajtos is not entirely sure if this is ok, but since it wasn't handled by the current implementation either,
        //    he thinks we can keep it this way.
        cb(null, cp);
      });
    });
  };
};
