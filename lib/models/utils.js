/*
 * Internal utilities for models
 */
var crypto = require('crypto');
var assert = require('assert');

/**
 * Get the model class
 * @param {Function} cls The sub class
 * @param {Function} base The base class
 * @returns {Function} The resolved class
 */
function getModel(cls, base) {
  if (!cls) {
    return base;
  }
  return (cls.prototype instanceof base)? cls: base;
}

/**
 * Generate a key
 * @param {String} hmacKey The hmac key, default to 'loopback'
 * @param {String} algorithm The algorithm, default to 'sha1'
 * @param {String} encoding The string encoding, default to 'hex'
 * @returns {String} The generated key
 */
function generateKey(hmacKey, algorithm, encoding) {
  assert(hmacKey, 'HMAC key is required');
  algorithm = algorithm || 'sha1';
  encoding = encoding || 'hex';
  var hmac = crypto.createHmac(algorithm, hmacKey);
  var buf = crypto.randomBytes(32);
  hmac.update(buf);
  var key = hmac.digest(encoding);
  return key;
}

exports.getModel = getModel;
exports.generateKey = generateKey;