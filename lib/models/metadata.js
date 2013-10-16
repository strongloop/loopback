module.exports = function (app) {
    var ModelSchema = {
        name: {type: String, required: true, id: true},
        properties: Object,
        settings: Object
    };

    var DataSourceSchema = {
        name: {type: String, required: true, id: true},
        connector: {type: String, default: 'memory'}
    };

    var loopback = require('../loopback');

    var ds = loopback.createDataSource({connector: loopback.Memory});

    var ModelMetaData = ds.createModel('ModelMetaData', ModelSchema, {strict: false, plural: 'metadata/models'});

    ModelMetaData.prototype.build = function() {
        if(this.modelClass) {
            return this.modelClass;
        }
        this.modelClass = loopback.createModel(this.name, this.properties, this.settings);
    };

    ModelMetaData.prototype.automigrate = function (callback) {
        this.build();
        this.dataSource.automigrate(this.name, callback);
    };

    ModelMetaData.prototype.autoupdate = function (callback) {
        this.build();
        this.dataSource.autoupdate(this.name, callback);
    };

    ModelMetaData.prototype.attachTo = function (dataSourceName, callback) {
        this.build();
        var self = this;
        DataSourceMetaData.findById(dataSourceName, function (err, dataSource) {
            if (err) {
                callback && callback(err);
            } else {
                self.modelClass.attachTo(dataSource);
                callback && callback(err, dataSource);
            }
        });
    };

    ModelMetaData.prototype.expose = function (callback) {
        this.build();
        app.model(this.modelClass);
    };

    ModelMetaData.introspect = function (name, object, callback) {
        var model = ModelMetaData.dataSource.buildModelFromInstance(name, object, {});
        ModelMetaData.create(model.toJSON(), callback);
    };

    loopback.remoteMethod(
        ModelMetaData.introspect,
        {
            accepts: [
                {arg: 'name', type: 'string', required: true, source: 'query'},
                {arg: 'data', type: 'object', required: true, source: 'body'}
            ],
            http: {verb: 'post', path: '/introspect'}
        }
    );


    var DataSourceMetaData = ds.createModel('DataSourceMetaData', DataSourceSchema, {strict: false, plural: 'metadata/data-sources'});

    app.model(ModelMetaData);
    app.model(DataSourceMetaData);
};

