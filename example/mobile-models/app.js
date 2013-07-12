var models = require('../../lib/models');

var asteroid = require('../../');
var app = asteroid();

app.use(asteroid.rest());

var dataSource = asteroid.createDataSource('db', {connector: asteroid.Memory});

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


Application.register('MyApp', 'My first mobile application', 'rfeng', function (err, result) {
    console.log(result.toObject());

    result.resetKeys(function (err, result) {
        console.log(result.toObject());
    });
});
