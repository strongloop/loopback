## Data Source object

LoopBack models can manipulate data via the DataSource object.  Attaching a `DataSource` to a `Model` adds instance methods and static methods to the `Model`; some of the added methods may be remote methods.

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

### Methods

#### dataSource.createModel(name, properties, options)

Define a model and attach it to a `DataSource`.

```js
var Color = oracle.createModel('color', {name: String});
```

You can define an ACL when you create a new data source with the `DataSource.create()` method. For example:

```js
var Customer = ds.createModel('Customer', {
      name: {
        type: String,
        acls: [
          {principalType: ACL.USER, principalId: 'u001', accessType: ACL.WRITE, permission: ACL.DENY},
          {principalType: ACL.USER, principalId: 'u001', accessType: ACL.ALL, permission: ACL.ALLOW}
        ]
      }
    }, {
      acls: [
        {principalType: ACL.USER, principalId: 'u001', accessType: ACL.ALL, permission: ACL.ALLOW}
      ]
    });
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

 - Disabled operations will not be added to attached models.
 - Disabling the remoting for a method only affects client access (it will still be available from server models).
 - Data sources must enable / disable operations before attaching or creating models.

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
