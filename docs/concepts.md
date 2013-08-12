##Concepts

###What is a Model?

LoopBack is centered around models.  A model is an object that encapsulates data.  A model is usually named after its real life counterpart.  Like its real life counterpart a model has properties or attributes.


  Example)

  model = person
  a person model has properties such as a First Name and Last Name

A model can also do things as actions and behavior.

  Example)

  model = person
  a person model can speak and say his/her Full Name

When developing your mobile applications, think of models being the "M" in your MVC framework.  Models in LoopBack have backend connectivty built in already, so that you can save data back to your backend and call actions or functions run on the backend seamlessly from your mobile application.

###What is LoopBack Definition Language (LDL)?
All models in LoopBack can be represented as JSON objects.  LoopBack has utilized and extended JSON to define a model's properties and structure.  The JSON that is utilized to help define a model's properties and stucture or schema is called LoopBack Definition Language (LDL).  LDL is a type of domain specific language <insert link>

  Example)

  model = person
  {firstname : string, lastname : string, age: number}

###What is a Datasource and Connector?

LoopBack allows you to connect to many sources of data and services in the cloud and on premise in your datacenter.  These sources of data and services are called Datasources.  

Datasources are accessed through a plugin called a Connector in LoopBack.  Plugins are highly customizable and extensible.  Unlike other mobile backend, LoopBack can leverage your existing data and organize them in the form of models.

#### Discovery
#### Supported Connectors
#### Connector Spec

### REST

Everything defined in LoopBack is availabe to you as a REST endpoint.  For every model that is created in LoopBack, a REST endpoint is automatically created for you.  You can see and experiment with your REST api using the <insert link>> LoopBack API Explorer.

LoopBack also supports other protocols for your API as well.  Socket.io is another protocol that is currently being developed. 

### Mix In

### Remoting 

---
