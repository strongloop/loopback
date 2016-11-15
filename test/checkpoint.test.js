// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var async = require('async');
var loopback = require('../');
var expect = require('chai').expect;

var Checkpoint = loopback.Checkpoint.extend('TestCheckpoint');

describe('Checkpoint', function() {
  describe('bumpLastSeq() and current()', function() {
    beforeEach(function() {
      var memory = loopback.createDataSource({
        connector: loopback.Memory,
      });
      Checkpoint.attachTo(memory);
    });

    it('returns the highest `seq` value', function(done) {
      async.series([
        Checkpoint.bumpLastSeq.bind(Checkpoint),
        Checkpoint.bumpLastSeq.bind(Checkpoint),
        function(next) {
          Checkpoint.current(function(err, seq) {
            if (err) next(err);

            expect(seq).to.equal(3);

            next();
          });
        },
      ], done);
    });

    it('Should be no race condition for current() when calling in parallel', function(done) {
      async.parallel([
        function(next) { Checkpoint.current(next); },
        function(next) { Checkpoint.current(next); },
      ], function(err, list) {
        if (err) return done(err);

        Checkpoint.find(function(err, data) {
          if (err) return done(err);

          expect(data).to.have.length(1);

          done();
        });
      });
    });

    it('Should be no race condition for bumpLastSeq() when calling in parallel', function(done) {
      async.parallel([
        function(next) { Checkpoint.bumpLastSeq(next); },
        function(next) { Checkpoint.bumpLastSeq(next); },
      ], function(err, list) {
        if (err) return done(err);

        Checkpoint.find(function(err, data) {
          if (err) return done(err);
          // The invariant "we have at most 1 checkpoint instance" is preserved
          // even when multiple calls are made in parallel
          expect(data).to.have.length(1);
          // There is a race condition here, we could end up with both 2 or 3 as the "seq".
          // The current implementation of the memory connector always yields 2 though.
          expect(data[0].seq).to.equal(2);
          // In this particular case, since the new last seq is always 2, both results
          // should be 2.
          expect(list.map(function(it) { return it.seq; }))
            .to.eql([2, 2]);

          done();
        });
      });
    });

    it('Checkpoint.current() for non existing checkpoint should initialize checkpoint',
    function(done) {
      Checkpoint.current(function(err, seq) {
        expect(seq).to.equal(1);

        done(err);
      });
    });

    it('bumpLastSeq() works when singleton instance does not exists yet', function(done) {
      Checkpoint.bumpLastSeq(function(err, cp) {
        // We expect `seq` to be 2 since `checkpoint` does not exist and
        // `bumpLastSeq` for the first time not only initializes it to one,
        // but also increments the initialized value by one.
        expect(cp.seq).to.equal(2);

        done(err);
      });
    });
  });
});
