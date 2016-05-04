// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var loopback = require('../../');
var app = loopback();

// Create a LoopBack context for all requests
app.use(loopback.context());

// Store a request property in the context
app.use(function saveHostToContext(req, res, next) {
  var ns = loopback.getCurrentContext();
  ns.set('host', req.host);
  next();
});

app.use(loopback.rest());

var Color = loopback.createModel('color', { 'name': String });
Color.beforeRemote('**', function (ctx, unused, next) {
  // Inside LoopBack code, you can read the property from the context
  var ns = loopback.getCurrentContext();
  console.log('Request to host', ns && ns.get('host'));
  next();
});

app.dataSource('db', { connector: 'memory' });
app.model(Color, { dataSource: 'db' });

app.listen(3000, function() {
  console.log('A list of colors is available at http://localhost:3000/colors');
});
