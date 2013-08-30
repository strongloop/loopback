##Concepts

###SDKs

**PLACEHOLDER FOR SDK INTRO**

###Model

LoopBack is centered around models.  A model is an object that encapsulates
data.  A model is usually named after its real life counterpart.  Like its real
life counterpart, a model has some properties. Each property has a name, a type,
and other attributes. For example,

    model: Person

    properties:
    - a Person model has properties such as First Name, Last Name and Birthday.
    - First Name and Last Name are strings while Birthday is date.

A model can also do things as actions and behaviors. Some actions are common to
all instances of the same model while others are specific to a given instance.
For example,

    model: Person

    actions:
    - a Person model can say his/her Full Name (relying on a given instance)
    - a Person model can find people by Last Name (independent of instances)

Models are the vehicle for data exchange and data representation across
different layers in LoopBack. For example, the Person model is available as
database tables, Node.js classes, REST resources, and mobile SDK objects.

When developing your mobile applications, think of models being the "M" in your
MVC framework.  Models in LoopBack have backend connectivity built in already,
so that you can save data back to your backend and call actions or functions run
on the backend seamlessly from your mobile application.

###LoopBack Definition Language (LDL)

All models in LoopBack can be described as JSON objects.  LoopBack has utilized
and extended JSON to define a model's properties and structure. The JSON that is
utilized to help define a model's properties and structure or schema is called
LoopBack Definition Language (LDL). LDL is simple DSL to define data models in
JavaScript or plain JSON. The model definitions establish common knowledge of
data in LoopBack. For example,

    model: Person

    definition in LDL:
    {
        "firstName" : "string",
        "lastName" : "string",
        "birthday": "date"
    }

For more information, please read [LoopBack Definition Language Guide](/loopback-datasource-juggler/#loopback-definition-language-guide).

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

#### LoopBack Connector Modules

|    Type   | Package Name                                                                           |
| --------- |:--------------------------------------------------------------------------------------:|
| Memory    | [Built-in](https://github.com/strongloop/loopback-datasource-juggler) |
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

For more information, please read the [Remoting Guide](/strong-remoting.README.md).

---
