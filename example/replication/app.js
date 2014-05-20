var loopback = require('../../');
var app = loopback();
var db = app.dataSource('db', {connector: loopback.Memory});
var Color = app.model('color', {dataSource: 'db', options: {trackChanges: true}});
var Color2 = app.model('color2', {dataSource: 'db', options: {trackChanges: true}});
var target = Color2;
var source = Color;
var SPEED = process.env.SPEED || 100;
var conflicts;

var steps = [

  createSomeInitialSourceData,

    replicateSourceToTarget,
    list.bind(this, source, 'current SOURCE data'),
    list.bind(this, target, 'current TARGET data'),

  updateSomeTargetData,

    replicateSourceToTarget,
    list.bind(this, source, 'current SOURCE data '),
    list.bind(this, target, 'current TARGET data (includes conflicting update)'),

  updateSomeSourceDataCausingAConflict,

    replicateSourceToTarget,
    list.bind(this, source, 'current SOURCE data (now has a conflict)'),
    list.bind(this, target, 'current TARGET data (includes conflicting update)'),

  resolveAllConflicts,

    replicateSourceToTarget,
    list.bind(this, source, 'current SOURCE data (conflict resolved)'),
    list.bind(this, target, 'current TARGET data (conflict resolved)'),

  createMoreSourceData,

    replicateSourceToTarget,
    list.bind(this, source, 'current SOURCE data'),
    list.bind(this, target, 'current TARGET data'),

  createEvenMoreSourceData,

    replicateSourceToTarget,
    list.bind(this, source, 'current SOURCE data'),
    list.bind(this, target, 'current TARGET data'),

  deleteAllSourceData,

    replicateSourceToTarget,
    list.bind(this, source, 'current SOURCE data (empty)'),
    list.bind(this, target, 'current TARGET data (empty)'),

  createSomeNewSourceData,

    replicateSourceToTarget,
    list.bind(this, source, 'current SOURCE data'),
    list.bind(this, target, 'current TARGET data')
];

run(steps);

function createSomeInitialSourceData() {
  Color.create([
    {name: 'red'},
    {name: 'blue'},
    {name: 'green'}
  ]);
}

function replicateSourceToTarget() {
  Color.replicate(0, Color2, {}, function(err, replicationConflicts) {
    conflicts = replicationConflicts;
  });
}

function resolveAllConflicts() {
  if(conflicts.length) {
    conflicts.forEach(function(conflict) {
      conflict.resolve();
    });
  }
}

function updateSomeTargetData() {
  Color2.findById(1, function(err, color) {
    color.name = 'conflict';
    color.save();
  });
}

function createMoreSourceData() {
  Color.create({name: 'orange'});
}

function createEvenMoreSourceData() {
  Color.create({name: 'black'});
}

function updateSomeSourceDataCausingAConflict() {
  Color.findById(1, function(err, color) {
    color.name = 'red!!!!';
    color.save();
  });
}

function deleteAllSourceData() {
  Color.destroyAll();
}

function createSomeNewSourceData() {
  Color.create([
    {name: 'violet'},
    {name: 'amber'},
    {name: 'olive'}
  ]);
}

function list(model, msg) {
  console.log(msg);
  model.find(function(err, items) {
    items.forEach(function(item) {
      console.log(' -', item.name);
    });
    console.log();
  });
}

function run(steps) {
  setInterval(function() {
    var step = steps.shift();
    if(step) {
      console.log(step.name);
      step();
    }
  }, SPEED);
}
