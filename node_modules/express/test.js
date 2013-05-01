
/**
 * Module dependencies.
 */

var express = require('./')
  , app = express()

var users = ['foo', 'bar', 'baz'];

app.use(express.bodyParser());
console.log(app.locals);

app.get('/api/users', function(req, res){
  res.send(users);
});

app.del('/api/users', function(req, res){
  users = [];
  res.send(200);
});

app.post('/api/users', function(req, res){
  users.push(req.body.name);
  res.send(201);
});

app.get('/api/user/:id', function(req, res){
  var id = req.params.id;
  res.send(users[id]);
});

app.use('/api', function(req, res, next){
  var err = new Error('Method Not Allowed');
  err.status = 405;
});

app.listen(5555);
console.log('listening on 5555');
