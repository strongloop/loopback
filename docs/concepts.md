## Concepts

### Overview

Before we go into all the wonderful concepts that make up LoopBack, let's first
answer a couple of questions:

> What _is_ LoopBack?

 - A component in the [StrongLoop Suite](http://www.strongloop.com/strongloop-suite).
 - A library of Node.js modules for connecting mobile apps to a variety of data
 sources.
 - A command line tool, `slc lb`, for generating models and entire applications
 with the LoopBack library.
 - A set of SDKs for native and web-based mobile clients.

> How does LoopBack work?

 - LoopBack applications are made up of three components:
[Models](#models), [Data Sources/Connectors](#data-sources-and-connectors), and the
[Mobile Clients](#mobile-clients) that consume them.

 - Any mobile or web app can interact with LoopBack through the Model API that are
backed by various data sources. The Model API is available
[locally within Node.js](#model), [remotely over REST](#rest-api), and as native
mobile SDKs for [iOS, Android, and HTML5](#mobile-clients). Using the API,
clients can query databases, store data, upload files, send emails, create push
notifications, register users, and any other behavior provided by data sources.

![concepts](loopback-concepts.png "LoopBack Concepts")

### Mobile Clients

**PLACEHOLDER FOR SDK INTRO**

In summary, mobile clients work with objects that are connected to LoopBack
to provide data and perform actions.Those objects are captured as models in
LoopBack.

### Models

> What is a Model?

A LoopBack Model consists of the following:

 - Application data
 - Validation rules
 - Data access capabilities
 - Business logic

A mobile client uses the remote API provided by Models to request any
information needed to display a useful interface to the user or trigger actions
on the models to interact with backend systems.

Let's use a simple example to explain what a model can do for you.

#### Defining a model

For example, an e-commerce app might have `Product` and `Inventory` Models.
A mobile client could use the `Product` Model API to search through all of the
Products in a database. A client could join the `Product` and `Inventory` data to
determine what products are in stock, or the `Product` Model could provide a
server-side function (or [remote method](#remote-methods)) that aggregates this
information.

```js
// Step 1: Create Models
var Model = require('loopback').Model;
var Product = Model.extend('product');
var Inventory = Model.extend('customer');
```

**NOTE:** Models are _schema-less_ by default, but some data sources, such as
relational databases, _require_ schemas. Additionally, schemas are immensely
valuable for establishing the common knowledge of business data so that the data
exchange can be agreed and documented while data coming from mobile clients can
be validated and/or sanitized . See [Sanitizing and Validating Models](#sanitizing-and-validating-models)
if your application needs to connect to an RDBMS, for example.

#### Attaching to Data Sources

Instances of a Model carry application data. But they are not very interesting
until applications can create, retrieve, update, or delete (CRUD) model instances.
LoopBack introduces the DataSource concept to provide the data access
capabilities to models. Attaching a Model to a DataSource gives you access to a
powerful API mixed into Models by the Connector behind a DataSource. The
[MongoDB Connector](#), for example, mixes in a `create` method that allows us
to store a new Product in the database:

```js
// Step 2: Attach Data Sources
var db = loopback.createDataSource({
  connector: require('loopback-connector-mongodb')
});

// Enables the Model to use the MongoDB API
Product.attachTo(db);

// Create a new product in the database
Product.create({ name: 'widget', price: 99.99 }, function(err, widget) {
  console.log(widget.id); // The product's id, added by MongoDB
});
```

Now the models have both data and behaviors. How can the mobile clients benefit
from them? We need a way to make the models available from mobile clients.

#### Exposing to Mobile Clients

Models can be exposed to mobile clients using one of the remoting middlewares.
This example uses the `app.rest` middleware to expose the `Product` Model's API
over REST.

```js
// Step 3: Create a LoopBack Application
var app = loopback();

// Use the REST remoting middleware
app.use(loopback.rest());

// Expose the `Product` model
app.model(Product);
```

After this, you'll have the `Product` model with CRUD functions working remotely
from the mobile clients. Please note the model is schema-less till now and the
data are not checked.

#### Sanitizing and Validating Models

A Model can be described in plain json or JavaScript. The description is called
schema. Once a schema is defined for a Model, it will validate and sanitize data
before giving it to a Data Source. For example, the `Product` Model has a schema
that will not change. The example below updates the `Product` Model with a schema
written in **LoopBack Definition Language**, a well-documented flavor of JSON.

```js
// Step 4: Add a Schema
var productSchema = {
  "name": { "type": "string", "required": true },
  "price": "number"
};
var Product = Model.extend('product', productSchema);
```

On one hand, If a remote client tries to save a product with extra properties
(e.g. `description`), those properties will be removed before saving the Model.
On the other hand, the Model will _only_ be saved if the product contains the
required `name` property.

#### More About Models

- Check out the Model [REST API](#rest-api).
- Read the
[LoopBack Definition Language Guide](http://docs.strongloop.com/loopback-datasource-juggler#loopback-definition-language-guide).
- Browse the [Node.js Model API](#model).
- Before you build your own, check out the [bundled Models](#bundled-models).
- Expose custom behavior to clients using [remote methods](#remote-methods).
- See how to [define relationships](#relationships) between Models.

### Data Sources and Connectors

Now you see the power of LoopBack models. A model gets rich set of functions out
of the box with the contribution from Data Sources and Connectors.

The concept of DataSource is introduced to encapsulate business logic to
exchange data between models and various data sources. Data sources are
typically databases that provide create, retrieve, update, and delete (CRUD)
functions. LoopBack also generalize other backend services, such as REST APIs,
SOAP Web Services, and Storage Services, as data sources.

LoopBack allows you to connect to many sources of data and services both in the
cloud and on-premise in your data center. DataSources are accessed through a
plugin called a Connector in LoopBack.  Plugins are highly customizable and
extensible.  Unlike other mobile backend, LoopBack can leverage your existing
data and organize them in the form of models.

Connectors implement the data exchange logic using database drivers or other
client APIs. In general, connectors are not used directly by application code.
The DataSource class provides APIs to configure the underlying connector and
exposes functions via DataSource or model classes.

#### LoopBack Connector Modules

|    Type   | Package Name                                                                           |
| --------- | -------------------------------------------------------------------------------------- |
| Memory    | [Built-in](https://github.com/strongloop/loopback-datasource-juggler)                  |
| MongoDB   | [loopback-connector-mongodb](https://github.com/strongloop/loopback-connector-mongodb) |
| Oracle    | [loopback-connector-oracle](https://github.com/strongloop/loopback-connector-oracle)   |
| REST      | [loopback-connector-rest](https://github.com/strongloop/loopback-connector-rest)       |

For more information, please read the [LoopBack DataSource and Connector Guide](/loopback-datasource-juggler/#loopback-datasource-and-connector-guide).

### REST

Functions defined in LoopBack Models can be made available as a REST
endpoint. You can see and experiment with _your_ REST api using the
[LoopBack API Explorer](http://localhost:3000/explorer/).

LoopBack also supports other protocols for your API as well. Socket.io is
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
