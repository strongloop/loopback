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
var LocalColor = app.model('LocalColor', {
  dataSource: 'local',
  options: {trackChanges: true}
});


function replicate() {
  LocalColor.currentCheckpoint(function(err, cp) {
    LocalColor.replicate(cp, Color, {}, function() {
      console.log('replicated local to remote');
    });
  });
}

LocalColor.on('deleted', replicate);
LocalColor.on('changed', replicate);
LocalColor.on('deletedAll', replicate);

setInterval(function() {
  Color.currentCheckpoint(function(err, cp) {
    Color.replicate(cp, LocalColor, {}, function() {
      console.log('replicated remote to local');
    });
  });
}, 100);

function ListCtrl($scope) {
  LocalColor.on('changed', update);
  LocalColor.on('deleted', update);

  function update() {
    LocalColor.find({sort: 'name'}, function(err, colors) {
      $scope.colors = colors;
      $scope.$apply();
    });
  }

  $scope.add = function() {
    LocalColor.create({name: $scope.newColor});
    $scope.newColor = null;
  }

  update();
}

