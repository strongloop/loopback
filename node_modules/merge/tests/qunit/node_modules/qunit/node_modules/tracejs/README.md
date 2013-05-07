Trace.js
========

Providing better stack traces for V8 by giving you full-fledged objects for each frame in the trace.

Examples
========

Creating a nice color trace with context, reversed so that the latest call is printed last:

````javascript
var trace = require('tracejs').trace;

try {
    somethingThatThrowsAnError();
} catch(err) {
    var stacktrace = trace(err);
    console.error(stacktrace.toString());
}
````

Iterating through frames and grabbing the constituent files:

````javascript
var trace = require('tracejs').trace;

try {
    somethingThatThrowsAnError();
} catch(err) {
    var stacktrace = trace(err);
    for(var i = 0, len = stacktrace.frames.length; i < len; ++i) {
        console.error(stacktrace.frames[i].filename, stacktrace.frames[i].filedata());
    }
}
````

API
===

trace(err)
-----

Creates and returns a `Trace` object by parsing an `Error` object.

object Trace
------------

Holds the original error, the first line of the trace (the message), and the frames that make up the stack trace. Returned by `trace`.

Members:

*  `frames`: an `Array` of `Frame` objects.
*  `first_line`: the first line of the original stack trace -- usually contains the error message, if any.
*  `original_error`: the original `Error` object that the `Trace` was generated from.

The default output of `Trace#toString` looks like the following:

![trace](http://neversaw.us/media/traces.png)

Trace.defaults
--------------

The default printing mode for the trace; an array of `[context_lines:int, `print_cursor:boolean`, `highlight_character_color:string`].
Defaults to two lines of context with a cursor, with the character that caused the error appearing red.

Trace#toString(reversed[, contextLines, showCursor, highlightErrorCharacterColor])
--------------

Returns the prettified stack trace as a string, using `Trace.defaults`. `reversed` defaults to `true`, meaning the most recent call is displayed last. The remaining arguments are passed to `Frame#toString` for each frame in `Trace#frames`. 

object Frame
------------ 

Contains information about a specific stack frame.

Members:

*  `named_location`: The name of the scope where the frame originated; e.g., `'ReadStream.emit'`.
*  `filename`: The filename of the frame.
*  `line`: The integer line number of the frame.
*  `character`: The character at which the error occurred in the line of the frame.

Frame#filedata()
--------------

Returns a string containing the text of the file the frame originated from. Works on both native modules as well as userland modules. Cached and synchronous.

Frame#toString([contextLines, showCursor, highlightErrorCharacterColor])
---------------

Wraps the output from `Frame#get_lines()` with information about the file, line number, character, and scope if available.

Frame#get_lines(context, ascii_cursor, highlight_error_start)
---------------

Returns a string containing `context` lines surrounding the error line from the file of this frame. If `ascii_cursor` is `true`, it will
insert a `>` at the line where the error occurred, and a space before all other lines. `highlight_error_start` can be any value that [ansi-colors](https://github.com/loopj/commonjs-ansi-color) will accept, or false to avoid highlighting the character.

License
=======

new BSD.
