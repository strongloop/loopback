### Using the API Explorer

LoopBack has created a REST API for the sample app. LoopBack provides a web-based
API explorer so you can quickly see and test out the REST API for the models.
Follow these steps:

1. Open your browser to http://localhost:3000/explorer. You'll see a list of REST API endpoints as illustrated below.

<img src="/loopback/assets/explorer-listing.png" alt="API Exlporer Listing" width="800">

<!--
![Resource Listing](assets/explorer-listing.png)
-->

The endpoints are grouped by the model names. Each endpoint consists of a list
of operations for the model.

Step 3: Click on one of the endpoint paths (such as /locations) to see available
operations for a given model.

<img src="/loopback/assets/explorer-endpoint.png" alt="API Exlporer Endpoints" width="600" style="border: 1px solid gray; padding: 5px;">

<!--
![API Endpoint](assets/explorer-endpoint.png)
-->

Great, now you see the CRUD operations mapped to HTTP verbs and paths.

Step 4: Click on a given operation to see the signature

![API Spec](assets/explorer-api.png)

Please note each operation has the HTTP verb, path, description, response model,
and a list of request parameters.

Step 5: Try to invoke an operation

Fill in the parameters, and then click on `Try it out!` button.

Here we go:

![Request/Response](assets/explorer-req-res.png)

Cool, we can invoke the REST APIs without writing code!

You might be curious about the magic behind it all. Let's reveal a bit to you.

### REST API specs

LoopBack API Explorer is built on top of the popular
[Swagger Framework](https://github.com/wordnik/swagger-core/wiki). There are two
components involved.

1. LoopBack builds up formal specifications of the REST APIs using the knowledge of
model definitions, JavaScript method declarations, and remote mappings. The
specifications are served over the following endpoints.

2. The wonderful Web UI is brought you by [Swagger UI](https://github.com/strongloop/swagger-ui).
Swagger UI is a collection of HTML, Javascript, and CSS assets that dynamically
generate beautiful documentation and sandbox from the REST API specifications.

#### Resource Listing
The first part is a listing of the REST APIs.

- http://localhost:3000/swagger/resources


    {
      "swaggerVersion": "1.1",
      "basePath": "http://localhost:3000",
      "apis": [
        {
          "path": "/swagger/ammo"
        },
        {
          "path": "/swagger/customers"
        },
        {
          "path": "/swagger/inventory"
        },
        {
          "path": "/swagger/locations"
        },
        {
          "path": "/swagger/weapons"
        }
      ]
    }

#### Resource Operations
The second part describes all operations of a given model.

- http://localhost:3000/swagger/locations


    {
      "swaggerVersion": "1.1",
      "basePath": "http://localhost:3000",
      "apis": [
        {
          "path": "/locations",
          "operations": [
            {
              "httpMethod": "POST",
              "nickname": "locations_create",
              "responseClass": "object",
              "parameters": [
                {
                  "paramType": "body",
                  "name": "data",
                  "description": "Model instance data",
                  "dataType": "object",
                  "required": false,
                  "allowMultiple": false
                }
              ],
              "errorResponses": [],
              "summary": "Create a new instance of the model and persist it into the data source",
              "notes": ""
            }
          ]
        },
        ...
        {
          "path": "/locations/{id}",
          "operations": [
            {
              "httpMethod": "GET",
              "nickname": "locations_findById",
              "responseClass": "any",
              "parameters": [
                {
                  "paramType": "path",
                  "name": "id",
                  "description": "Model id",
                  "dataType": "any",
                  "required": true,
                  "allowMultiple": false
                }
              ],
              "errorResponses": [],
              "summary": "Find a model instance by id from the data source",
              "notes": ""
            }
          ]
        },
        ...
      ]
    }

<h3>Next Steps</h3>

To gain a deeper understanding LoopBack and how it works, read the following [Key Concepts](#key-concepts) section.

For information on how StrongLoop Suite provides:

 - Out-of-the-box scalability, see
 [StrongNode](http://docs.strongloop.com/strongnode#quick-start).
 - CPU profiling and path trace features, see
 [StrongOps](http://docs.strongloop.com/strongops#quick-start).
 - Mobile client APIs, see [LoopBack Client SDKs](http://docs.strongloop.com/loopback-clients/).

