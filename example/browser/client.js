// client app
var app = loopback();

app.dataSource('api', {
  connector: loopback.Server,
  host: 'localhost',
  port: 3000,
  base: '/api',
  discover: loopback.remoteModels
});

app.dataSource('local', {
  connector: loopback.Memory
});

var Color = loopback.getModel('Color');
var LocalColor = app.model('LocalColor', {dataSource: 'local'});

LocalColor.create([
  {name: 'red'},
  {name: 'green'},
  {name: 'blue'}
], function() {
  LocalColor.replicate(0, Color, {}, function() {
    console.log(arguments);
  });
}); 


// Color.create([
//   {name: 'red'},
//   {name: 'green'},
//   {name: 'blue'}
// ], function() {
//   Color.find(function(err, colors) {
//     console.log(colors);
//   });
// });

// Color.find({where: {name: 'green'}}, function(err, colors) {
//   console.log(colors);
// });
