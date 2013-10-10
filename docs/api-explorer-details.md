<!-- NOTE: This file is not currently included into the docs.  Need to (a) decide if this info is important and if so (b) decide where to put it.

-->

# REST API specs

LoopBack API Explorer is built on top of the popular
[Swagger Framework](https://github.com/wordnik/swagger-core/wiki). There are two
components involved.

1. LoopBack builds up formal specifications of the REST APIs using the knowledge of
model definitions, JavaScript method declarations, and remote mappings. The
specifications are served over the following endpoints.

2. The wonderful Web UI is brought you by [Swagger UI](https://github.com/strongloop/swagger-ui).
Swagger UI is a collection of HTML, Javascript, and CSS assets that dynamically
generate beautiful documentation and sandbox from the REST API specifications.

## Resource Listing
The first part is a listing of the REST APIs.

- http://localhost:3000/swagger/resources

```javascript
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
```

## Resource Operations
The second part describes all operations of a given model.

- http://localhost:3000/swagger/locations

```javascript
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
```
