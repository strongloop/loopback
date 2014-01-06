var loopback = require('../../../');
var path = require('path');
var app = module.exports = loopback();

app.boot(__dirname);

var apiPath = '/api';
app.use(loopback.cookieParser('secret'));
app.use(loopback.token({model: app.models.accessToken}));
app.use(apiPath, loopback.rest());
app.use(app.router);
app.use(loopback.urlNotFound());
app.use(loopback.errorHandler());
app.enableAuth();
