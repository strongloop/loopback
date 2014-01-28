/**
 * Module Dependencies.
 */

var Model = require('../loopback').Model
  , loopback = require('../loopback')
  , assert = require('assert');

/**
 * Properties
 */

var properties = {
  id: {type: Number, generated: true, id: true},
  time: {type: Number, generated: true, default: Date.now},
  sourceId: {type: String}
};

/**
 * Options
 */

var options = {

};

/**
 * Checkpoint list entry.
 *
 * @property id {Number} the sequencial identifier of a checkpoint
 * @property time {Number} the time when the checkpoint was created
 * @property sourceId {String}  the source identifier
 * 
 * @class
 * @inherits {Model}
 */

var Checkpoint = module.exports = Model.extend('Checkpoint', properties, options);

/**
 * Get the current checkpoint id
 * @callback {Function} callback
 * @param {Error} err
 * @param {Number} checkpointId The current checkpoint id
 */

Checkpoint.current = function(cb) {
  this.find({
    limit: 1,
    sort: 'id DESC'
  }, function(err, checkpoints) {
    if(err) return cb(err);
    var checkpoint = checkpoints[0] || {id: 0};
    cb(null, checkpoint.id);
  });
}

