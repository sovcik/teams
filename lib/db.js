const mongoose = require('mongoose');
const Promise = mongoose.Promise = require('bluebird');
const bcrypt = require('bcrypt');
const eachAsync = require('each-async');
const co = require('co');

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

exp.testSeed = async function() {
    const data = {};
    await exp.deleteAll();
    await exp.testSeedTeams(data);
    await exp.testSeedUsers(data);

};

exp.testSeedTeams = function(data){
    return new Promise(function (fulfill, reject) {
        if (!data) data = {};
        data.teams = [];
        console.log("Seeding teams");
        eachAsync(
            ['team1', 'team2', 'team3', 'team4', 'team5'],
            function (item, index, done) {
                Team.create({name: item}, function (err, team) {
                    if (err) {
                        console.log("Failed creating team: " + team.name);
                        return reject(err);
                    }
                    console.log("Team created: " + team.name + "===" + team.id);
                    data.teams.push({id: team.id, name: team.name});
                    return done();
                });
            },
            function (err) {
                console.log("Finished teams");
                fulfill(data);
            })
    });

};

exp.testSeedUsers = async function(data){
    return new Promise(function (fulfill, reject){
        if (!data) data = {};
        data.users = [];
        eachAsync(
            [
                ['user1','pwd1'],
                ['user2','pwd2'],
                ['user3','pwd3'],
                ['user4','pwd4'],
                ['user5','pwd5']
            ],
            async function (item, index, done) {
                const s = await bcrypt.genSalt(1);
                const h = await bcrypt.hash(item[1],s);
                const user = await User.create(
                    {
                        username: item[0],
                        passwordHash: h,
                        salt:s,
                        fullName: item[0],
                        email: item[0]
                    });
                console.log("User created: " + user.username + "===" + user.id);
                data.users.push({id: user.id, username: user.username});
                return done();
            },
            function (err) {
                if (err) reject(err);
                console.log("Finished users");
                fulfill(data);
            })

    })
};

exp.testSeedUserTeams = async function(){
    const UserTeam = mongoose.models.UserTeam;
    UserTeam.count(function(err, count){
        if (err) {
            console.log("Failed getting user-team count: "+err.message);
            return;
        }
        if (count == 0){
            console.log("Seeding user-teams");
            for (i = 0; i<5;i++) {
                Team.create({name:'team'+i}, function(err, team){
                    if (err) {
                        console.log("Failed creating team: "+team.name);
                        return;
                    }
                    console.log("Team created: "+team.name);

                });

            }

        } else {
            console.log("Seeding teams not needed. Found "+count+" records");
        }
    })

};

