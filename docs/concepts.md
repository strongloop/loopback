## Working with Models

A LoopBack model consists of:

 - Application data.
 - Validation rules.
 - Data access capabilities.
 - Business logic.

Apps use the model API to display information to the user or trigger actions
on the models to interact with backend systems.  LoopBack supports both "dynamic" schema-less models and "static", schema-driven models.

_Dynamic models_ require only a name.  The format of the data are specified completely and flexibly by the client application. Well-suited for data that originates on the client, dynamic models enable you to persist data both between sessions and between devices without involving a schema.

_Static models_ require more code up front, with the format of the data specified completely in JSON. Well-suited to both existing data and large, intricate datasets, static models provide structure and
consistency to their data, preventing bugs that can result from unexpected data in the database. 

Here is a simple example of creating and using a model.

<h3>Defining a Model</h3>

Consider an e-commerce app with `Product` and `Inventory` models.
A mobile client could use the `Product` model API to search through all of the
products in a database. A client could join the `Product` and `Inventory` data to
determine what products are in stock, or the `Product` model could provide a
server-side function (or [remote method](#remote-methods)) that aggregates this
information.

For example, the following code creates product and inventory models:

```js
var Model = require('loopback').Model;
var Product = Model.extend('product');
var Inventory = Model.extend('customer');
```

The above code creates two dynamic models, appropriate when data is "free form." However, some data sources, such as relational databases, require schemas. Additionally, schemas are valuable to enable data exchange and to validate or sanitize data from clients; see [Sanitizing and Validating Models](#sanitizing-and-validating-models).

<h3>Attaching a Model to a Data Source</h3>

A data source enables a model to access and modify data in backend system such as a relational database.
Attaching a model to a data source, enables the model to use the data source API.  For example, as shown below, the [MongoDB Connector](http://docs.strongloop.com/loopback-connector-mongodb), mixes in a `create` method that you can use to store a new product in the database; for example:

```js
// Attach data sources
var db = loopback.createDataSource({
  connector: require('loopback-connector-mongodb')
});

// Enable the model to use the MongoDB API
Product.attachTo(db);

// Create a new product in the database
Product.create({ name: 'widget', price: 99.99 }, function(err, widget) {
  console.log(widget.id); // The product's id, added by MongoDB
});
```

Now the models have both data and behaviors. Next, you need to make the models available to mobile clients.

<h3>Exposing a Model to Mobile Clients</h3>

To expose a model to mobile clients, use one of LoopBack's remoting middleware modules.
This example uses the `app.rest` middleware to expose the `Product` Model's API over REST.

For more information on LoopBack's REST API, see [REST API](#rest-api).

```js
// Step 3: Create a LoopBack application
var app = loopback();

// Use the REST remoting middleware
app.use(loopback.rest());

// Expose the `Product` model
app.model(Product);
```

After this, you'll have the `Product` model with create, read, update, and delete (CRUD) functions working remotely
from mobile clients. At this point, the model is schema-less and the data are not checked.

<h3>Sanitizing and Validating Models</h3>

A *schema* provides a description of a model written in **LoopBack Definition Language**, a specific form of JSON. Once a schema is defined for a model, the model validates and sanitizes data before passing it on to a data store such as a database.  A model with a schema is referred to as a _static model_.

For example, the following code defines a schema and assigns it to the product model.  The schema defines two fields (columns): **name**, a string, and **price**, a number.  The field **name** is a required value.

```js
var productSchema = {
  "name": { "type": "string", "required": true },
  "price": "number"
};
var Product = Model.extend('product', productSchema);
```

A schema imposes restrictions on the model: If a remote client tries to save a product with extra properties
(for example, `description`), those properties are removed before the app saves the data in the model.
Also, since `name` is a required value, the model will _only_ be saved if the product contains a value for the `name` property.

<h3>More Information</h3>

- Check out the model [REST API](#rest-api).
- Read the
[LoopBack Definition Language Guide](http://docs.strongloop.com/loopback-datasource-juggler#loopback-definition-language-guide).
- Browse the [Node.js model API](#model).
- Before you build your own, check out the [bundled models](#bundled-models).
- Expose custom behavior to clients using [remote methods](#remote-methods).
- See how to [define relationships](#relationships) between models.

## Working with Data Sources and Connectors

Data sources encapsulate business logic to exchange data between models and various back-end systems such as
relational databases, REST APIs, SOAP web services, storage services, and so on.
Data sources generally provide create, retrieve, update, and delete (CRUD) functions. 

Models access data sources through _connectors_ that are extensible and customizable.  
Connectors implement the data exchange logic using database drivers or other
client APIs. In general, application code does not use a connector directly.
Rather, the `DataSource` class provides an API to configure the underlying connector.

<h3> LoopBack Connectors</h3>

LoopBack provides several connectors, with more under development.

<table style="
    margin-left: 1em;
    border: solid 1px #AAAAAA;
    border-collapse: collapse;
    background-color: #F9F9F9;
    font-size: 90%;
    empty-cells:show;" border="1" cellpadding="5">
<thead>
<tr style="background-color: #C7C7C7;">
<th>Connector</th>
<th>GitHub Module</th>
</tr>
</thead>    
<tbody>
<tr>
<td><a href="/loopback-datasource-juggler/">Memory</a></td>
<td>Built-in to <a href="https://github.com/strongloop/loopback-datasource-juggler">loopback-datasource-juggler</a></td>
</tr>
<tr>
<td><a href="/loopback-connector-mongodb/">MongoDB</a></td>
<td><a href="https://github.com/strongloop/loopback-connector-mongodb">loopback-connector-mongodb</a></td>
</tr>
<tr>
<td><a href="/loopback-connector-oracle/">Oracle</a></td>
<td><a href="https://github.com/strongloop/loopback-connector-oracle">loopback-connector-oracle</a></td>
</tr>
<tr>
<td><a href="/loopback-connector-rest/">REST</a></td>
<td><a href="https://github.com/strongloop/loopback-connector-rest">loopback-connector-rest</a></td>
</tr>
</tbody>
</table>


For more information, see the [LoopBack DataSource and Connector Guide](/loopback-datasource-juggler/#loopback-datasource-and-connector-guide).
