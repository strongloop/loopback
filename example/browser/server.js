var loopback = require('../../');
var app = loopback();
var path = require('path');

app.use(loopback.static(path.join(__dirname, '..', '..', 'dist')));
app.use(loopback.static(path.join(__dirname)));
app.get('/loopback-remote-models.js', loopback.routes(app));
app.use(loopback.rest());

app.dataSource('db', {
  connector: loopback.Memory
});

var Color = app.model('Color', {dataSource: 'db', options: {
  trackChanges: true
}});

app.model(Color.getChangeModel());

app.listen(3000);
