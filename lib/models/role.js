// Role model
var RoleSchema = {
    id: {type: String, required: true}, // Id
    name: {type: String, required: true}, // The name of a role
    description: String, // Description
    roles: [String], // A role can be an aggregate of other roles
    users: [String], // A role contains a list of user ids

    // Timestamps
    created: {type: Date, default: Date},
    modified: {type: Date, default: Date}
}

module.exports = function(dataSource) {
    dataSource = dataSource || new require('loopback-datasource-juggler').ModelBuilder();
    var Role = dataSource.define('Role', RoleSchema);
    return Role;
}