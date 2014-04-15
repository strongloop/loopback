/*!
 * Module Dependencies.
 */

var Model = require('../loopback').Model
  , loopback = require('../loopback')
  , assert = require('assert')
  , crypto = require('crypto')
  , uid = require('uid2')
  , DEFAULT_TTL = 1209600 // 2 weeks in seconds
  , DEFAULT_TOKEN_LEN = 64
  , Role = require('./role').Role
  , ACL = require('./acl').ACL;

/*!
 * Default AccessToken properties.
 */

var properties = {
  id: {type: String, id: true},
  ttl: {type: Number, ttl: true, default: DEFAULT_TTL}, // time to live in seconds
  created: {type: Date, default: function() {
    return new Date();
  }}
};

/**
 * Token based authentication and access control.
 *
 * @property id {String} Generated token ID
 * @property ttl {Number} Time to live
 * @property created {Date} When the token was created
 * 
 * **Default ACLs**
 * 
 *  - DENY EVERYONE `*`
 *  - ALLOW EVERYONE create
 * 
 * @class
 * @inherits {Model}
 */

var AccessToken = module.exports = Model.extend('AccessToken', properties, {
  acls: [
    {
      principalType: ACL.ROLE,
      principalId: Role.EVERYONE,
      permission: 'DENY'
    },
    {
      principalType: ACL.ROLE,
      principalId: Role.EVERYONE,
      property: 'create',
      permission: 'ALLOW'
    }
  ],
  relations: {
    user: {
      type: 'belongsTo',
      model: 'User',
      foreignKey: 'userId'
    }
  }
});

/**
 * Anonymous Token
 * 
 * ```js
 * assert(AccessToken.ANONYMOUS.id === '$anonymous');
 * ```
 */

AccessToken.ANONYMOUS = new AccessToken({id: '$anonymous'});

/**
 * Create a cryptographically random access token id.
 * 
 * @callback {Function} callback
 * @param {Error} err
 * @param {String} token
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
 * @callback {Function} callback
 * @param {Error} err
 * @param {AccessToken} token
 */

AccessToken.findForRequest = function(req, options, cb) {
  var id = tokenIdForRequest(req, options);

  if(id) {
    this.findById(id, function(err, token) {
      if(err) {
        cb(err);
      } else if(token) {
        token.validate(function(err, isValid) {
          if(err) {
            cb(err);
          } else if(isValid) {
            cb(null, token);
          } else {
            cb(new Error('Invalid Access Token'));
          }
        });
      } else {
        cb();
      }
    });
  } else {
    process.nextTick(function() {
      cb();
    });
  }
}

/**
 * Validate the token.
 * 
 * @callback {Function} callback
 * @param {Error} err
 * @param {Boolean} isValid
 */

AccessToken.prototype.validate = function(cb) {
  try {
    assert(
      this.created && typeof this.created.getTime === 'function',
      'token.created must be a valid Date'
    );
    assert(this.ttl !== 0, 'token.ttl must be not be 0');
    assert(this.ttl, 'token.ttl must exist');
    assert(this.ttl >= -1, 'token.ttl must be >= -1');

    var now = Date.now();
    var created = this.created.getTime();
    var elapsedSeconds = (now - created) / 1000;
    var secondsToLive = this.ttl;
    var isValid = elapsedSeconds < secondsToLive;

    if(isValid) {
      cb(null, isValid);
    } else {
      this.destroy(function(err) {
        cb(err, isValid);
      });
    }
  } catch(e) {
    cb(e);
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

  if(req.signedCookies) {
    for(i = 0, length = headers.length; i < length; i++) {
      id = req.signedCookies[cookies[i]];

      if(typeof id === 'string') {
        return id;
      }
    }
  }
  return null;
}
