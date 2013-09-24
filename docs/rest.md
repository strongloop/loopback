## REST API

The REST API allows clients to interact with the LoopBack models using HTTP.
The clients can be a web browser, a JavaScript program, a mobile SDK, a curl
script, or anything that can act as an HTTP client.

LoopBack automatically binds a model to a list of HTTP endpoints that provide
REST APIs for model instance data manipulations (CRUD) and other remote
operations.

We'll use a simple model called `Location` (locations for rental) to illustrate
what REST APIs are exposed by LoopBack.

By default, the REST APIs are mounted to `/<pluralFormOfTheModelName>`, for
example, `/locations`, to the base URL such as http://localhost:3000/.

### CRUD remote methods

For a model backed by a data source that supports CRUD operations, you'll see
the following endpoints:

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

To expose a JavaScript method as REST API, we can simply describe the method as
follows:

    loopback.remoteMethod(
      Location.nearby,
      {
        description: 'Find nearby locations around the geo point',
        accepts: [
          {arg: 'here', type: 'GeoPoint', required: true, description: 'geo location (lat & lng)'},
          {arg: 'page', type: 'Number', description: 'number of pages (page size=10)'},
          {arg: 'max', type: 'Number', description: 'max distance in miles'}
        ],
        returns: {arg: 'locations', root: true},
        http: {verb: 'POST', path: '/nearby'}
      }
    );

The remoting is defined using the following properties:

- description: Description of the REST API
- accepts: An array of parameters, each parameter has a name, a type, and an
optional description
- returns: Description of the return value
- http: Binding to the HTTP endpoint, including the verb and path

### Request Format

For POST and PUT requests, the request body must be JSON, with the Content-Type
header set to application/json.

#### Encode the JSON object as query string

LoopBack uses the syntax from [node-querystring](https://github.com/visionmedia/node-querystring)
to encode JSON objects or arrays as query string. For example,

    user[name][first]=John&user[email]=callback@strongloop.com
    ==>
    { user: { name: { first: 'John' }, email: 'callback@strongloop.com' } }

    user[names][]=John&user[names][]=Mary&user[email]=callback@strongloop.com
    ==>
    { user: { names: ['John', 'Mary'], email: 'callback@strongloop.com' }}

    items=a&items=b
    ==> { items: ['a', 'b'] }

For more examples, please check out [node-querystring](https://github.com/visionmedia/node-querystring/blob/master/test/parse.js)


### Response Format

The response format for all requests is a JSON object or array if present. Some
responses have an empty body.

Whether a request succeeded is indicated by the HTTP status code. A 2xx status
code indicates success, whereas a 4xx status code indicates request related
issues. 5xx status code reports server side problems.

The response for an error is in the following format:

    {
    "error": {
        "message": "could not find a model with id 1",
        "stack": "Error: could not find a model with id 1\n ...",
        "statusCode": 404
        }
    }

###Generated APIs


###create

Create a new instance of the model and persist it into the data source

####Definition

    POST /locations

####Arguments
* **data** The model instance data


####Example Request
    curl -X POST -H "Content-Type:application/json" \
    -d '{"name": "L1", "street": "107 S B St", "city": "San Mateo", "zipcode": "94401"}' \
    http://localhost:3000/locations

####Example Response
    {
      "id": "96",
      "street": "107 S B St",
      "city": "San Mateo",
      "zipcode": 94401,
      "name": "L1",
      "geo": {
        "lat": 37.5670042,
        "lng": -122.3240212
      }
    }

####Potential Errors
* None


###upsert


Update an existing model instance or insert a new one into the data source

####Definition


    PUT /locations

####Arguments
* **data** The model instance data


####Example Request

#####Insert
    curl -X PUT -H "Content-Type:application/json" \
    -d '{"name": "L1", "street": "107 S B St", "city": "San Mateo", "zipcode": "94401"}' \
    http://localhost:3000/locations

#####Update
    curl -X PUT -H "Content-Type:applicatin/json" \
    -d '{"id": "98", "name": "L4", "street": "107 S B St", "city": "San Mateo", \
    "zipcode": "94401"}' http://localhost:3000/locations

####Example Response

#####Insert
    {
      "id": "98",
      "street": "107 S B St",
      "city": "San Mateo",
      "zipcode": 94401,
      "name": "L1",
      "geo": {
        "lat": 37.5670042,
        "lng": -122.3240212
      }
    }

#####Update
    {
      "id": "98",
      "street": "107 S B St",
      "city": "San Mateo",
      "zipcode": 94401,
      "name": "L4"
    }


####Potential Errors
* None


###exists


Check whether a model instance exists by id in the data source

####Definition


    GET /locations/exists

####Arguments
* **id** The model id


####Example Request
    curl http://localhost:3000/locations/88/exists

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

 - **where** `Object` { key: val, key2: {gt: 'val2'}} The search criteria
   - Format: {key: val} or {key: {op: val}}
   - Operations:
     - gt: >
     - gte: >=
     - lt: <
     - lte: <=
     - between
     - inq: IN
     - nin: NOT IN
     - neq: !=
     - like: LIKE
     - nlike: NOT LIKE

 - **include** `String`, `Object` or `Array` Allows you to load relations of several objects and optimize numbers of requests.
    - Format:
      - 'posts': Load posts
      - ['posts', 'passports']: Load posts and passports
      - {'owner': 'posts'}: Load owner and owner's posts
      - {'owner': ['posts', 'passports']}: Load owner, owner's posts, and owner's passports
      - {'owner': [{posts: 'images'}, 'passports']}: Load owner, owner's posts, owner's posts' images, and owner's passports

 - **order** `String` The sorting order
   - Format: 'key1 ASC, key2 DESC'

 - **limit** `Number` The maximum number of instances to be returned
 - **skip** `Number` Skip the number of instances
 - **offset** `Number` Alias for skip

 - **fields** `Object|Array|String` The included/excluded fields
  - `['foo']` or `'foo'` - include only the foo property
  - `['foo', 'bar']` - include the foo and bar properties
  - `{foo: true}` - include only foo
  - `{bat: false}` - include all properties, exclude bat

For example,

 - '/weapons': Weapons
 - '/weapons?filter[limit]=2&filter[offset]=5': Paginated Weapons
 - '/weapons?filter[where][name]=M1911': Weapons with name M1911
 - '/weapons?filter[where][audibleRange][lt]=10': Weapons with audioRange < 10
 - '/weapons?filter[fields][name]=1&filter[fields][effectiveRange]=1': Only name and effective ranges
 - '/weapons?filter[where][effectiveRange][gt]=900&filter[limit]=3': The top 3 weapons with a range over 900 meters
 - '/weapons?filter[order]=audibleRange%20DESC&filter[limit]=3': The loudest 3 weapons

 - '/locations': Locations
 - '/locations?filter[where][geo][near]=153.536,-28.1&filter[limit]=3': The 3 closest locations to a given geo point


####Example Request

#####Find without filter
    curl http://localhost:3000/locations

#####Find with a filter
    curl http://localhost:3000/locations?filter%5Blimit%5D=2

**Note**: For curl, `[` needs to be encoded as `%5B`, and `]` as `%5D`.

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
* **filter** The filter that defines where, order, fields, skip, and limit. It's
same as find's filter argument. Please see [find](#find) for more details.


####Example Request
    curl http://localhost:3000/locations/findOne?filter%5Bwhere%5D%5Bcity%5D=Scottsdale

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

#####Count without where
    curl http://localhost:3000/locations/count

#####Count with a where filter
    curl http://localhost:3000/locations/count?where%5bcity%5d=Burlingame

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
    curl http://localhost:3000/locations/nearby?here%5Blat%5D=37.587409&here%5Blng%5D=-122.338225

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
    curl -X PUT -H "Content-Type:application/json" -d '{"name": "L2"}' \
    http://localhost:3000/locations/88

####Example Response
    {
      "id": "88",
      "street": "390 Lang Road",
      "city": "Burlingame",
      "zipcode": 94010,
      "name": "L2",
      "geo": {
        "lat": 37.5874391,
        "lng": -122.3381437
      },
      "state": "CA"
    }

####Potential Errors
* 404 No instance found for the given id


###getAssociatedModel


Follow the relations from one model (`location`) to another one (`inventory`) to
get instances of the associated model.

####Definition


    GET /locations/{id}/inventory

####Arguments
* **id** The id for the location model


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




