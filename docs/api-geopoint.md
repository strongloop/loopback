## GeoPoint object

The GeoPoint object represents a physical location.

Use the `GeoPoint` class.

```js
var GeoPoint = require('loopback').GeoPoint;
```

Embed a latitude / longitude point in a [Model](#model).

```js
var CoffeeShop = loopback.createModel('coffee-shop', {
  location: 'GeoPoint'
});
```

You can query LoopBack models with a GeoPoint property and an attached data source using geo-spatial filters and sorting. For example, the following code finds the three nearest coffee shops.

```js
CoffeeShop.attachTo(oracle);
var here = new GeoPoint({lat: 10.32424, lng: 5.84978});
CoffeeShop.find({where: {location: {near: here}}, limit:3}, function(err, nearbyShops) {
  console.info(nearbyShops); // [CoffeeShop, ...]
});
```

### Distance Types

**Note:** all distance methods use `miles` by default.

 - `miles`
 - `radians`
 - `kilometers`
 - `meters`
 - `miles`
 - `feet`
 - `degrees`

### Methods

#### geoPoint.distanceTo(geoPoint, options)

Get the distance to another `GeoPoint`; for example:

```js
var here = new GeoPoint({lat: 10, lng: 10});
var there = new GeoPoint({lat: 5, lng: 5});
console.log(here.distanceTo(there, {type: 'miles'})); // 438
```
 
#### GeoPoint.distanceBetween(a, b, options)

Get the distance between two points; for example:

```js
GeoPoint.distanceBetween(here, there, {type: 'miles'}) // 438
```

### Properties 

#### geoPoint.lat

The latitude point in degrees. Range: -90 to 90.

#### geoPoint.lng

The longitude point in degrees. Range: -180 to 180.
