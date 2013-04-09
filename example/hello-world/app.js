var asteroid = require('../../');
var app = asteroid();

app.get('/', function (req, res) {
  res.send('hello world');
});

app.listen(3000);