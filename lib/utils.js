// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

exports.createPromiseCallback = createPromiseCallback;
exports.uploadInChunks = uploadInChunks;
exports.downloadInChunks = downloadInChunks;
exports.concatResults = concatResults;

var Promise = require('bluebird');
var async = require('async');

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
  var chunkArrays = [];

  if (!chunkSize || chunkSize < 1 || largeArray.length <= chunkSize) {
    // if chunking not required
    processFunction(largeArray, cb);
  } else {
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

        processFunction(chunkArray, function(err, results) {
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

  if (!chunkSize || chunkSize < 1) {
    // if chunking not required
    processFunction(filter, cb);
  } else {
    filter.skip = 0;
    filter.limit = chunkSize;

    processFunction(JSON.parse(JSON.stringify(filter)), pageAndConcatResults);
  }

  function pageAndConcatResults(err, pagedResults) {
    if (err) {
      return cb(err);
    } else {
      results = concatResults(results, pagedResults);
      if (pagedResults.length >= chunkSize) {
        filter.skip += pagedResults.length;
        processFunction(JSON.parse(JSON.stringify(filter)), pageAndConcatResults);
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
