var loopback = require('../../../..');
var boot = require('loopback-boot');
var app = module.exports = loopback();

boot(app, __dirname);

var apiPath = '/api';
app.use(loopback.token({model: app.models.accessToken}));
app.use(apiPath, loopback.rest());

app.use(loopback.urlNotFound());
app.use(loopback.errorHandler());
app.enableAuth();
