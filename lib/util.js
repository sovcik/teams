const bcrypt = require('bcrypt');

const exp = module.exports = {};

exp.createPasswordHash = function (password) {
    return bcrypt.genSalt(1)
        .then(
            function (salt){ return bcrypt.hash(password, salt); }
        )
        .reject(
            null
        )

};
