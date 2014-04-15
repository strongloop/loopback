var loopback = require('../../../');
var path = require('path');
var app = module.exports = loopback();
var models = require('./models');
var TestModel = models.TestModel;

app.use(loopback.cookieParser({secret: app.get('cookieSecret')}));
var apiPath = '/api';
app.use(apiPath, loopback.rest());
app.use(loopback.static(path.join(__dirname, 'public')));
app.use(loopback.urlNotFound());
app.use(loopback.errorHandler());
app.model(TestModel);
TestModel.attachTo(loopback.memory());
