/*
    Collection storing temporary users waiting for email verification
    Documents from this entity will be automatically removed after 24 hours.
 */
module.exports = function (connection) {
    const mongoose = require('mongoose');
    const Schema = mongoose.Schema;
    mongoose.Promise = require('bluebird');

    const UserVerifySchema = new Schema({
        updatedOn: { type: Date, required: true },
        username: { type: String, required: true },
        passwordHash: { type: String, required: true },
        salt: { type: String, required: true }
    });

    // create TTL index
    UserVerifySchema.index({ "updatedOn": 1 }, { expireAfterSeconds: 24*3600 });

    UserVerifySchema.pre('save', function (next) {
        this.updatedOn = new Date();
        next();
    });
    return connection.model('UserVerify', UserVerifySchema);
};