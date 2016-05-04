// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

exports.createPromiseCallback = createPromiseCallback;

function createPromiseCallback() {
  var cb;

  if (!global.Promise) {
    cb = function() {};
    cb.promise = {};
    Object.defineProperty(cb.promise, 'then', { get: throwPromiseNotDefined });
    Object.defineProperty(cb.promise, 'catch', { get: throwPromiseNotDefined });
    return cb;
  }

  var promise = new global.Promise(function(resolve, reject) {
    cb = function(err, data) {
      if (err) return reject(err);
      return resolve(data);
    };
  });
  cb.promise = promise;
  return cb;
}

function throwPromiseNotDefined() {
  throw new Error(
    'Your Node runtime does support ES6 Promises. ' +
    'Set "global.Promise" to your preferred implementation of promises.');
}
