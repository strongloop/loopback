var loopback = require('../../../../index');
var boot = require('loopback-boot');
var app = module.exports = loopback();

boot(app, __dirname);
var apiPath = '/api';
app.use(apiPath, loopback.rest());
app.use(loopback.urlNotFound());
app.use(loopback.errorHandler());
