/*
    User entity - used for storing user profile and for user authentication
 */
const mongoose = require('mongoose');
const statusPlugin = require('./plugins/status-plugin');
const Schema = mongoose.Schema;
mongoose.Promise = require('bluebird');
const util = require('../lib/util');

const UserSchema = new Schema({
    username: { type: String },
    fullName: { type:String, required:true },
    email: { type: String },
    dateOfBirth: {type:Date },
    passwordHash: { type: String, default:'' },
    salt: { type: String, default: '' },
    isAdmin: {type: Boolean, default: false},
    isSuperAdmin: {type: Boolean, default: false},
    locales: {type: String, default: 'en-GB'}
});

// helper function handling hash creation
UserSchema.statics.addNew = function (username, email, password, callback) {
    util.createPasswordHash(password, function(err, salt, hash){
        if (err) return callback(err, this);
        mongoose.models.User.create({
            username:username,
            email:email,
            salt:salt,
            passwordHash:hash,
            fullName:username
        }, function (err,usr){
            if (err) return callback(err, usr);
            return callback(null, usr);
        });

    });

};

UserSchema.plugin(statusPlugin);

// if there is no model in mongoose yet, let's create one
// this has to be the last statement of this module
if (!mongoose.models.User) {
    mongoose.model('User', UserSchema);
}

module.exports = UserSchema;
