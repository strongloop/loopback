# Breaking Changes

# 1.9

## Remote Method API

`loopback.remoteMethod()` is now deprecated.

Defining remote methods now should be done like this:

```js
// static
MyModel.greet = function(msg, cb) {
  cb(null, 'greetings... ' + msg);
}

MyModel.remoteMethod(
  'greet',
  {
    accepts: [{arg: 'msg', type: 'string'}],
    returns: {arg: 'greeting', type: 'string'}
  }
);
```

**NOTE: remote instance method support is also now deprecated...
Use static methods instead. If you absolutely need it you can still set
`options.isStatic = false`** We plan to drop support for instance methods in
`2.0`.

## Remote Instance Methods

All remote instance methods have been replaced with static replacements.

The REST API is backwards compatible.
