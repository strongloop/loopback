/**
 * Module Dependencies.
 */

var Model = require('../loopback').Model
  , loopback = require('../loopback')
  , crypto = require('crypto');

/**
 * Default AccessToken properties.
 */

var properties = {
  id: {type: String, generated: true, id: 1},
  uid: {type: String},
  ttl: {type: Number, ttl: true}
};

/**
 * Extends from the built in `loopback.Model` type.
 */

var AccessToken = module.exports = Model.extend('access-token', properties);

/**
 * Create a cryptographically random access token id.
 * 
 * @param {Function} callback
 */

AccessToken.createAccessTokenId = function (fn) {
  crypto.randomBytes(this.settings.accessTokenIdLength || 64, function(err, buf) {
    if(err) {
      fn(err);
    } else {
      fn(null, buf.toString('base64'));
    }
  });
}

/*!
 * Hook to create accessToken id.
 */

AccessToken.beforeCreate = function (next, data) {
  data = data || {};
  
  AccessToken.createAccessTokenId(function (err, id) {
    if(err) {
      next(err);
    } else {
      data.id = id;
      next();
    }
  });
}
