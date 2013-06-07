/**
 * Generate asteroid unit tests from README...
 */

fs = require('fs')

readme = fs.readFileSync('../README.md').toString();

alias = {
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
  
  line = line.replace(/#+\s/, '');
  
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
  
  return result;
}

Doc.prototype.desc = function () {
  var content = this.contents();
  var result = [];
  var first;
  
  content.forEach(function (line) {
    if(first) {
      // ignore
    } else if(line[0] === '#' || line[0] === ' ') {
      // ignore
    } else {
      first = line;
    }
  });
  
  // only want the first sentence (to keep it brief)
  if(first) {
    first = first.split(/\.\s|\n/)[0]
  }
  
  return first;
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
  var testFile = [
  "describe('" + group + "', function() {",
  ""];
  
  byName[group].forEach(function (doc) {
    var example = doc.example();
    var exampleLines = example && example.length && example;
    
    testFile = testFile.concat([
      "  describe('" + doc.line + "', function() {",
      "    it(\"" + doc.desc() + "\", function(done) {"]);
      
      if(exampleLines) {
        exampleLines.unshift("/* example - ");
        exampleLines.push("*/")
        testFile = testFile.concat(
          exampleLines.map(function (l) {
            return '      ' + l;
          })
        )
      }
      
    testFile.push(
      "      done(new Error('test not implemented'));",
      "    });",
      "  });",
      "});"
    );
  });
  
  testFile.join('\n').to('g-tests/' + group + '.test.js');
});