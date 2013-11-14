## Remote methods

Both instance and static methods can be exposed to clients. A remote method must accept a callback with the conventional `fn(err, result, ...)` signature. 

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

 - **accepts** - (optional) an arguments description specifying the remote method's arguments.
 - **returns** - (optional) an arguments description specifying the remote methods callback arguments.
 - **http** - (advanced / optional, object) http routing info
  - **http.path** - the path relative to the model the method will be exposed at. May be a path fragment (eg. '/:myArg') which will be populated by an arg of the same name in the accepts description. For example the stats method above will be at the whole path `/products/stats`.
  - **http.verb** - (get, post, put, del, all) - the route verb the method will be available from.
 
**Argument Description**

An arguments description defines either a single argument as an object or an ordered set of arguments as an array.

```js
// examples
{arg: 'myArg', type: 'number'}

[
  {arg: 'arg1', type: 'number', required: true},
  {arg: 'arg2', type: 'array'}
]
```

**Types**

Each argument may define any of the [loopback types](#loopback-types).

**Notes:**

  - The callback is an assumed argument and does not need to be specified in the accepts array.
  - The err argument is also assumed and does not need to be specified in the returns array.

## Remote Hooks

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
