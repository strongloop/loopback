var asteroid = require('../../');
var app = asteroid();

app.use(asteroid.rest());


var dataSource = app.dataSource('db',
    {   adapter: 'oracle',
        host: '166.78.158.45',
        database: 'XE',
        username: 'strongloop',
        password: 'str0ng100pjs',
        debug: true
    });


var Color = dataSource.define('color', {
    'name': String
});
dataSource.autoupdate(function (err, data) {
    Color.create({name: 'red'});
    Color.create({name: 'green'});
    Color.create({name: 'blue'});

    Color.all(function () {
        console.log(arguments);
    });
});

app.listen(3000);

console.log('a list of colors is available at http://localhost:300/colors');