"use strict";

const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const TempUserSchema = new mongoose.Schema({
    username: { type: String },
    email: { type: String},
    salt: { type: String},
    passwordHash: { type: String}
});

const OneTimeSchema = new mongoose.Schema({
    updatedOn: { type: Date, default: Date.now() },
    type: { type: String, required: true }, // rstpwd = password reset
    active: {type: Boolean, default: true},
    user: TempUserSchema
});

// create TTL index
OneTimeSchema.index({ "updatedOn": 1 }, { expireAfterSeconds: 24*3600 });

// method to be called before save
OneTimeSchema.pre('save', function (next) {
    this.updatedOn = Date.now(); // set updatedOn to the current date so TTL index can work properly
    next();
});

// helper method for creating new user - handling hash creation
TempUserSchema.statics.addNew = function (username, email, password, callback) {
    util.createPasswordHash(password, function(err, salt, hash){
        if (err) return callback(err, this);
        mongoose.models.UserVerify.create({
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

// if there is no model in mongoose yet, let's create one
// this has to be the last statement of this module
if (!mongoose.models.OneTime) {
    mongoose.model('OneTime', OneTimeSchema);
}

module.exports = OneTimeSchema;