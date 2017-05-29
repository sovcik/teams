const bcrypt = require('bcrypt');

var exports = module.exports = {};

exports.createPasswordHash = function (password, callback) {
    bcrypt.genSalt(1, function (err, salt) {
        if (err) return callback(err, null, null);
        bcrypt.hash(password, salt, function (err, hash) {
            if (err) return callback(err, salt, null);
            return callback(null, salt, hash);
        });
    });

};
