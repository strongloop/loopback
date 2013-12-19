## App object

The App object represents a Loopback application.

The App object extends [Express](http://expressjs.com/api.html#express) and supports [Express / Connect middleware](http://expressjs.com/api.html#middleware).  See [Express documentation](http://expressjs.com/api.html) for details.

```js
var loopback = require('loopback');
var app = loopback();

app.get('/', function(req, res){
  res.send('hello world');
});

app.listen(3000);
```
    
## Properties

### models

The `app.models` object has properties for all defined models. In the following example the `Product` and `CustomerReceipt` models are accessed using the `models` object.

**NOTE:** you must call `app.boot()` to create the `app.models` object.

```js
var loopback = require('loopback');
var app = loopback();
app.boot({
  dataSources: {
    db: {connector: 'memory'}
  }
});
app.model('product', {dataSource: 'db'});
app.model('customer-receipt', {dataSource: 'db'});

// available based on the given name
var Product = app.models.Product;

// also available as camelCase
var product = app.models.product;

// multi-word models are avaiable as pascal cased
var CustomerReceipt = app.models.CustomerReceipt;

// also available as camelCase
var customerReceipt = app.models.customerReceipt;
```

## Methods 

### app.boot([options])

Initialize an application from an options object or a set of JSON and JavaScript files.

**What happens during an app _boot_?**

1. **DataSources** are created from an `options.dataSources` object or `datasources.json` in the current directory
2. **Models** are created from an `options.models` object or `models.json` in the current directory
3. Any JavaScript files in the `./models` directory are loaded with `require()`.
4. Any JavaScript files in the `./boot` directory are loaded with `require()`.

**Options**

 - `cwd` - _optional_ - the directory to use when loading JSON and JavaScript files
 - `models` - _optional_ - an object containing `Model` definitions
 - `dataSources` - _optional_ - an object containing `DataSource` definitions

> **NOTE:** mixing `app.boot()` and `app.model(name, config)` in multiple files may result
> in models being **undefined** due to race conditions. To avoid this when using `app.boot()`
> make sure all models are passed as part of the `models` definition.

<a name="model-definition"></a>
**Model Definitions**

The following is an example of an object containing two `Model` definitions: "location" and "inventory".

```js
{
  "dealership": {
    // a reference, by name, to a dataSource definition
    "dataSource": "my-db",
    // the options passed to Model.extend(name, properties, options)
    "options": {
      "relationships": {
        "cars": {
          "type": "hasMany",
          "model": "Car",
          "foreignKey": "dealerId"  
        }
      },
      "remoteMethods": {
        "nearby": {
          "description": "Find nearby locations around the geo point",
          "accepts": [
            {"arg": "here", "type": "GeoPoint", "required": true, "description": "geo location (lat & lng)"}
          ],
          "returns": {"arg": "locations", "root": true}
        }
      }
    },
    // the properties passed to Model.extend(name, properties, options)
    "properties": {
      "id": {"id": true},
      "name": "String",
      "zip": "Number",
      "address": "String"
    }
  },
  "car": {
    "dataSource": "my-db"
    "properties": {
      "id": {
        "type": "String",
        "required": true,
        "id": true
      },
      "make": {
        "type": "String",
        "required": true
      },
      "model": {
        "type": "String",
        "required": true
      }
    }
  }
}
```

**Model definition properties**

 - `dataSource` - **required** - a string containing the name of the data source definition to attach the `Model` to
 - `options` - _optional_ - an object containing `Model` options
 - `properties` _optional_ - an object defining the `Model` properties in [LoopBack Definition Language](http://docs.strongloop.com/loopback-datasource-juggler/#loopback-definition-language)

**DataSource definition properties**
 
 - `connector` - **required** - the name of the [connector](#working-with-data-sources-and-connectors)

### model(name, definition)

Define a `Model` and export it for use by remote clients.

**definition**

- `public` - **default: true** attach the `Model` to the app and export its methods to clients
- `dataSource` - **required** the name of the `DataSource` to attach the `Model` to

Example:

```js
// declare a DataSource
app.boot({
  dataSources: {
    db: {
      connector: 'mongodb',
      url: 'mongodb://localhost:27015/my-database-name'
    }
  }
});

// describe a model
var modelDefinition = {dataSource: 'db'};

// create the model
var Product = app.model('product', modelDefinition);

// use the model api
Product.create({name: 'pencil', price: 0.99}, console.log);
```
    
**Note** - This will expose all [shared methods](#shared-methods) on the model.

You may also export an existing `Model` by calling `app.model(Model)` like the example below.

### models()

Get the app's exported models. Only models defined using `app.model()` will show up in this list.

```js
var models = app.models();

models.forEach(function (Model) {
  console.log(Model.modelName); // color
});
```

### docs(options)

Enable swagger REST API documentation.

**Options**

 - `basePath` The basepath for your API - eg. 'http://localhost:3000'.

**Example**

```js
// enable docs
app.docs({basePath: 'http://localhost:3000'});
```

Run your app then navigate to [the API explorer](http://petstore.swagger.wordnik.com/). Enter your API basepath to view your generated docs.

### app.use( router )

Expose models over specified router.
For example, to expose models over REST using the `loopback.rest` router:

```js
app.use(loopback.rest());
```

View generated REST documentation at [http://localhost:3000/_docs](http://localhost:3000/_docs).

### Middleware

LoopBack includes middleware similar to [Express / Connect middleware](http://expressjs.com/api.html#middleware).  



#### loopback.token(options)
    
**Options**

 - `cookies` - An `Array` of cookie names
 - `headers` - An `Array` of header names
 - `params` - An `Array` of param names

Each array is used to add additional keys to find an `accessToken` for a `request`.

The following example illustrates how to check for an `accessToken` in a custom cookie, query string parameter
and header called `foo-auth`.

```js
app.use(loopback.token({
  cookies: ['foo-auth'],
  headers: ['foo-auth', 'X-Foo-Auth'],
  cookies: ['foo-auth', 'foo_auth']
}));
```

**Defaults**

By default the following names will be checked. These names are appended to any optional names. They will always
be checked, but any names specified will be checked first.

```js
  params.push('access_token');
  headers.push('X-Access-Token');
  headers.push('authorization');
  cookies.push('access_token');
  cookies.push('authorization');
```

> **NOTE:** The `loopback.token()` middleware will only check for [signed cookies](http://expressjs.com/api.html#req.signedCookies).
