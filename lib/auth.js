/* eslint-disable no-unused-vars */
/* eslint-disable no-async-promise-executor */

const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const debugLib = require('debug')('lib-auth');
const logERR = require('debug')('ERROR:lib-auth');
const logWARN = require('debug')('WARN:lib-auth');
const logINFO = require('debug')('INFO:lib-auth');

const exp = (module.exports = {});

exp.passport = passport;
exp.flash = flash;
exp.LocalStrategy = LocalStrategy;

exp.connect2DB = function(UserModel, passport) {
    const User = UserModel;
    const debug = debugLib.extend('connect2DB');
    passport.use(
        new LocalStrategy(function(username, password, cb) {
            debug('Authenticating: %s', username);
            User.findOne({
                $or: [{ username: username }, { email: username.toLowerCase() }],
                recordStatus: 'active'
            }).then(
                function(user) {
                    if (!user) {
                        debug('LOGIN FAILED: user not found. user=%s', username);
                        return cb(null, false);
                    }
                    debug('Found user %s', user.username);
                    bcrypt.compare(password, user.passwordHash, function(err, isSame) {
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
                function(err) {
                    return cb(err);
                }
            );
        })
    );

    passport.serializeUser(function(user, cb) {
        cb(null, user.id);
    });

    passport.deserializeUser(function(id, cb) {
        const debug = debugLib.extend('deserializeUser');
        User.findOne(
            { _id: mongoose.Types.ObjectId(id), recordStatus: 'active' },
            { salt: 0, passwordHash: 0 },
            { lean: true }
        ).then(
            function(user) {
                if (!user) return debug('Not Found user-id=' + id);
                user.id = '' + user._id;

                cb(null, user);
            },
            function(err) {
                return cb(err);
            }
        );
    });
};
