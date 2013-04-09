// any module instance can be required by its directory
var exampleResource = require('.');

// exampleResource.app is an express sub app
// anything registered (routes, middleware)
// will only run relative to the defined root
// '/' resolves to '/example-resource'
exampleResource.app.get('/', function (req, res) {
  res.send(exampleResource.options.msg + '??????');
});

exampleResource.app.get('/foo', function (req, res) {
  res.send('foo!!!');
});