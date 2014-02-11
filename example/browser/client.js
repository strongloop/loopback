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

var network = {
  available: true,
  toggle: function() {
    this.available = !this.available;
  },
  status: function() {
    return this.available ? 'on' : 'off';
  }
};
var Color = loopback.getModel('Color');
var LocalColor = app.model('LocalColor', {
  dataSource: 'local',
  options: {trackChanges: true}
});

LocalColor.beforeCreate = function(next, color) {
  color.id = Math.random().toString().split('.')[1];
  next();
}

var localConflicts = [];

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

  LocalColor.on('deleted', replicate);
  LocalColor.on('changed', replicate);
  LocalColor.on('deletedAll', replicate);

  
  function replicate() {
    // reset the conflicts array
    while($scope.conflicts.shift());
    
    if(network.available) {
      LocalColor.currentCheckpoint(function(err, cp) {
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

        });
      });
    }
  }
}

function NetworkCtrl($scope) {
  $scope.network = network;
}

function ConflictCtrl($scope) {
  $scope.conflicts = localConflicts;
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

function ChangeCtrl($scope) {
  var Change = LocalColor.getChangeModel();

  Change.on('changed', update);
  Change.on('deleted', update);

  function update() {
    Change.find({order: 'checkpoint ASC'}, function(err, changes) {
      $scope.changes = changes;
      $scope.$apply();
    });
  }

  update();
}

function RemoteChangeCtrl($scope) {
  var Change = Color.getChangeModel();

  setInterval(update, 5000);

  function update() {
    Change.find({order: 'checkpoint ASC'}, function(err, changes) {
      $scope.changes = changes;
      $scope.$apply();
    });
  }

  update();
}

