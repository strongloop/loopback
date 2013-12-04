##create

Create a new instance of the model and persist it into the data source

**Definition**

    POST /locations

**Arguments**

* **data** The model instance data


**Example**

Request:

    curl -X POST -H "Content-Type:application/json" \
    -d '{"name": "L1", "street": "107 S B St", "city": "San Mateo", "zipcode": "94401"}' \
    http://localhost:3000/locations

Response:

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

**Errors**

None

##upsert

Update an existing model instance or insert a new one into the data source

**Definition**

    PUT /locations

**Arguments**

* **data** The model instance data

**Examples**

Request - insert:

    curl -X PUT -H "Content-Type:application/json" \
    -d '{"name": "L1", "street": "107 S B St", "city": "San Mateo", "zipcode": "94401"}' \
    http://localhost:3000/locations

Response:

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
    
Request - update:

    curl -X PUT -H "Content-Type:applicatin/json" \
    -d '{"id": "98", "name": "L4", "street": "107 S B St", "city": "San Mateo", \
    "zipcode": "94401"}' http://localhost:3000/locations

Response:

    {
      "id": "98",
      "street": "107 S B St",
      "city": "San Mateo",
      "zipcode": 94401,
      "name": "L4"
    }


**Errors**

None

##exists

Check whether a model instance exists by ID in the data source.

**Definition**

    GET /locations/exists

**Arguments**

* **id** The model id

**Example**

Request:

    curl http://localhost:3000/locations/88/exists

Response:

    {
        "exists": true
    }

**Errors**

None

##findById

Find a model instance by ID from the data source.

**Definition**

    GET /locations/{id}

**Arguments**

* **id** The model id

**Example**

Request:

    curl http://localhost:3000/locations/88

Response:

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

**Errors**

None

##find

Find all instances of the model matched by filter from the data source.

**Definition**

    GET /locations

**Arguments**

Pass the arguments as the value of the `find` HTTP query parameter, as follows

    /modelName?filter=[filterType1]=<val1>&filter[filterType2]=<val2>...

where *filterType1*, *filterType2*, and so on, are the filter types, and *val1*, *val2* are the corresponding
values, as described in the following table.

| Filter type  | Type | Description |
| ------------- | ------------- | ---------------|
| where   | Object   | Search criteria. Format: `{key: val}` or `{key: {op: val}}`  For list of valid operations, see Operations, below. |
| include    | String, Object, or Array   | Allows you to load relations of several objects and optimize numbers of requests.  For format, see Include format, below. |
| order |  String | Sort order. Format: 'key1 ASC, key2 DESC', where ASC specifies ascending and DESC specifies descending order. |
|limit| Number | Maximum number of instances to return. |
|skip (offset) | Number | Skip the specified number of instances.  Use offset as alternative. |
|fields| Object, Array, or String |  The included/excluded fields.  For foramt, see fields below.

**Operations available in where filter**:

  * gt: >
  * gte: >=
  * lt: <
  * lte: <=
  * between
  * inq: IN
  * nin: NOT IN
  * neq: !=
  * like: LIKE
  * nlike: NOT LIKE

**Include format**:

  * 'posts': Load posts
  * ['posts', 'passports']: Load posts and passports
  * {'owner': 'posts'}: Load owner and owner's posts
  * {'owner': ['posts', 'passports']}: Load owner, owner's posts, and owner's passports
  * {'owner': [{posts: 'images'}, 'passports']}: Load owner, owner's posts, owner's posts' images, and owner's passports
  
**Fields format**:

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


**Example**

Request:

Find without filter:

    curl http://localhost:3000/locations

Find with a filter:

    curl http://localhost:3000/locations?filter%5Blimit%5D=2

**Note**: For curl, `[` needs to be encoded as `%5B`, and `]` as `%5D`.

Response:

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

**Errors**

None

##findOne

Find first instance of the model matched by filter from the data source.

**Definition**

    GET /locations/findOne

**Arguments**

* **filter** The filter that defines where, order, fields, skip, and limit. It's
same as find's filter argument. Please see [find](#find) for more details.

**Example**

Request:

    curl http://localhost:3000/locations/findOne?filter%5Bwhere%5D%5Bcity%5D=Scottsdale

Response:

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

**Errors**

None

##deleteById

Delete a model instance by id from the data source

**Definition**

    DELETE /locations/{id}

**Arguments**

* **id** The model id

**Example**

Request:

    curl -X DELETE http://localhost:3000/locations/88

Response:

Example TBD.

**Errors**

None

##count

Count instances of the model matched by where from the data source

**Definition**

    GET /locations/count

**Arguments**

* **where** The criteria to match model instances

**Example**

Request - count without "where" filter

    curl http://localhost:3000/locations/count

Request - count with a "where" filter

    curl http://localhost:3000/locations/count?where%5bcity%5d=Burlingame

Response:

    {
        count: 6
    }

**Errors**

None

##nearby

Find nearby locations around the geo point.

**Definition**

    GET /locations/nearby

**Arguments**

* **here** geo location object with `lat` and `lng` properties
* **page** number of pages (page size=10)
* **max** max distance in miles

**Example**

Request:

    curl http://localhost:3000/locations/nearby?here%5Blat%5D=37.587409&here%5Blng%5D=-122.338225

Response:

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

**Errors**

None

##updateAttributes

Update attributes for a model instance and persist it into the data source

**Definition**

    PUT /locations/{id}

**Arguments**

* **data** An object containing property name/value pairs
* **id** The model id

**Example**

Request:

    curl -X PUT -H "Content-Type:application/json" -d '{"name": "L2"}' \
    http://localhost:3000/locations/88

Response:

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

**Errors**

* 404 No instance found for the given id

##getAssociatedModel

Follow the relations from one model (`location`) to another one (`inventory`) to
get instances of the associated model.

**Definition**

    GET /locations/{id}/inventory

**Arguments**

* **id** The id for the location model

**Example**

Request:

    curl http://localhost:3000/locations/88/inventory

Response:

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

**Errors**

None
