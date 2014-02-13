// client app
var app = loopback();

// remote models
app.dataSource('api', {
  connector: loopback.Server,
  host: 'localhost',
  port: 3000,
  base: '/api',
  discover: loopback.remoteModels
});

// local storage
app.dataSource('local', {
  connector: loopback.Memory
});

var network = {
  available: true,
  toggle: function() {
    this.available = !this.available;
  },
  status: function() {
    return this.available ? 'on' : 'off';
  }
};

// get the remote model "Color"
var Color = loopback.getModel('Color');

// define a local model for offline data
var LocalColor = app.model('LocalColor', {
  dataSource: 'local',
  options: {trackChanges: true}
});

// generate a random client id
LocalColor.beforeCreate = function(next, color) {
  color.id = Math.random().toString().split('.')[1];
  next();
}

function ReplicationCtlr($scope) {
  var interval = 1000;
  var remoteIntervalId;
  var localIntervalId;
  
  $scope.status = 'idle';
  $scope.replicate = replicate;
  $scope.replicateFromRemote = replicateFromRemote;
  $scope.conflicts = [];
  
  $scope.resolveUsingRemote = function(conflict) {
    conflict.source.name = conflict.target.name;
    conflict.source.save(function() {
      conflict.resolve();
    });
  }

  $scope.resolveUsingLocal = function(conflict) {
    conflict.resolve(function(err) {
      if(err) return console.log('resolveUsingLocal', err);
      conflict.source.save();
    });
  }

  LocalColor.on('deleted', replicate);
  LocalColor.on('changed', replicate);
  LocalColor.on('deletedAll', replicate);

  
  function replicate() {
    // reset the conflicts array
    while($scope.conflicts.shift());
    
    if(network.available) {
      LocalColor.currentCheckpoint(function(err, cp) {
        if(err) alert('Replication Error:', err.message);
        setTimeout(function() {
          LocalColor.replicate(cp, Color, {}, function(err, conflicts) {
            conflicts.forEach(function(conflict) {
              conflict.fetch(function() {
                console.log(conflict);
                var local = conflict.source && conflict.source.name;
                var remote = conflict.target && conflict.target.name;
                if(local !== remote) {
                  $scope.conflicts.push(conflict);
                }
                $scope.$apply();
              });
            });
          });
        }, 0);
      });    
    }
  }

  function replicateFromRemote() {
    if(network.available) {
      Color.currentCheckpoint(function(err, cp) {
        Color.replicate(cp, LocalColor, {}, function(err, conflicts) {
          if(err) alert('Replication from Remote Error:', err.message);
        });
      });
    }
  }

  // get initial data
  replicateFromRemote();
}

function NetworkCtrl($scope) {
  $scope.network = network;
}

function ListCtrl($scope) {
  LocalColor.on('changed', update);
  LocalColor.on('deleted', update);

  function update() {
    LocalColor.find({order: 'name ASC'}, function(err, colors) {
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
