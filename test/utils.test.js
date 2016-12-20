// Copyright IBM Corp. 2013,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT
var utils = require('../lib/utils');
var assert = require('assert');

describe('Utils', function() {
  describe('uploadInChunks', function() {
    it('should call process function with the chunked arrays', function() {
      var largeArray = ['item1', 'item2', 'item3'];
      var calls = [];

      utils.uploadInChunks(largeArray, 1, processFunction, function() {
        assert.deepEqual(calls, [['item1'], ['item2'], ['item3']]);
      });

      function processFunction(array, cb) {
        calls.push(array);
        cb();
      }
    });

    it('should call process function once when array less than chunk size', function() {
      var largeArray = ['item1', 'item2'];
      var calls = [];

      utils.uploadInChunks(largeArray, 3, processFunction, function() {
        assert.deepEqual(calls, [['item1', 'item2']]);
      });

      function processFunction(array, cb) {
        calls.push(array);
        cb();
      }
    });

    it('should concat the results from each call to the process function', function() {
      var largeArray = ['item1', 'item2', 'item3', 'item4'];

      utils.uploadInChunks(largeArray, 2, processFunction, function(err, results) {
        assert.deepEqual(results, ['item1', 'item2', 'item3', 'item4']);
      });

      function processFunction(array, cb) {
        cb(null, array);
      }
    });
  });

  describe('downloadInChunks', function() {
    var largeArray, calls ,chunkSize, skip;

    beforeEach(function() {
      largeArray = ['item1', 'item2', 'item3'];
      calls = [];
      chunkSize = 2;
      skip = 0;
    });

    it('should call process function with the correct filters', function() {
      var expectedFilters = [{ skip: 0, limit: chunkSize}, { skip: chunkSize, limit: chunkSize}];
      utils.downloadInChunks({}, chunkSize, processFunction, function() {
        assert.deepEqual(calls, expectedFilters);
      });
    });

    it('should concat the results from each call to the process function', function() {
      utils.downloadInChunks({}, chunkSize, processFunction, function(err, results) {
        assert.deepEqual(results, largeArray);
      });
    });

    function processFunction(filter, cb) {
      calls.push(Object.assign({}, filter));
      var results = [];

      for (var i = 0; i < chunkSize; i++) {
        if (largeArray[skip + i]) {
          results.push(largeArray[skip + i]);
        }
      }

      skip += chunkSize;
      cb(null, results);
    }
  });

  describe('concatResults', function() {
    it('should concat arrays', function() {
      var array1 = ['item1', 'item2'];
      var array2 = ['item3', 'item4'];

      var concatResults = utils.concatResults(array1, array2);
      assert.deepEqual(concatResults, ['item1', 'item2', 'item3', 'item4']);
    });

    it('should concat objects with arrays', function() {
      var object1 = { deltas: [{change: 'change 1'}], conflict: []};
      var object2 = { deltas: [{change: 'change 2'}], conflict: [{conflict: 'conflict 1'}]};
      var expectedResults = {
        deltas: [{change: 'change 1'}, {change: 'change 2'}],
        conflict: [{conflict: 'conflict 1'}]
      };

      var concatResults = utils.concatResults(object1, object2);
      assert.deepEqual(concatResults, expectedResults);
    });
  });
});
