var fs = require('fs'),
    tty = require('tty'),
    natives = process.binding('natives');

var is_tty = function() {
  return tty.isatty(process.stdout.fd) && tty.isatty(process.stderr.fd);
};

var Color = function(code) {
  this.code = code;
};

Color.prototype.start = function() {
  Color.stack.push(this);
  return '\033['+this.code+'m';
};

Color.prototype.end = function() {
  Color.stack.pop();
  return '\033['+Color.stack[Color.stack.length-1].code+'m';
};

Color.prototype.wrap = function(text) {
  return this.start() + text + this.end();
};

var color = is_tty() ?
  function(code) {
    return new Color(code);
  } :
  function(code) {
    return {
      start:function(){return ''},
      end:function(){return ''},
      wrap:function(text){ return text; }
    }
  };

var colors = {
  off:color(0),
  bold:color(1),
  italic:color(3),
  underline:color(4),
  blink:color(5),
  inverse:color(7),
  hidden:color(8),
  black:color(30),
  red:color(31),
  green:color(32),
  yellow:color(33),
  blue:color(34),
  magenta:color(35),
  cyan:color(36),
  white:color(37),
  black_bg:color(40),
  red_bg:color(41),
  green_bg:color(42),
  yellow_bg:color(43),
  blue_bg:color(44),
  magenta_bg:color(45),
  cyan_bg:color(46),
  white_bg:color(47)
};

Color.stack = [colors.off];


var err_re1 = /    at (.*?) \(([\w\d\._\-\/]+):(\d+):(\d+)\)/,
    err_re2 = /    at ([^:]+):(\d+):(\d+)/;

var Trace = function(first_line, frames, original_error) {
  this.first_line = first_line;
  this.frames = frames;
  this.original_error = original_error;
};

Trace.defaults = [2, true, 'red'];

Trace.prototype.toString = function(reversed) {
  reversed === undefined && (reversed = true);
  var args = [].slice.call(arguments, 1);
  args.length === 0 && (args = Trace.defaults.slice());

  var frame_data = [this.first_line, '======\n'].concat(this.frames.map(function(frame) {
    return frame.toString.apply(frame, args);
  }));

  if(reversed)
    frame_data = frame_data.reverse();

  return frame_data.join('');
};

var Frame = function(named_location, filename, line, character) {
  this.named_location = named_location;
  this.filename = filename;
  this.line = line;
  this.character = character;
  this._filedata = null;
};

Frame.prototype.load_file_native = function() {
  var base_name = this.filename.replace(/\.js$/g, ''),
      data = natives[base_name] || '';

  return data;
};

Frame.prototype.load_file_path = function() {
  try {
    return fs.readFileSync(this.filename, 'utf8').toString();
  } catch(err) {
    return '';
  }
};

Frame.prototype.filedata = function() {
  if(this._filedata)
    return this._filedata;

  if(this.filename.indexOf('/') === -1) {
    this._filedata = this.load_file_native();
  } else {
    this._filedata = this.load_file_path();
  }
  return this._filedata;
};

Frame.prototype.toString = function() {
  var args = [].slice.call(arguments);
  return [
    'file ',
    colors.cyan.wrap('"'+this.filename.replace(process.cwd(), '.')+'"'),
    ' line ',
    colors.red.wrap(
      colors.bold.wrap(
        this.line
      )
    ),
    ', char ',
    colors.red.wrap(
      colors.bold.wrap(
        this.character
      )
    ),
    ', in ',
    colors.cyan.wrap(this.named_location),
    ':\n',
    colors.yellow.wrap(this.get_lines.apply(this, args)),
    '\n'
  ].join('');
};

Frame.prototype.get_lines = function(context, ascii_cursor, highlight_error_start) {
  context = context || 0; 
  filedata = this.filedata().split('\n');

  var start_line = this.line - context - 1,
      end_line = this.line + context,
      character = this.character;

  start_line < 0 && (start_line = 0);
  var lines = filedata.slice(start_line, end_line);

  if(this.line - context < 0) {
    context += (this.line - context) - 1;
  }

  if(highlight_error_start) {
    colors.yellow.start();
    lines = lines.map(function(line, idx) {
      if(idx === context) {
        line = line.split(/\b/g);
        var start = 0;
        line = line.map(function(word) {
          var next = start + word.length;
          if(character <= next && character >= start) {
            word = colors[highlight_error_start].wrap(word);
          }
          start = next;
          return word;
        }).join('');
      }
      return line;
    });
    colors.yellow.end();
  }
  if(ascii_cursor) {
    lines = lines.map(function(line, idx) {
      return (idx === context ? '>' : ' ') + line;
    });
  }

  return lines.join('\n');
};

var trace = function(err) {
  if(!err) {
    err = {};
    Error.captureStackTrace(err);
  }

  var lines = err.stack.split('\n'),
      first = lines[0],
      stack = lines.slice(1);

  var frames,
      match1, match2;

  frames = stack.map(function(line) {
    match1 = err_re1.exec(line);
    match2 = err_re2.exec(line);

    if(match1) {
        return new Frame(match1[1], match1[2], parseInt(match1[3], 10), parseInt(match1[4], 10))
    } else if(match2) {
        return new Frame('<anonymous>', match2[1], parseInt(match2[2], 10), parseInt(match2[3], 10))
    }
  });

  return new Trace(first, frames, err);
};

exports.trace = trace;
exports.Frame = Frame;
exports.Trace = Trace;

exports.set_context = function(context) {
  Trace.defaults[0] = context;
};

exports.set_add_cursor = function(tf) {
  Trace.defaults[1] = tf;
};
