var loopback = require('../../');
var app = loopback();

app.use(loopback.rest());

var metadata = require('../../lib/models/metadata');
metadata(app);

app.docs({basePath: '/'});
var server = app.listen(3000, function(err) {
   console.log('Server is ready at ', server.address());
});
