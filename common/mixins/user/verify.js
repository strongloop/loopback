var utils = require('../../../lib/utils');

var crypto = require('crypto');
var path = require('path');

var debug = require('debug')('loopback:user:verify');

module.exports = function(User, options) {
  options = (options || {});

  User.defineProperty('emailVerified', {type: Boolean});
  User.defineProperty('verificationToken', {type: String});

  User.once('setup', function(UserModel) {

    // Make sure emailVerified is not set by creation
    UserModel.beforeRemote('create', function(ctx, user, next) {
      var body = ctx.req.body;
      if (body && body.emailVerified) {
        body.emailVerified = false;
      }
      next();
    });

    UserModel.remoteMethod(
      'confirm',
      {
        description: 'Confirm a user registration with email verification token',
        accepts: [
          {arg: 'uid', type: 'string', required: true},
          {arg: 'token', type: 'string', required: true},
          {arg: 'redirect', type: 'string'}
        ],
        http: {verb: 'get', path: '/confirm'}
      }
    );

    UserModel.afterRemote('confirm', function(ctx, inst, next) {
      if (ctx.args.redirect !== undefined) {
        if (!ctx.res) {
          return next(new Error('The transport does not support HTTP redirects.'));
        }
        ctx.res.location(ctx.args.redirect);
        ctx.res.status(302);
      }
      next();
    });

    UserModel.registry.configureModel(UserModel, {acls: [
      {
        principalType: 'ROLE',
        principalId: '$everyone',
        permission: 'ALLOW',
        property: 'confirm'
      }
    ], dataSource: UserModel.dataSource});
  });

  /**
   * Verify a user's identity by sending them a confirmation email.
   *
   * ```js
   *    var options = {
   *      type: 'email',
   *      to: user.email,
   *      template: 'verify.ejs',
   *      redirect: '/',
   *      tokenGenerator: function (user, cb) { cb('random-token'); }
   *    };
   *
   *    user.verify(options, next);
   * ```
   *
   * @options {Object} options
   * @property {String} type Must be 'email'.
   * @property {String} to Email address to which verification email is sent.
   * @property {String} from Sender email addresss, for example
   *   `'noreply@myapp.com'`.
   * @property {String} subject Subject line text.
   * @property {String} text Text of email.
   * @property {String} template Name of template that displays verification
   *  page, for example, `'verify.ejs'.
   * @property {String} redirect Page to which user will be redirected after
   *  they verify their email, for example `'/'` for root URI.
   * @property {Function} generateVerificationToken A function to be used to
   *  generate the verification token. It must accept the user object and a
   *  callback function. This function should NOT add the token to the user
   *  object, instead simply execute the callback with the token! User saving
   *  and email sending will be handled in the `verify()` method.
   */

  User.prototype.verify = function(options, fn) {
    fn = fn || utils.createPromiseCallback();
    var user = this;
    var userModel = this.constructor;
    var registry = userModel.registry;
    assert(typeof options === 'object', 'options required when calling user.verify()');
    assert(options.type, 'You must supply a verification type (options.type)');
    assert(options.type === 'email', 'Unsupported verification type');
    assert(options.to || this.email, 'Must include options.to when calling user.verify() or the user must have an email property');
    assert(options.from, 'Must include options.from when calling user.verify() or the user must have an email property');

    options.redirect = options.redirect || '/';
    options.template = path.resolve(options.template || path.join(__dirname, '..', '..', '..', 'templates', 'verify.ejs'));
    options.user = this;
    options.protocol = options.protocol || 'http';

    var app = userModel.app;
    options.host = options.host || (app && app.get('host')) || 'localhost';
    options.port = options.port || (app && app.get('port')) || 3000;
    options.restApiRoot = options.restApiRoot || (app && app.get('restApiRoot')) || '/api';
    options.verifyHref = options.verifyHref ||
      options.protocol +
      '://' +
      options.host +
      ':' +
      options.port +
      options.restApiRoot +
      userModel.http.path +
      userModel.sharedClass.find('confirm', true).http.path +
      '?uid=' +
      options.user.id +
      '&redirect=' +
      options.redirect;

    // Email model
    var Email = options.mailer || this.constructor.email || registry.getModelByType(loopback.Email);

    // Set a default token generation function if one is not provided
    var tokenGenerator = options.generateVerificationToken || User.generateVerificationToken;

    tokenGenerator(user, function(err, token) {
      if (err) { return fn(err); }

      user.verificationToken = token;
      user.save(function(err) {
        if (err) {
          fn(err);
        } else {
          sendEmail(user);
        }
      });
    });

    // TODO - support more verification types
    function sendEmail(user) {
      options.verifyHref += '&token=' + user.verificationToken;

      options.text = options.text || 'Please verify your email by opening this link in a web browser:\n\t{href}';

      options.text = options.text.replace('{href}', options.verifyHref);

      options.to = options.to || user.email;

      options.subject = options.subject || 'Thanks for Registering';

      options.headers = options.headers || {};

      var template = loopback.template(options.template);
      options.html = template(options);

      Email.send(options, function(err, email) {
        if (err) {
          fn(err);
        } else {
          fn(null, {email: email, token: user.verificationToken, uid: user.id});
        }
      });
    }
    return fn.promise;
  };

  /**
   * A default verification token generator which accepts the user the token is
   * being generated for and a callback function to indicate completion.
   * This one uses the crypto library and 64 random bytes (converted to hex)
   * for the token. When used in combination with the user.verify() method this
   * function will be called with the `user` object as it's context (`this`).
   *
   * @param {object} user The User this token is being generated for.
   * @param {Function} cb The generator must pass back the new token with this function call
   */
  User.generateVerificationToken = function(user, cb) {
    crypto.randomBytes(64, function(err, buf) {
      cb(err, buf && buf.toString('hex'));
    });
  };

  /**
   * Confirm the user's identity.
   *
   * @param {Any} userId
   * @param {String} token The validation token
   * @param {String} redirect URL to redirect the user to once confirmed
   * @callback {Function} callback
   * @param {Error} err
   */
  User.confirm = function(uid, token, redirect, fn) {
    fn = fn || utils.createPromiseCallback();
    this.findById(uid, function(err, user) {
      if (err) {
        fn(err);
      } else {
        if (user && user.verificationToken === token) {
          user.verificationToken = undefined;
          user.emailVerified = true;
          user.save(function(err) {
            if (err) {
              fn(err);
            } else {
              fn();
            }
          });
        } else {
          if (user) {
            err = new Error('Invalid token: ' + token);
            err.statusCode = 400;
            err.code = 'INVALID_TOKEN';
          } else {
            err = new Error('User not found: ' + uid);
            err.statusCode = 404;
            err.code = 'USER_NOT_FOUND';
          }
          fn(err);
        }
      }
    });
    return fn.promise;
  };

};
