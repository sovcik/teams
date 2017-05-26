/*
    User entity - used for storing user profile and for user authentication
 */
module.exports = function (connection) {
    const mongoose = require('mongoose');
    const statusPlugin = require('./plugins/status-plugin');
    const Schema = mongoose.Schema;
    mongoose.Promise = require('bluebird');

    const UserSchema = new Schema({
        username: { type: String, required: true },
        passwordHash: { type: String, required: true },
        salt: { type: String, default: '' }
    });

    /*
    UserSchema.pre('save', function (next) {
        // TODO: add validations before saving

        next();
    });
    */

    UserSchema.plugin(statusPlugin);

    return connection.model('User', UserSchema);
};