// Role model
var RoleSchema = {
    id: {type: String, required: true},
    name: {type: String, required: true},
    roles: [String], // A role can be an aggregate of other roles
    users: [String], // A role contains a list of users
    acls: [],

    created: Date,
    lastUpdated: Date
}