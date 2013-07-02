/**
 * Module Dependencies.
 */

var Model = require('../asteroid').Model
  , asteroid = require('../asteroid');

/**
 * Default Session properties.
 */

var properties = {
  id: {type: String, required: true},
  uid: {type: String},
  ttl: {type: Number, ttl: true}
};

/**
 * Extends from the built in `asteroid.Model` type.
 */

var Session = module.exports = Model.extend('session', properties);