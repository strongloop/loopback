var loopback = require('../../');
var app = loopback();

app.use(loopback.rest());
app.use(loopback.jsonrpc());

var schema = {
  name: String
};

var ds = loopback.createDataSource('memory');
var Color = ds.createModel('color', schema);

Color.create({name: 'red'});
Color.create({name: 'green'});
Color.create({name: 'blue'});

app.model(Color);
app.listen(3000);

console.log('a list of colors is available at http://localhost:3000/colors');
