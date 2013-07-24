var models = require('../../lib/models');

var loopback = require('../../');
var app = loopback();

app.use(loopback.rest());

var dataSource = loopback.createDataSource('db', {connector: loopback.Memory});

var Application = models.Application(dataSource);

app.model(Application);


var data = {pushSettings: [
    {   "platform": "apns",
        "apns": {
            "pushOptions": {
                "gateway": "gateway.sandbox.push.apple.com",
                "cert": "credentials/apns_cert_dev.pem",
                "key": "credentials/apns_key_dev.pem"
            },

            "feedbackOptions": {
                "gateway": "feedback.sandbox.push.apple.com",
                "cert": "credentials/apns_cert_dev.pem",
                "key": "credentials/apns_key_dev.pem",
                "batchFeedback": true,
                "interval": 300
            }
        }}
]}

Application.create(data, function(err, data) {
   console.log('Created: ', data.toObject());
});


Application.register('rfeng', 'MyApp', {description: 'My first mobile application'}, function (err, result) {
    console.log(result.toObject());

    result.resetKeys(function (err, result) {
        console.log(result.toObject());
    });
});
