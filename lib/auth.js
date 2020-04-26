const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const log = require('./logger');

const exp = (module.exports = {});

exp.passport = passport;
exp.flash = flash;
exp.LocalStrategy = LocalStrategy;

exp.connect2DB = function(UserModel, passport) {
    const User = UserModel;
    passport.use(
        new LocalStrategy(function(username, password, cb) {
            console.log('Authenticating: ' + username);
            User.findOne({
                $or: [{ username: username }, { email: username.toLowerCase() }],
                recordStatus: 'active'
            }).then(
                function(user) {
                    if (!user) {
                        log.WARN('LOGIN FAILED: user not found. user=' + username);
                        return cb(null, false);
                    }
                    console.log('Found user ' + user.username);
                    bcrypt.compare(password, user.passwordHash, function(err, isSame) {
                        if (err) return cb(err);
                        if (!isSame) {
                            log.WARN('LOGIN FAILED: wrong password. user=' + username);
                            return cb(null, false);
                        }
                        log.INFO('LOGIN OK: User=' + username);

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
        User.findOne(
            { _id: mongoose.Types.ObjectId(id), recordStatus: 'active' },
            { salt: 0, passwordHash: 0 },
            { lean: true }
        ).then(
            function(user) {
                if (!user) return console.log('Not Found user-id=' + id);
                user.id = '' + user._id;

                cb(null, user);
            },
            function(err) {
                return cb(err);
            }
        );
    });
};
