module.exports = function(loopback) {
  loopback.getCurrentContext = function() {
    return null;
  };

  loopback.runInContext =
  loopback.createContext = function() {
    throw new Error('Current context is not supported in the browser.');
  };
};
