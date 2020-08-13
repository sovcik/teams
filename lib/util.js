/* eslint-disable no-unused-vars */
/* eslint-disable no-async-promise-executor */

const bcrypt = require('bcryptjs');

const exp = (module.exports = {});

exp.createPasswordHash = function(password) {
    return bcrypt
        .genSalt(1)
        .then(function(salt) {
            return bcrypt.hash(password, salt);
        })
        .reject(null);
};
