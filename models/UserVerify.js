/*
    Collection storing temporary users waiting for email verification
    Documents from this entity will be automatically removed after 24 hours.
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.Promise = require('bluebird');

const UserVerifySchema = new Schema({
    updatedOn: { type: Date, required: true },
    username: { type: String, required: true },
    passwordHash: { type: String, required: true },
    email: { type: String, required: true },
    salt: { type: String, required: true }
});

// create TTL index
UserVerifySchema.index({ "updatedOn": 1 }, { expireAfterSeconds: 24*3600 });

// method to be called before save
UserVerifySchema.pre('save', function (next) {
    this.updatedOn = new Date(); // set updatedOn to the current date so TTL index can work properly
    next();
});

// helper method for creating new user - handling hash creation
UserVerifySchema.statics.addNew = function (username, email, password, callback) {
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
if (!mongoose.models.UserVerify) {
    mongoose.model('UserVerify', UserVerifySchema);
}