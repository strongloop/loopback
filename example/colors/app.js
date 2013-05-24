var asteroid = require('../../');
var app = asteroid();

app.use(asteroid.rest());

var Color = app.model('color');

Color.defineSchema({
  'name': String
});

Color
  .create({name: 'red'})
  .create({name: 'green'})
  .create({name: 'blue'});

app.listen(3000);

console.log('a list of colors is available at http://localhost:300/colors');