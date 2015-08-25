
var debug = require('debug')('loopback:user:properties:password');

module.exports = function(User, options) {
  options.password = (options.password || {attribute: 'password', required: true});

  debug('options.password', options.password);

  User.defineProperty(options.password.attribute, {type: String, required: options.password.required});
  // User.modelBuilder.hiddenProperty(User, options.password.attribute, null);
};
