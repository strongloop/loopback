/**
 * Generate asteroid unit tests from documentation...
 */

fs = require('fs')

readme = fs.readFileSync('./README.md').toString();

var alias = {
  myModel: 'Model',
  model: 'Model',
  ctx: 'Model',
  dataSource: 'DataSource',
  geoPoint: 'GeoPoint'
};

function getName(line) {
  var name = line
    .split('.')[0]
    .replace(/#+\s/, '');
    
  return alias[name] || name;  
}

function Doc(line, lineNum, docIndex) {
  this.name = getName(line);
  this.line = line;
  this.lineNum = lineNum;
  this.docIndex = docIndex;
}

Doc.prototype.nextDoc = function () {
  return docs[this.docIndex + 1];
}

Doc.prototype.contents = function () {
  var nextDoc = this.nextDoc();
  var endIndex = lines.length - 1;
  var contents = [];
  
  if(nextDoc) {
    endIndex = nextDoc.lineNum;
  }
  
  for(var i = this.lineNum; i < endIndex; i++) {
    contents.push(lines[i]);
  }
  
  return contents;
}

Doc.prototype.example = function () {
  var content = this.contents();
  var result = [];
  
  content.forEach(function (line) {
    if(line.substr(0, 4) === '    ') {
      result.push(line.substr(4, line.length))
    }
  });
  
  return result.join('\n');
}

lines = readme.split('\n')
docs = [];

lines.forEach(function (line, i) {
  if(!(line[0] === '#' && ~line.indexOf('.'))) return;
  
  var doc = new Doc(line, i, docs.length);
  
  docs.push(doc);
});

var _ = require('underscore');
var sh = require('shelljs');

var byName = _.groupBy(docs, function (doc) {
  return doc.name;
});

sh.rm('-rf', 'g-tests');
sh.mkdir('g-tests');

Object.keys(byName).forEach(function (group) {
  var testFile = 
  "var asteroid = require('../');" +
  "\n" + 
  "describe('app', function(){"
  testFile

  describe('app', function(){
    var app;

    beforeEach(function () {
      app = asteroid();
    });

    describe('asteroid.createModel(name, properties, settings)', function(){
      var User = asteroid.createModel('user', {
        first: String,
        last: String,
        age: Number
      });
    });
  });
  
  
})