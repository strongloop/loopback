// test server
var loopback = require('../../');
var testServer = loopback();
var fs = require('fs');
var path = require('path');
var browserify = require('browserify');
var TEST_DIR = path.join(__dirname, '..');
var FIXTURES_DIR = path.join(TEST_DIR, 'fixtures');

testServer.set('views', __dirname);

testServer.get('/', function(req, res) {
  res.render('test.html.ejs');
});

testServer.get('/loopback.js', function(req, res) {
  res.send(
    fs.readFileSync(path.join(__dirname, '..', '..', 'dist', 'loopback.js'))
  )
});

testServer.get('/tests.js', function(req, res) {
  var files = [
    path.join(TEST_DIR, 'support.js'),
    path.join(TEST_DIR, 'model.test.js'),
    path.join(TEST_DIR, 'change.test.js'),
    path.join(TEST_DIR, 'geo-point.test.js')
  ];
  var b = browserify({
    entries: files,
    basedir: TEST_DIR,
    debug: true
  });
  b.ignore('nodemailer');
  b.ignore('passport');
  b.ignore('superagent');
  b.ignore('supertest');
  b.bundle({
    debug: true
  }).pipe(res);
});

testServer.use(loopback.static(__dirname));

testServer.listen(4040, function() {
  console.log('test server listening on port', testServer.get('port'));
});