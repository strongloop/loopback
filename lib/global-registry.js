module.exports = function() {
  var Registry = require('./registry');
  var registry = global.__LOOPBACK_GLOBAL_REGISTRY__;
  if (!registry) {
    registry = global.__LOOPBACK_GLOBAL_REGISTRY__ = new Registry();
  }
  return registry;
};
