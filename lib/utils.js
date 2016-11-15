// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
exports.createPromiseCallback = createPromiseCallback;
var Promise = require('bluebird');

function createPromiseCallback() {
  var cb;
  var promise = new Promise(function(resolve, reject) {
    cb = function(err, data) {
      if (err) return reject(err);
      return resolve(data);
    };
  });
  cb.promise = promise;
  return cb;
}
