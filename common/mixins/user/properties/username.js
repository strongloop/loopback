
var debug = require('debug')('loopback:user:properties:username');

module.exports = function(User, options) {
  options = (options || {});
  options.username = (options.username || {attribute: 'username', required: false});

  debug('options.username', options.username);

  User.defineProperty(options.username.attribute, {type: String, required: options.username.required});

  User.once('setup', function(UserModel) {
    UserModel.validatesUniquenessOf(options.username.attribute, {message: 'User already exists'});
  });

};
