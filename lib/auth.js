/* eslint-disable no-unused-vars */
/* eslint-disable no-async-promise-executor */

const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const User = mongoose.models.User;

const debugLib = require('debug')('lib-auth');
const logERR = require('debug')('ERROR:lib-auth');
const logWARN = require('debug')('WARN:lib-auth');
const logINFO = require('debug')('INFO:lib-auth');

const exp = (module.exports = {});

exp.passport = passport;
exp.flash = flash;
exp.LocalStrategy = LocalStrategy;

function authUserInDB(username, password, cb) {
    const debug = debugLib.extend('checkInDB');
    debug('Authenticating: %s', username);
    User.findOne({
        $or: [{ username: username }, { email: username.toLowerCase() }],
        recordStatus: 'active',
    }).then(
        function (user) {
            if (!user) {
                debug('LOGIN FAILED: user not found. user=%s', username);
                return cb(null, false);
            }
            debug('Found user %s', user.username);
            bcrypt.compare(password, user.passwordHash, function (err, isSame) {
                if (err) return cb(err);
                if (!isSame) {
                    logWARN('LOGIN FAILED: wrong password. user=%s', username);
                    return cb(null, false);
                }
                logINFO('LOGIN OK: User=%s', username);

                if (user.isSuperAdmin) user.isAdmin = true;

                return cb(null, user);
            });
        },
        function (err) {
            return cb(err);
        }
    );
}

function deserializeFromDB(id, cb) {
    const debug = debugLib.extend('deserializeUser');
    User.findOne(
        { _id: mongoose.Types.ObjectId(id), recordStatus: 'active' },
        { username: 1, fullName: 1, email: 1, locales: 1, isAdmin: 1, isSuperAdmin: 1 },
        { lean: true }
    ).then(
        function (user) {
            if (!user) return debug('Not Found user-id=' + id);
            user.id = '' + user._id;

            cb(null, user);
        },
        function (err) {
            return cb(err);
        }
    );
}

exp.connect2DB = function () {
    const debug = debugLib.extend('connect2DB');
    passport.use(new LocalStrategy(authUserInDB));
    passport.serializeUser((user, cb) => cb(null, user.id));
    passport.deserializeUser(deserializeFromDB);
};
