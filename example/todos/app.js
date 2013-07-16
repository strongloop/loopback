var loopback = require('../../');
var app = loopback();

app.use(loopback.configure());
app.use(loopback.bodyParser());
app.use(loopback.routes());

app.listen(3000);