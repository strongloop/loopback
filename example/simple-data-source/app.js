var loopback = require('../../');
var app = loopback();

app.use(loopback.rest());


var dataSource = app.dataSource('db', {adapter: 'memory'});

var Color = dataSource.define('color', {
  'name': String
});

Color.create({name: 'red'});
Color.create({name: 'green'});
Color.create({name: 'blue'});

Color.all(function () {
  console.log(arguments);
});

app.listen(3000);

console.log('a list of colors is available at http://localhost:300/colors');