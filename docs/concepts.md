##Concepts

###What is LoopBack?

 - a component in the StrongLoop Suite
 - a library of Node.js modules for connecting mobile apps to various data
 sources
 - a command line tool `slc lb` for generating applications and models 
 - a set of SDKs for native and web mobile clients

###How it Works

LoopBack apps are made up of three components: mobile clients, data sources, and
models. Clients, such as mobile or web apps, use LoopBack mobile SDKs to
interact with data sources, such as a database or REST API. Access to these
data sources is provided by models, which control how a data source is exposed
to a mobile client.

Any mobile or web app can interact with a LoopBack data source through
the model API. The model API is available in Node.js, over REST, and as
native mobile SDKs for iOS, Android, and HTML5. Using the API, clients can query
databases, store data, upload files, send emails, create push notifications,
register users, and any other behavior provided by data sources.

### Mobile Clients

**PLACEHOLDER FOR SDK INTRO**

###Models

**What is a Model?**

In LoopBack, a **Model** consists of the following.

 - application data
 - business rules
 - logic
 - functions

A mobile client uses APIs provided by **Models** to request any information
needed to display a useful interface to the user.

**A Simple Example**

For example, an e-commerce app might have `Product` and `Inventory` models.
A mobile client could use the `Product` model API to search all the products in
a database. A client could join the `Product` and `Inventory` data to determine
what products are in-stock, or the `Product` model could provide a server-side
function (or [remote method](#remote-methods)) that returns this information.

```js
var loopback = require('loopback');
var Model = loopback.Model;
var Product = Model.extend('product');
var Inventory = Model.extend('customer');
```

> - Models are **schema-less** by default.
> - Some data sources, such as relational databases, require schemas.
> - Adding a schema allows you to sanitize data coming from mobile clients.

**Attaching Data Sources**

Attaching a model to a data source gives you access to the data source's API.
Using the MongoDB connector, this data source provides a `create` method. This
example uses the `create` method to store a new product.

```js
var db = loopback.createDataSource({
  connector: require('loopback-connector-mongodb')
});

// enables the model to use
// the mongodb api
Product.attachTo(db);

// create a new product in the database
Product.create({name: 'widget', price: 99.99}, function(err, widget) {
  console.log(widget.id); // the product's id
});
```

**Exposing to Mobile Clients**

Models can be exposed to mobile clients using one of the remoting middlewares.
This example uses the `app.rest` middleware to expose the `Product` model's API
over REST.

```js
// create a loopback app
var app = loopback();

// use the REST remoting middleware
app.use(loopback.rest());

// expose the `Product` model
app.model(Product);
```

**Sanitizing and Validating Models**

Once a schema is added to a model, it will validate and sanitize data before
giving it to a data source. For example, the `Product` model has a schema that
will not change. The example below updates the `Product` model with a schema
written in **LoopBack Definition Language**, a well documented flavor of JSON.

```js
var productSchema = {
  "name": {"type": "string", "required": true},
  "price": "number"
};
var Product = Model.extend('product', productSchema);
```

If a remote client tries to save a product with extra properties, they will be
removed. The model will only be saved if the product contains the required
`name` property.

**Learn more about models**

- Check out the model [REST API](#rest-api)
- Read the
[LoopBack Definition Language Guide](http://docs.strongloop.com/loopback-datasource-juggler#loopback-definition-language-guide).
- Browse the [Node.js Model API](#model).
- Before you build your own, check out the [bundled models](#bundled-models).
- Expose custom behavior to clients using [remote methods](#remote-methods).
- See how to [define relationships](#relationships) between models.

###Datasources and Connectors

LoopBack allows you to connect to many sources of data and services in the cloud
and on premise in your data center. These sources of data and services are
called DataSources. DataSources are accessed through a plugin called a Connector
in LoopBack.  Plugins are highly customizable and extensible.  Unlike other
mobile backend, LoopBack can leverage your existing data and organize them in
the form of models.

The concept of DataSource is introduced to encapsulate business logic to
exchange data between models and various data sources. Data sources are
typically databases that provide create, retrieve, update, and delete (CRUD)
functions. LoopBack also generalize other backend services, such as REST APIs,
SOAP Web Services, and Storage Services, as data sources.

Data sources are backed by connectors which implement the data exchange logic
using database drivers or other client APIs. In general, connectors are not used
directly by application code. The DataSource class provides APIs to configure
the underlying connector and exposes functions via DataSource or model classes.

**LoopBack Connector Modules**

|    Type   | Package Name                                                                           |
| --------- | -------------------------------------------------------------------------------------- |
| Memory    | [Built-in](https://github.com/strongloop/loopback-datasource-juggler)                  |
| MongoDB   | [loopback-connector-mongodb](https://github.com/strongloop/loopback-connector-mongodb) |
| Oracle    | [loopback-connector-oracle](https://github.com/strongloop/loopback-connector-oracle)   |
| REST      | [loopback-connector-rest](https://github.com/strongloop/loopback-connector-rest)       |

For more information, please read [LoopBack DataSource and Connector Guide](/loopback-datasource-juggler/#loopback-datasource-and-connector-guide).

### REST

Everything defined in LoopBack is available to you as a REST endpoint.  For
every model that is created in LoopBack, a REST endpoint is automatically
created for you.  You can see and experiment with your REST api using the
[LoopBack API Explorer](http://localhost:3000/explorer/).

LoopBack also supports other protocols for your API as well.  Socket.io is
another protocol that is currently being developed.

For more information, please read [Model REST APIs](#model-rest-api).

### Remoting

With LoopBack you can add whatever functionality you like either
by yourself or leveraging functionality from other open source
modules from the community.  The ability to "mix in" behaviors are
available through the inherent power of Javascript's less resrictive
inheritance model.

LoopBack takes this one step further by allowing you to seamlessly
invoke server side code running in LoopBack in the backend from the
your client on the front end.

For more information, please read the [Remoting Guide](/strong-remoting).

---
