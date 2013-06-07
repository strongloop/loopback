 - app.model(Model)
 - app.models()
 - 
 - Model.validatesPresenceOf(properties...)
 - Model.validatesLengthOf(property, options)
 - Model.validatesInclusionOf(property, options)
 - Model.validatesExclusionOf(property, options)
 - Model.validatesNumericalityOf(property, options)
 - Model.validatesUniquenessOf(property, options)
 - myModel.isValid()
 - Model.attachTo(dataSource)

##### Model.create([data], [callback])
##### model.save([options], [callback])
##### model.updateAttributes(data, [callback])
##### model.upsert(data, callback)
##### model.destroy([callback])
##### Model.destroyAll(callback)
##### Model.find(id, callback)
##### Model.count([query], callback)
#### Static Methods
#### Instance Methods
#### Remote Methods
##### asteroid.remoteMethod(Model, fn, [options]);
#### Hooks
#### Remote Hooks
#### Context
##### ctx.me
##### Rest
###### ctx.req
###### ctx.res
#### Relationships
##### Model.hasMany(Model)
##### Model.hasAndBelongsToMany()
#### Model.availableHooks()
#### Shared Methods
#### Model.availableMethods()
### Data Source
#### dataSource.createModel(name, options, settings)
#### dataSource.discover(options, fn)
#### dataSource.discoverSync(options)
#### dataSource.discoverModels(options, fn)
#### dataSource.discoverModelsSync(options)
#### dataSource.enable(operation)
#### dataSource.disable(operation)
#### dataSource.operations()
#### Connectors
### GeoPoint
#### geoPoint.distanceTo(geoPoint, options)
#### GeoPoint.distanceBetween(a, b, options)
#### Distance Types
#### geoPoint.lat
#### geoPoint.long
### Asteroid Types
### REST Router
### SocketIO Middleware **Not Available**