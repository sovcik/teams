const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
mongoose.Promise = require('bluebird');

var exports = module.exports = {};

var url = exports.url = "mongodb://"+process.env.DB_USER+":"+process.env.DB_PWD+"@"+process.env.DB_SERVER+"/"+process.env.DB_DATABASE;

console.log("Connecting to "+process.env.DB_SERVER+"/"+process.env.DB_DATABASE);
mongoose.connection.on('error', console.error.bind(console, 'connection error:'));

mongoose.connection.once('open', function() {
    console.log("Connected successfully to database @"+process.env.DB_SERVER+"/"+process.env.DB_DATABASE);
});
mongoose.connect(url);

exports.conn = mongoose.connection;

exports.testSeed = function(conn){
    var User = conn.model('User');
    User.count(function(err, count){
        if (err) {
            console.log("Failed getting user count: "+err.message);
            return;
        }
        if (count == 0){
            console.log("Seeding users");
            for (i = 0; i<5;i++) {
                User.addNew('user'+i, 'email'+i, 'pwd'+i, function(err, usr){
                    if (err) {
                        console.log("Failed creating user: "+usr.username);
                        return;
                    }
                    console.log("User created: "+usr.username);

                });

              }

            } else {
              console.log("Seeding users not needed. Found "+count+" records");
            }
        })

};

