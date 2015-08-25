var loopback = require('../../../../lib/loopback');

var assert = require('assert');

var debug = require('debug')('loopback:user:properties:email');

module.exports = function(User, options) {
  options = (options || {});
  options.email = (options.email || {attribute: 'email', required: true});

  debug('options.email', options.email);

  User.defineProperty(options.email.attribute, {type: String, required: options.email.required});

  User.once('setup', function(UserModel) {

    // default models
    assert(loopback.Email, 'Email model must be defined before User model');
    UserModel.email = loopback.Email;

    // email validation regex
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    UserModel.validatesFormatOf(options.email.attribute, {with: re, message: 'Must provide a valid email'});
    UserModel.validatesUniquenessOf(options.email.attribute, {message: 'Email already exists'});

  });

};
