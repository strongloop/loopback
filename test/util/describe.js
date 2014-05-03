var loopback = require('../../');

module.exports = describe;

describe.onServer = function describeOnServer(name, fn) {
  if (loopback.isServer) {
    describe(name, fn);
  } else {
    describe.skip(name, fn);
  }
};

describe.inBrowser = function describeInBrowser(name, fn) {
  if (loopback.isBrowser) {
    describe(name, fn);
  } else {
    describe.skip(name, fn);
  }
};
