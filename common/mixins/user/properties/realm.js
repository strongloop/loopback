
var debug = require('debug')('loopback:user:properties:realm');

module.exports = function(User, options) {
  options.realm = (options.realm || {attribute: 'realm', required: false});

  debug('options.realm', options.realm);

  User.defineProperty(options.realm.attribute, {type: String, required: options.realm.required});
};
