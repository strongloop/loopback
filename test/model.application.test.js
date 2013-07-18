var models = require('../lib/models');
var loopback = require(('../'));
var assert = require('assert');

var dataSource = loopback.createDataSource('db', {connector: loopback.Memory});

var Application = models.Application(dataSource);

describe('Application', function () {
    var registeredApp = null;

    it('Create a new application', function (done) {

        Application.create({owner: 'rfeng', name: 'MyApp1', description: 'My first mobile application'}, function (err, result) {
            var app = result;
            assert.equal(app.owner, 'rfeng');
            assert.equal(app.name, 'MyApp1');
            assert.equal(app.description, 'My first mobile application');
            assert(app.clientKey);
            assert(app.javaScriptKey);
            assert(app.restApiKey);
            assert(app.windowsKey);
            assert(app.masterKey);
            assert(app.created);
            assert(app.modified);
            done(err, result);
        });
    });

    it('Register a new application', function (done) {

        Application.register('rfeng', 'MyApp2', {description: 'My second mobile application'}, function (err, result) {
            var app = result;
            assert.equal(app.owner, 'rfeng');
            assert.equal(app.name, 'MyApp2');
            assert.equal(app.description, 'My second mobile application');
            assert(app.clientKey);
            assert(app.javaScriptKey);
            assert(app.restApiKey);
            assert(app.windowsKey);
            assert(app.masterKey);
            assert(app.created);
            assert(app.modified);
            registeredApp = app;
            done(err, result);
        });
    });

    it('Reset keys', function (done) {

        Application.resetKeys(registeredApp.id, function (err, result) {
            var app = result;
            assert.equal(app.owner, 'rfeng');
            assert.equal(app.name, 'MyApp2');
            assert.equal(app.description, 'My second mobile application');
            assert(app.clientKey);
            assert(app.javaScriptKey);
            assert(app.restApiKey);
            assert(app.windowsKey);
            assert(app.masterKey);

            assert(app.clientKey !== registeredApp.clientKey);
            assert(app.javaScriptKey !== registeredApp.javaScriptKey);
            assert(app.restApiKey !== registeredApp.restApiKey);
            assert(app.windowsKey !== registeredApp.windowsKey);
            assert(app.masterKey !== registeredApp.masterKey);

            assert(app.created);
            assert(app.modified);
            done(err, result);
        });
    });
});
