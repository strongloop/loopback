#Model REST API

LoopBack automatically binds a model to a list of HTTP endpoints that provide REST APIs for CRUD and other remote
operations.

##General Considerations


##APIs

###create


Create a new model instance

####Definition


    POST /locations

####Arguments
* **data**


####Example Request
    curl -X POST -H "Content-Type:application/json" -d '' http://localhost:3000/locations

####Example Response
    undefined

####Potential Errors
* None


###upsert


Update or create a model instance

####Definition


    PUT /locations

####Arguments
* **data**


####Example Request
    curl -X PUT -H "Content-Type:application/json" -d '' http://localhost:3000/locations

####Example Response
    undefined

####Potential Errors
* None


###exists


Check the existence of a model instance by id

####Definition


    GET /locations/exists

####Arguments
* **id**


####Example Request
    curl http://localhost:3000/locations/exists/88

####Example Response

    {
        "exists": true
    }

####Potential Errors
* None


###findById


Retrieve a model instance by id

####Definition


    GET /locations/{id}

####Arguments
* **id**


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


Find all model instances matching the filter

####Definition


    GET /locations

####Arguments
* **filter**


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


Find one model instance matching the filter


####Definition


    GET /locations/findOne

####Arguments
* **filter**


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


Delete a model instance by id

####Definition


    DELETE /locations/{id}

####Arguments
* **id**


####Example Request
    curl -X DELETE http://localhost:3000/locations/88

####Example Response


####Potential Errors
* None


###count


Count the number of model instances matching the where criteria

####Definition


    GET /locations/count

####Arguments
* **where**


####Example Request
    curl http://localhost:3000/locations/count

####Example Response

    {
        count: 6
    }

####Potential Errors
* None


###nearby


Find nearby locations around a given geolocation

####Definition


    GET /locations/nearby

####Arguments
* **here**
* **page**
* **max** - max distance in miles


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


###update


Update a model instance by id

####Definition


    PUT /locations/{id}

####Arguments
* **data**
* **id**


####Example Request
    curl -X PUT -H "Content-Type:application/json" -d '' http://localhost:3000/locations/{id}

####Example Response
    undefined

####Potential Errors
* None


###reload


Reload a model instance by id

####Definition


    POST /locations/{id}/reload

####Arguments
* **id**


####Example Request
    curl -X POST -H "Content-Type:application/json" -d '' http://localhost:3000/locations/{id}/reload

####Example Response
    undefined

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




