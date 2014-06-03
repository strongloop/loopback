var loopback = require('../../');

module.exports = it;

it.onServer = function itOnServer(name, fn) {
  if (loopback.isServer) {
    it(name, fn);
  } else {
    it.skip(name, fn);
  }
};

it.inBrowser = function itInBrowser(name, fn) {
  if (loopback.isBrowser) {
    it(name, fn);
  } else {
    it.skip(name, fn);
  }
};
