var asteroid = require('../../');
var app = asteroid();

app.use(asteroid.configure());
app.use(asteroid.bodyParser());
app.use(asteroid.routes());

app.listen(3000);