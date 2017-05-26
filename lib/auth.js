const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

var exports = module.exports = {};

exports.passport = passport;
exports.flash = flash;
exports.LocalStrategy = LocalStrategy;

exports.connect2DB = function(UserModel, passport){
    const User = UserModel;
    passport.use(new LocalStrategy(
        function(username, password, cb) {
            console.log("Authenticating: "+username);
            User.findOneActive({ username: username}).then(
                function(user) {
                    if (!user) {
                        console.log("User '"+username+"' not found");
                        return cb(null, false);
                    }
                    console.log('Found user '+user.username);
                    bcrypt.compare(password, user.passwordHash, function(err, isSame) {
                            if (err) return cb(err);
                            if (!isSame) {
                                console.log("User '"+username+"' specified wrong password '"+password+"'");
                                return cb(null, false);
                            }
                            console.log("User '"+username+"' LOGGED IN");
                            return cb(null, user);
                        });
                },
                function (err) { return cb(err); });
        }
    ));

    passport.serializeUser(function(user, cb) {
        cb(null, user.id);
    });

    passport.deserializeUser(function(id, cb) {
        User.findOneActive({_id:id+''}).then(
            function (user) {
                if (!user) console.log("Not Found user-id="+id);
                cb(null, user);
            },
            function(err){ return cb(err); });
    });

};