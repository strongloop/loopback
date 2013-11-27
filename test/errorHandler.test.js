var express = require('express');
describe('errorHandler middleware', function() {
  var app;
  beforeEach(function() {
    app = loopback();
    app.use(loopback.rest());
    app.use(loopback.urlNotFound());
    app.use(loopback.errorHandler());
  });

  it('returns RestAdapter\'s response when JSON is accepted', function(done) {
    request(app).get('/not-found')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .end(function(err, resp) {
        if (err) return done(err);
        assert(
          resp.body.error.name == 'Error',
          'expected error.name "Error" but got ' +
            JSON.stringify(resp.body.error.name) + '.'
        );
        done();
      });
  });

  it('returns text response when json or html is not accepted', function(done) {
    request(app).get('/not-found')
      .expect('Content-Type', 'text/plain')
      .end(done);
  });

  it('exposes properties of connect handler', function() {
    loopback.errorHandler.title = 'a title';
    assert.equal(express.errorHandler.title, 'a title');
  });
});
