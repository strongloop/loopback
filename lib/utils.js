// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var async = require('async');

exports.createPromiseCallback = createPromiseCallback;
exports.uploadInChunks = uploadInChunks;
exports.downloadInChunks = downloadInChunks;
exports.concatResults = concatResults;

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

/**
 * Divide an async call with large array into multiple calls using smaller chunks
 * @param {Array} largeArray - the large array to be chunked
 * @param {Number} chunkSize - size of each chunks
 * @param {Function} processFunction - the function to be called multiple times
 * @param {Function} cb - the callback
 */
function uploadInChunks(largeArray, chunkSize, processFunction, cb) {
  var self = this;
  var chunkArrays = [];

  if (largeArray.length > chunkSize) {
    // copying so that the largeArray object does not get affected during splice
    var copyOfLargeArray = [].concat(largeArray);

    // chunking to smaller arrays
    while (copyOfLargeArray.length > 0) {
      chunkArrays.push(copyOfLargeArray.splice(0, chunkSize));
    }

    var tasks = chunkArrays.map(function(chunkArray) {
      return function(previousResults, chunkCallback) {
        var lastArg = arguments[arguments.length - 1];

        if (typeof lastArg === 'function') {
          chunkCallback = lastArg;
        }

        processFunction.call(self, chunkArray, function(err, results) {
          if (err) {
            return chunkCallback(err);
          }

          // if this is the first async waterfall call or if previous results was not defined
          if (typeof previousResults === 'function' || typeof previousResults === 'undefined' ||
            previousResults === null) {
            previousResults = results;
          } else if (results) {
            previousResults = concatResults(previousResults, results);
          }

          chunkCallback(err, previousResults);
        });
      };
    });

    async.waterfall(tasks, cb);
  } else {
    processFunction.call(self, largeArray, cb);
  }
}

/**
 * Page async download calls
 * @param {Object} filter - filter object used for the async call
 * @param {Number} chunkSize - size of each chunks
 * @param {Function} processFunction - the function to be called multiple times
 * @param {Function} cb - the callback
 */
function downloadInChunks(filter, chunkSize, processFunction, cb) {
  var results = [];
  filter = filter ? JSON.parse(JSON.stringify(filter)) : {};
  filter.skip = 0;
  filter.limit = chunkSize;

  processFunction(filter, pageAndConcatResults);

  function pageAndConcatResults(err, pagedResults) {
    if (err) {
      cb(err);
    } else {
      results = concatResults(results, pagedResults);
      if (pagedResults.length >= chunkSize) {
        filter.skip += pagedResults.length;
        processFunction(filter, pageAndConcatResults);
      } else {
        cb(null, results);
      }
    }
  }
}

/**
 * Concat current results into previous results
 * Assumption made here that the previous results and current results are homogeneous
 * @param {Object|Array} previousResults
 * @param {Object|Array} currentResults
 */
function concatResults(previousResults, currentResults) {
  if (Array.isArray(currentResults)) {
    previousResults = previousResults.concat(currentResults);
  } else if (typeof currentResults === 'object') {
    Object.keys(currentResults).forEach(function(key) {
      previousResults[key] = concatResults(previousResults[key], currentResults[key]);
    });
  } else {
    previousResults = currentResults;
  }

  return previousResults;
}
