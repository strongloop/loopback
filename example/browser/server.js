var loopback = require('../../');
var app = loopback();
var path = require('path');

app.use(loopback.logger(app.get('env') === 'development' ? 'dev' : 'default'));
app.use(loopback.static(path.join(__dirname, '..', '..', 'dist')));
app.use(loopback.static(path.join(__dirname)));
app.get('/loopback-remote-models.js', loopback.models(app));
app.use('/api', loopback.rest());

app.dataSource('db', {
  connector: loopback.Memory
});

var Color = app.model('Color', {dataSource: 'db', options: {
  trackChanges: true
}});

app.model(Color.getChangeModel());
app.model(Color.getChangeModel().getCheckpointModel());

app.listen(3000);
