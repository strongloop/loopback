var async = require('async');
var loopback = require('../');

// create a unique Checkpoint model
var Checkpoint = require('../lib/models/checkpoint').extend('TestCheckpoint');
Checkpoint.attachTo(loopback.memory());

describe('Checkpoint', function() {
  describe('current()', function() {
    it('returns the highest `seq` value', function(done) {
      async.series([
        Checkpoint.create.bind(Checkpoint),
        Checkpoint.create.bind(Checkpoint),
        function(next) {
          Checkpoint.current(function(err, seq) {
            if (err) next(err);
            expect(seq).to.equal(2);
            next();
          });
        }
      ], done);
    });
  });
});
