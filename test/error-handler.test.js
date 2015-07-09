var loopback = require('../');
var app;
var MockReq = require('mock-req');
var MockRes = require('mock-res');
var assert = require('assert');

describe('loopback.errorHandler(options)', function() {

  it('should return default middleware when options object is not present', function() {

    //arrange
    var app = loopback();
    var err = new Error();
    err.statusCode = 401;
    err.stack = 'Dummy error stack';
    var req = new MockReq();
    var res = new MockRes();

    //act
    loopback.errorHandler()(err, req, res, function(err) {});

    //assert
    assert(err.stack);
    assert(err.stack === 'Dummy error stack');
  });

  it('should delete stack when options.includeStack is false', function() {

    //arrange
    var app = loopback();
    var err = new Error();
    err.statusCode = 401;
    err.stack = 'Dummy error stack';
    var req = new MockReq();
    var res = new MockRes();

    //act
    loopback.errorHandler({ includeStack: false })(err, req, res, function(err) {});

    //assert
    assert(!err.stack);
  });
});
