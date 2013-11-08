### Data Source

A Loopback `DataSource` provides [Models](#model) with the ability to manipulate data. Attaching a `DataSource` to a `Model` adds [instance methods](#instance-methods) and [static methods](#static-methods) to the `Model`. The added methods may be [remote methods](#remote-methods).

Define a data source for persisting models.

```js
var oracle = loopback.createDataSource({
  connector: 'oracle',
  host: '111.22.333.44',
  database: 'MYDB',
  username: 'username',
  password: 'password'
});
```
    
#### dataSource.createModel(name, properties, options)

Define a model and attach it to a `DataSource`.

```js
var Color = oracle.createModel('color', {name: String});
```

#### dataSource.discoverModelDefinitions([username], fn)

Discover a set of model definitions (table or collection names) based on tables or collections in a data source.

```js
oracle.discoverModelDefinitions(function (err, models) {
  models.forEach(function (def) {
    // def.name ~ the model name
    oracle.discoverSchema(null, def.name, function (err, schema) {
      console.log(schema);
    });
  });
});
```
    
#### dataSource.discoverSchema([owner], name, fn)

Discover the schema of a specific table or collection.

**Example schema from oracle connector:**

```js
    {
      "name": "Product",
      "options": {
        "idInjection": false,
        "oracle": {
          "schema": "BLACKPOOL",
          "table": "PRODUCT"
        }
      },
      "properties": {
        "id": {
          "type": "String",
          "required": true,
          "length": 20,
          "id": 1,
          "oracle": {
            "columnName": "ID",
            "dataType": "VARCHAR2",
            "dataLength": 20,
            "nullable": "N"
          }
        },
        "name": {
          "type": "String",
          "required": false,
          "length": 64,
          "oracle": {
            "columnName": "NAME",
            "dataType": "VARCHAR2",
            "dataLength": 64,
            "nullable": "Y"
          }
        },
        "audibleRange": {
          "type": "Number",
          "required": false,
          "length": 22,
          "oracle": {
            "columnName": "AUDIBLE_RANGE",
            "dataType": "NUMBER",
            "dataLength": 22,
            "nullable": "Y"
          }
        },
        "effectiveRange": {
          "type": "Number",
          "required": false,
          "length": 22,
          "oracle": {
            "columnName": "EFFECTIVE_RANGE",
            "dataType": "NUMBER",
            "dataLength": 22,
            "nullable": "Y"
          }
        },
        "rounds": {
          "type": "Number",
          "required": false,
          "length": 22,
          "oracle": {
            "columnName": "ROUNDS",
            "dataType": "NUMBER",
            "dataLength": 22,
            "nullable": "Y"
          }
        },
        "extras": {
          "type": "String",
          "required": false,
          "length": 64,
          "oracle": {
            "columnName": "EXTRAS",
            "dataType": "VARCHAR2",
            "dataLength": 64,
            "nullable": "Y"
          }
        },
        "fireModes": {
          "type": "String",
          "required": false,
          "length": 64,
          "oracle": {
            "columnName": "FIRE_MODES",
            "dataType": "VARCHAR2",
            "dataLength": 64,
            "nullable": "Y"
          }
        }
      }
    }
```

#### dataSource.enableRemote(operation)

Enable remote access to a data source operation. Each [connector](#connector) has its own set of set remotely enabled and disabled operations. You can always list these by calling `dataSource.operations()`.
    

#### dataSource.disableRemote(operation)

Disable remote access to a data source operation. Each [connector](#connector) has its own set of set enabled and disabled operations. You can always list these by calling `dataSource.operations()`.

```js
// all rest data source operations are
// disabled by default
var oracle = loopback.createDataSource({
  connector: require('loopback-connector-oracle'),
  host: '...',
  ...
});

// or only disable it as a remote method
oracle.disableRemote('destroyAll');
```

**Notes:**

 - disabled operations will not be added to attached models
 - disabling the remoting for a method only affects client access (it will still be available from server models)
 - data sources must enable / disable operations before attaching or creating models

#### dataSource.operations()

List the enabled and disabled operations.

    console.log(oracle.operations());
    
Output:

```js
{
  find: {
    remoteEnabled: true,
    accepts: [...],
    returns: [...]
    enabled: true
  },
  save: {
    remoteEnabled: true,
    prototype: true,
    accepts: [...],
    returns: [...],
    enabled: true
  },
  ...
}
```

#### Connectors

Create a data source with a specific connector. See **available connectors** for specific connector documentation. 

```js
var memory = loopback.createDataSource({
  connector: loopback.Memory
});
```
    
**Database Connectors**
 
 - [In Memory](#memory-connector)
 - [Oracle](http://github.com/strongloop/loopback-connector-oracle)
 - [MongoDB](http://github.com/strongloop/loopback-connector-mongodb)
 - [MySQL](http://github.com/strongloop/loopback-connector-mysql) - In Development
 - [SQLite3](http://github.com/strongloop/loopback-connector-sqlite) - In Development
 - [Postgres](http://github.com/strongloop/loopback-connector-postgres) - In Development
 - [Redis](http://github.com/strongloop/loopback-connector-redis) - In Development
 - [CouchDB](http://github.com/strongloop/loopback-connector-couch) - In Development
 - [Firebird](http://github.com/strongloop/loopback-connector-firebird) - In Development

**Other Connectors**

 - [REST](http://github.com/strongloop/loopback-connector-rest)
 - [Email](#email-model)
 - [JSON RPC](http://github.com/strongloop/loopback-connector-jsonrpc) - In Development
 - [SOAP](http://github.com/strongloop/loopback-connector-soap) - In Development
 - [Push Notifications](https://github.com/strongloop/loopback-push-notification) - In Development
 - [File Storage](https://github.com/strongloop/loopback-storage-service) - In Development

**Installing Connectors**

Include the connector in your package.json dependencies and run `npm install`.

```js
{
  "dependencies": {
    "loopback-connector-oracle": "latest"
  }
}
```

##### Memory Connector

The built-in memory connector allows you to test your application without connecting to an actual persistent data source, such as a database. Although the memory connector is very well tested it is not recommended to be used in production. Creating a data source using the memory connector is very simple.

```js
// use the built in memory function
// to create a memory data source
var memory = loopback.memory();

// or create it using the standard
// data source creation api
var memory = loopback.createDataSource({
  connector: loopback.Memory
});

// create a model using the
// memory data source
var properties = {
  name: String,
  price: Number
};

var Product = memory.createModel('product', properties);

Product.create([
  {name: 'apple', price: 0.79},
  {name: 'pear', price: 1.29},
  {name: 'orange', price: 0.59},
], count);

function count() {
  Product.count(console.log); // 3
}
```

**CRUD / Query**

The memory connector supports all the standard [query and crud operations](#crud-and-query-mixins) to allow you to test your models against an in memory data source.

**GeoPoint Filtering**

The memory connector also supports geo-filtering when using the `find()` operation with an attached model. See [GeoPoint](#geopoint) for more information on geo-filtering.
