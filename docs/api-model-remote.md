## Remote methods and hooks

You can expose a Model's instance and static methods to clients. A remote method must accept a callback with the conventional `fn(err, result, ...)` signature. 

### loopback.remoteMethod(fn, [options])

Expose a remote method.

```js
Product.stats = function(fn) {
  var statsResult = {
    totalPurchased: 123456
  };
  var err = null;
  
  // callback with an error and the result
  fn(err, statsResult);
}

loopback.remoteMethod(
  Product.stats,
  {
    returns: {arg: 'stats', type: 'object'},
    http: {path: '/info', verb: 'get'}
  }
);
```

**Options**

The options argument is a JSON object, described in the following table.

| Option  | Required? | Description |
| ----- | ----- |  ----- |
| accepts   | No | Describes the remote method's arguments, as explained <a href="#argdesc">below</a>. The callback is an assumed argument; do not specify. |
| returns    | No | Describes the remote method's callback arguments, as explained <a href="#argdesc">below</a>.. The err argument is assumed; do not specify. |
| http | No | HTTP routing information: <ul><li> **http.path**: path (relative to the model) at which the method is exposed. May be a path fragment (for example, `/:myArg`) that will be populated by an arg of the same name in the `accepts` description. For example, the `stats` method above will be at the whole path `/products/stats`.</li><li> **http.verb**: HTTP method  (verb) from which the method is available (one of: get, post, put, del, or all).</li></ul>

<a name="argdesc"></a>**Argument description**

The arguments description defines either a single argument as an object or an ordered set of arguments as an array.  Each individual argument has keys for:
 * arg: argument name
 * type: argument datatype; must be a[loopback type](http://wiki.strongloop.com/display/DOC/LoopBack+types).  
 * required: Boolean value indicating if argument is required.

For example, a single argument, specified as an object:
```js
{arg: 'myArg', type: 'number'}
```

Multiple arguments, specified as an array:
```js
[
  {arg: 'arg1', type: 'number', required: true},
  {arg: 'arg2', type: 'array'}
]
```

## Remote hooks

Run a function before or after a remote method is called by a client.

```js
// *.save === prototype.save
User.beforeRemote('*.save', function(ctx, user, next) {
  if(ctx.user) {
    next();
  } else {
    next(new Error('must be logged in to update'))
  }
});

User.afterRemote('*.save', function(ctx, user, next) {
  console.log('user has been saved', user);
  next();
});
```
    
Remote hooks also support wildcards. Run a function before any remote method is called.

```js
// ** will match both prototype.* and *.*
User.beforeRemote('**', function(ctx, user, next) {
  console.log(ctx.methodString, 'was invoked remotely'); // users.prototype.save was invoked remotely
  next();
});
```
    
Other wildcard examples

```js
// run before any static method eg. User.find
User.beforeRemote('*', ...);

// run before any instance method eg. User.prototype.save
User.beforeRemote('prototype.*', ...);

// prevent password hashes from being sent to clients
User.afterRemote('**', function (ctx, user, next) {
  if(ctx.result) {
    if(Array.isArray(ctx.result)) {
      ctx.result.forEach(function (result) {
        result.password = undefined;
      });
    } else {
      ctx.result.password = undefined;
    }
  }

  next();
});
```
    
### Context

Remote hooks are provided with a Context `ctx` object which contains transport specific data (eg. for http: `req` and `res`). The `ctx` object also has a set of consistent apis across transports.

#### ctx.user

A `Model` representing the user calling the method remotely. **Note:** this is undefined if the remote method is not invoked by a logged in user.

#### ctx.result

During `afterRemote` hooks, `ctx.result` will contain the data about to be sent to a client. Modify this object to transform data before it is sent. 

#### Rest

When [loopback.rest](#loopbackrest) is used the following `ctx` properties are available.

##### ctx.req

The express ServerRequest object. [See full documentation](http://expressjs.com/api.html#req).

##### ctx.res

The express ServerResponse object. [See full documentation](http://expressjs.com/api.html#res).
