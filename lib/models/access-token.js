/**
 * Module Dependencies.
 */

var Model = require('../loopback').Model
  , loopback = require('../loopback')
  , crypto = require('crypto')
  , uid = require('uid2')
  , DEFAULT_TOKEN_LEN = 64;

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

var AccessToken = module.exports = Model.extend('AccessToken', properties);

/**
 * Create a cryptographically random access token id.
 * 
 * @param {Function} callback
 */

AccessToken.createAccessTokenId = function (fn) {
  uid(this.settings.accessTokenIdLength || DEFAULT_TOKEN_LEN, function(err, guid) {
    if(err) {
      fn(err);
    } else {
      fn(null, guid);
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

/**
 * Find a token for the given `ServerRequest`.
 *
 * @param {ServerRequest} req
 * @param {Object} [options] Options for finding the token
 * @param {Function} callback Calls back with a token if one exists otherwise null or an error.
 */

AccessToken.findForRequest = function(req, options, cb) {
  var id = tokenIdForRequest(req, options);

  if(id) {
    this.findById(id, cb);
  } else {
    process.nextTick(function() {
      cb();
    });
  }
}

function tokenIdForRequest(req, options) {
  var params = options.params || [];
  var headers = options.headers || [];
  var cookies = options.cookies || [];
  var i = 0;
  var length;
  var id;

  params.push('access_token');
  headers.push('X-Access-Token');
  headers.push('authorization');
  cookies.push('access_token');
  cookies.push('authorization');

  for(length = params.length; i < length; i++) {
    id = req.param(params[i]);

    if(typeof id === 'string') {
      return id;
    }
  }

  for(i = 0, length = headers.length; i < length; i++) {
    id = req.header(headers[i]);

    if(typeof id === 'string') {
      return id;
    }
  }

  for(i = 0, length = headers.length; i < length; i++) {
    id = req.signedCookies[cookies[i]];

    if(typeof id === 'string') {
      return id;
    }
  }

  return null;
}
