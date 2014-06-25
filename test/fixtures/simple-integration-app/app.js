var loopback = require('../../../');
var boot = require('loopback-boot');
var path = require('path');
var app = module.exports = loopback();

boot(app, __dirname);
app.use(loopback.favicon());
app.use(loopback.cookieParser({secret: app.get('cookieSecret')}));
var apiPath = '/api';
app.use(apiPath, loopback.rest());
app.use(loopback.static(path.join(__dirname, 'public')));
app.use(loopback.urlNotFound());
app.use(loopback.errorHandler());
