// Role model
var RoleSchema = {
    id: {type: String, required: true},
    name: {type: String, required: true},
    roles: [String],
    users: [String],
    acl: [],

    created: Date,
    lastUpdated: Date
}