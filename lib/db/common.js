const mongoose = require('mongoose');
const Promise = mongoose.Promise = require('bluebird');
const eachAsync = require('each-async');

const exp = module.exports = {};

const url = exp.url = "mongodb://"+process.env.DB_USER+":"+process.env.DB_PWD+"@"+process.env.DB_SERVER+"/"+process.env.DB_DATABASE;

console.log("Connecting to "+process.env.DB_SERVER+"/"+process.env.DB_DATABASE);
mongoose.connection.on('error', console.error.bind(console, 'connection error:'));

mongoose.connection.once('open', function() {
    console.log("Connected successfully to database @"+process.env.DB_SERVER+"/"+process.env.DB_DATABASE);
});
mongoose.connect(url);

exp.conn = mongoose.connection;

const User = mongoose.models.User;
const Team = mongoose.models.Team;
const UserTeam = mongoose.models.UserTeam;

exp.deleteAll = async function(){
    return new Promise(function (fulfill, reject){
        eachAsync([
                [UserTeam,'UserTeam'],
                [Team,'Team'],
                [User,'User']
            ],
            function (item, index, done) {
                console.log("Removing "+item[1]);
                item[0].remove({}, function(err){
                    if (err) reject(err);
                    done();
                });
            },
            fulfill
        );

    })

};



