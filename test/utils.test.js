// Copyright IBM Corp. 2016,2018. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

var utils = require('../lib/utils');
var assert = require('assert');

describe('Utils', function() {
  describe('uploadInChunks', function() {
    it('calls process function for each chunk', function(done) {
      var largeArray = ['item1', 'item2', 'item3'];
      var calls = [];

      utils.uploadInChunks(largeArray, 1, function processFunction(array, cb) {
        calls.push(array);
        cb();
      }, function finished(err) {
        if (err) return done(err);
        assert.deepEqual(calls, [['item1'], ['item2'], ['item3']]);
        done();
      });
    });

    it('calls process function only once when array is smaller than chunk size', function(done) {
      var largeArray = ['item1', 'item2'];
      var calls = [];

      utils.uploadInChunks(largeArray, 3, function processFunction(array, cb) {
        calls.push(array);
        cb();
      }, function finished(err) {
        if (err) return done(err);
        assert.deepEqual(calls, [['item1', 'item2']]);
        done();
      });
    });

    it('concats results from each call to the process function', function(done) {
      var largeArray = ['item1', 'item2', 'item3', 'item4'];

      utils.uploadInChunks(largeArray, 2, function processFunction(array, cb) {
        cb(null, array);
      }, function finished(err, results) {
        if (err) return done(err);
        assert.deepEqual(results, ['item1', 'item2', 'item3', 'item4']);
        done();
      });
    });
  });

  describe('downloadInChunks', function() {
    var largeArray, calls, chunkSize, skip;

    beforeEach(function() {
      largeArray = ['item1', 'item2', 'item3'];
      calls = [];
      chunkSize = 2;
      skip = 0;
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

    it('calls process function with the correct filter', function(done) {
      var expectedFilters = [{skip: 0, limit: chunkSize}, {skip: chunkSize, limit: chunkSize}];
      utils.downloadInChunks({}, chunkSize, processFunction, function finished(err) {
        if (err) return done(err);
        assert.deepEqual(calls, expectedFilters);
        done();
      });
    });

    it('concats the results of all calls of the process function', function(done) {
      utils.downloadInChunks({}, chunkSize, processFunction, function finished(err, results) {
        if (err) return done(err);
        assert.deepEqual(results, largeArray);
        done();
      });
    });
  });

  describe('concatResults', function() {
    it('concats regular arrays', function() {
      var array1 = ['item1', 'item2'];
      var array2 = ['item3', 'item4'];

      var concatResults = utils.concatResults(array1, array2);
      assert.deepEqual(concatResults, ['item1', 'item2', 'item3', 'item4']);
    });

    it('concats objects containing arrays', function() {
      var object1 = {deltas: [{change: 'change 1'}], conflict: []};
      var object2 = {deltas: [{change: 'change 2'}], conflict: [{conflict: 'conflict 1'}]};
      var expectedResults = {
        deltas: [{change: 'change 1'}, {change: 'change 2'}],
        conflict: [{conflict: 'conflict 1'}],
      };

      var concatResults = utils.concatResults(object1, object2);
      assert.deepEqual(concatResults, expectedResults);
    });
  });
});
