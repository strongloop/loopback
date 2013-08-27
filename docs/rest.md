## REST API

LoopBack automatically binds a model to a list of HTTP endpoints that provide REST APIs for CRUD and other remote
operations.

### Sample Model

We use the following `Location` model as an example to illustrate generated REST APIs.

    {
      "name": "Location",
      "options": {
        "idInjection": false
      },
      "properties": {
        "id": {
          "type": "String",
          "length": 20,
          "id": 1
        },
        "street": {
          "type": "String",
          "required": false,
          "length": 20
        },
        "city": {
          "type": "String",
          "required": false,
          "length": 20
        },
        "zipcode": {
          "type": "Number",
          "required": false,
          "length": 20
        },
        "name": {
          "type": "String",
          "required": false,
          "length": 20
        },
        "geo": {
          "type": "GeoPoint"
        }
      }
    }

By default, the REST APIs are mounted to `/pluralFormOfTheModelName`, for example, `/locations`.

### CRUD remote methods

- Model.create: POST /locations
- Model.upsert: PUT /locations
- Model.exists: GET /locations/:id/exists
- Model.findById: GET /locations/:id
- Model.find: GET /locations
- Model.findOne: GET /locations/findOne
- Model.deleteById: DELETE /locations/:id
- Model.count: GET /locations/count
- Model.prototype.updateAttributes: PUT /locations/:id

### Custom remote methods

To expose a JavaScript method as REST API, we can simply describe the method as follows:

    loopback.remoteMethod(
      RentalLocation.nearby,
      {
        description: 'Find nearby locations around the given geo point',
        accepts: [
          {arg: 'here', type: 'GeoPoint', required: true},
          {arg: 'page', type: 'Number'},
          {arg: 'max', type: 'Number', description: 'max distance in miles'}
        ],
        returns: {arg: 'locations', root: true},
        http: {verb: 'POST', path: '/nearby'}
      }
    );

The remoting is defined using the following properties:

- description: Description of the REST API
- accepts: An array of parameter description
- returns: Description of the return value
- http: Binding to the HTTP endpoint

###Generated APIs


###create

Create a new instance of the model and persist it into the data source

####Definition

    POST /locations

####Arguments
* **data** The model instance data


####Example Request
    curl -X POST -H "Content-Type:application/json" -d '{"name": "L1", "street": "107 S B St", "city": "San Mateo", "zipcode": "94401"}' http://localhost:3000/locations

####Example Response


####Potential Errors
* None


###upsert


Update an existing model instance or insert a new one into the data source

####Definition


    PUT /locations

####Arguments
* **data** The model instance data


####Example Request
    curl -X PUT -H "Content-Type:application/json" -d '{"name": "L1", "street": "107 S B St", "city": "San Mateo", "zipcode": "94401"}' http://localhost:3000/locations

####Example Response


####Potential Errors
* None


###exists


Check whether a model instance exists by id in the data source

####Definition


    GET /locations/exists

####Arguments
* **id** The model id


####Example Request
    curl http://localhost:3000/locations/exists/88

####Example Response

    {
        "exists": true
    }

####Potential Errors
* None


###findById


Find a model instance by id from the data source

####Definition


    GET /locations/{id}

####Arguments
* **id** The model id


####Example Request
    curl http://localhost:3000/locations/88

####Example Response

    {
        "id": "88",
        "street": "390 Lang Road",
        "city": "Burlingame",
        "zipcode": 94010,
        "name": "Bay Area Firearms",
        "geo": {
            "lat": 37.5874391,
            "lng": -122.3381437
        }
    }

####Potential Errors
* None


###find


Find all instances of the model matched by filter from the data source

####Definition


    GET /locations

####Arguments
* **filter** The filter that defines where, order, fields, skip, and limit

Properties for the filter object:

    where - Object { key: val, key2: {gt: 'val2'}}
    include - String, Object or Array.
    order - String "key1 ASC, key2 DESC"
    limit - Number The max number of items
    skip - Number The number of items to be skipped
    fields - Object|Array|String A list of properties to be included or excluded
        ['foo'] or 'foo' - include only the foo property
        ['foo', 'bar'] - include the foo and bar properties
        {foo: true} - include only foo
        {bat: false} - include all properties, exclude bat

####Example Request
    curl http://localhost:3000/locations

####Example Response

    [
      {
        "id": "87",
        "street": "7153 East Thomas Road",
        "city": "Scottsdale",
        "zipcode": 85251,
        "name": "Phoenix Equipment Rentals",
        "geo": {
          "lat": 33.48034450000001,
          "lng": -111.9271738
        }
      },
      {
        "id": "88",
        "street": "390 Lang Road",
        "city": "Burlingame",
        "zipcode": 94010,
        "name": "Bay Area Firearms",
        "geo": {
          "lat": 37.5874391,
          "lng": -122.3381437
        }
      }
    ]

####Potential Errors
* None


###findOne


Find first instance of the model matched by filter from the data source


####Definition


    GET /locations/findOne

####Arguments
* **filter** The filter that defines where, order, fields, skip, and limit

Properties for the filter object:

    where - Object { key: val, key2: {gt: 'val2'}}
    include - String, Object or Array.
    order - String "key1 ASC, key2 DESC"
    limit - Number The max number of items
    skip - Number The number of items to be skipped
    fields - Object|Array|String A list of properties to be included or excluded
        ['foo'] or 'foo' - include only the foo property
        ['foo', 'bar'] - include the foo and bar properties
        {foo: true} - include only foo
        {bat: false} - include all properties, exclude bat


####Example Request
    curl http://localhost:3000/locations/findOne

####Example Response

    {
      "id": "87",
      "street": "7153 East Thomas Road",
      "city": "Scottsdale",
      "zipcode": 85251,
      "name": "Phoenix Equipment Rentals",
      "geo": {
        "lat": 33.48034450000001,
        "lng": -111.9271738
      }
    }

####Potential Errors
* None


###deleteById


Delete a model instance by id from the data source

####Definition


    DELETE /locations/{id}

####Arguments
* **id** The model id


####Example Request
    curl -X DELETE http://localhost:3000/locations/88

####Example Response


####Potential Errors
* None


###count


Count instances of the model matched by where from the data source

####Definition


    GET /locations/count

####Arguments
* **where** The criteria to match model instances


####Example Request
    curl http://localhost:3000/locations/count

####Example Response

    {
        count: 6
    }

####Potential Errors
* None


###nearby


Find nearby locations around the geo point

####Definition


    GET /locations/nearby

####Arguments
* **here** geo location object with `lat` and `lng` properties
* **page** number of pages (page size=10)
* **max** max distance in miles


####Example Request
    curl http://localhost:3000/locations/nearby?here[lat]=37.587409&here[lng]=-122.338225

####Example Response

    [
      {
        "id": "88",
        "street": "390 Lang Road",
        "city": "Burlingame",
        "zipcode": 94010,
        "name": "Bay Area Firearms",
        "geo": {
          "lat": 37.5874391,
          "lng": -122.3381437
        }
      },
      {
        "id": "89",
        "street": "1850 El Camino Real",
        "city": "Menlo Park",
        "zipcode": 94027,
        "name": "Military Weaponry",
        "geo": {
          "lat": 37.459525,
          "lng": -122.194253
        }
      }
    ]

####Potential Errors
* None


###updateAttributes


Update attributes for a model instance and persist it into the data source

####Definition


    PUT /locations/{id}

####Arguments
* **data** An object containing property name/value pairs
* **id** The model id


####Example Request
    curl -X PUT -H "Content-Type:application/json" -d '{"name': "L2"}' http://localhost:3000/locations/88

####Example Response


####Potential Errors
* None


###getInventory


Follow the relations from location to inventory to get a list of items for a given location

####Definition


    GET /locations/{id}/inventory

####Arguments
* **where**
* **id**


####Example Request
    curl http://localhost:3000/locations/88/inventory

####Example Response

    [
      {
        "productId": "2",
        "locationId": "88",
        "available": 10,
        "total": 10
      },
      {
        "productId": "3",
        "locationId": "88",
        "available": 1,
        "total": 1
      }
    ]

####Potential Errors
* None




