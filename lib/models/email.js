/**
 * Module Dependencies.
 */

var Model = require('../loopback').Model
  , loopback = require('../loopback');

/**
 * Default Email properties.
 */

var properties = {
  to: {type: String, required: true},
  from: {type: String, required: true},
  subject: {type: String, required: true},
  text: {type: String},
  html: {type: String}
};

/**
 * Extends from the built in `loopback.Model` type.
 */

var Email = module.exports = Model.extend('email', properties);
