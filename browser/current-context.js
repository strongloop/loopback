// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

module.exports = function(loopback) {
  loopback.getCurrentContext = function() {
    return null;
  };

  loopback.runInContext =
  loopback.createContext = function() {
    throw new Error('Current context is not supported in the browser.');
  };
};
