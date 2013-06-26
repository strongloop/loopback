// User model
var UserSchema = {
    id: {type: String, required: true},
    username: {type: String, required: true},
    password: String,
    authData: [],
    email: String,
    emailVerified: Boolean,
    created: Date,
    lastUpdated: Date
}