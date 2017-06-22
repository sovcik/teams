const mongoose = require('mongoose');
const Promise = mongoose.Promise = require('bluebird');
const bcrypt = require('bcrypt');
const eachAsync = require('each-async');
const db = require('./common');

const User = mongoose.models.User;
const Team = mongoose.models.Team;
const TeamUser = mongoose.models.TeamUser;
const Program = mongoose.models.Program;
const Event = mongoose.models.Event;
const Env = mongoose.models.Env;

const dbUser = require('./User');
const dbTeam = require('./Team');

const exp = {};

module.exports = exp;

exp.testSeed = function() {
    return new Promise(async function (fulfill, reject) {
        try {
            await createAdmin('admin', 'admin');
            if (process.env.ENV != 'dev') {
                console.log("Not DEV environment - skipping seed");
                return;

            }
            const data = {};
            await db.deleteAll();
            await createAdmin('admin', 'admin');
            await exp.testSeedEnv(data);
            await exp.testSeedUsers(data);
            await exp.testSeedPrograms(data);
            await exp.testSeedEvents(data);
            await exp.testSeedTeams(data);
            await exp.testSeedTeamsCoaches(data);
            await exp.testSeedMembers(data);
            console.log('==== TESTING');
            let myId = '00000000010000000002000' + '0';
            let teamId = '00000000010000000002000' + '0';
            let coachId = '00000000010000000002000' + '1';

            console.log("===== TEAM DETAILS START");
            let t = await dbTeam.getTeamDetails(myId, teamId);
            console.log("===== TEAM DETAILS RESULT");
            console.log(t);

            console.log("===== TEAM COACHES START");
            let tc = await dbTeam.getTeamCoaches(myId, teamId);
            console.log("===== TEAM COACHES RESULT");
            console.log(tc);

            console.log("===== TEAM MEMBERS START");
            let tm = await dbTeam.getTeamMembers(myId, teamId);
            console.log("===== TEAM MEMBERS RESULT");
            console.log(tm);
            return fulfill(true);
        } catch (err) {
            return reject(err);
        }

    })


};

function createAdmin(login, password){
    return new Promise(async function (fulfill, reject) {
        console.log("Creating admin user");
        try {
            var u = await User.findOneActive({username: login});
            if (!u) {
                const s = await bcrypt.genSalt(1);
                const h = await bcrypt.hash(password, s);
                u = await User.create(
                    {
                        username: 'admin',
                        passwordHash: h,
                        salt: s,
                        fullName: 'System admin',
                        role: 'A'
                    });
                console.log("Admin user created");
            } else {
                console.log("Admin user already exists")
            }
            return fulfill(u);
        } catch(err) {
            return reject(err);
        }
    })
}

exp.testSeedEnv = function(data){
    return new Promise(function (fulfill, reject) {
        if (!data) data = {};
        console.log("Seeding env");
        try {
            const e = new Env();

            e.save();
            return fulfill(true);
        } catch (err) {
            return reject(err);
        }
    });

};

exp.testSeedTeams = function(data){
    return new Promise(function (fulfill, reject) {
        if (!data) data = {};
        data.teams = [];
        console.log("Seeding teams");
        eachAsync(
            [
                Team.testData({},'1'),
                Team.testData({},'2'),
                Team.testData({},'3'),
                Team.testData({},'4'),
                Team.testData({},'5')
            ],
            async function (item, index, done) {
                try {
                    const p = await Program.findOneActive();
                    const team = await Team.create(Object.assign(item, {_id:'00000000010000000002000'+index, programId:p._id}));
                    console.log("Team created: " + team.name + "===" + team.id);
                    data.teams.push({id: team.id, name: team.name});
                    return done();
                } catch (err) {
                    reject(err);
                }
            },
            function (err) {
                if (err) reject(err);
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
                        _id:'00000000010000000002000'+index,
                        username: item[0],
                        passwordHash: h,
                        salt:s,
                        fullName: 'Full '+item[0],
                        email: item[0]+'@email'
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

exp.testSeedTeamsCoaches = async function(data) {
    return new Promise(function (fulfill, reject) {
        if (!data) data = {};
        console.log("Assigning coaches");
        eachAsync(
            data.teams,
            async function (item, index, done) {
                const ut = await TeamUser.create(
                    {
                        teamId: item.id,
                        userId: data.users[index%data.users.length].id,
                        role: 'coach'
                    }
                );
                console.log("Coach for team",item.name,' is ',data.users[index%data.users.length].username);
                return done();
            },
            function (err){
                if (err) reject(err);
                console.log("Finished coaches")
                fulfill(data)
            }
        )

    });
};

exp.testSeedMembers = async function(data){
    return new Promise(
        function (fulfill, reject) {
            console.log('Seeding members');
            if (!data) data = {};
            eachAsync(
                data.teams,
                async function (item, index, done) {
                    for (u of [1, 2, 3, 4, 5, 6]) {
                        let uId = '2'+index+'000000010000000002000' + u;
                        let uName = 'user' + u + '-' + item.name;
                        const user = await User.create(
                            {
                                _id: uId,
                                fullName: 'Full '+uName
                            });
                        await TeamUser.create(
                            {
                                userId: uId,
                                teamId: item.id,
                                role: 'member'
                            }
                        );
                        console.log('Member ', uName, ' team ', item.name);

                    }

                    console.log("Members assigned to team: ", item.name);
                    return done();
                },
                function (err) {
                    if (err) reject(err);
                    console.log("Finished assigning team members");
                    fulfill(data);
                }
            )

        }
    )
};

exp.testSeedPrograms = function(data){
    return new Promise(
        async function (fulfill, reject) {
            console.log('Seeding programs');
            if (!data) data = {};
            data.programs = [];
            console.log(data);
            eachAsync(
                [
                    {name:'FLL 2017/2018 Slovensko', user:'user1'}
                ],
                async function (item, index, done) {
                    const u = await User.findOneActive({username:item.user});
                    const prog = await Program.create(
                        {
                            name: item.name
                        }
                    );
                    console.log('Program', prog.name, ' id ', prog._id);
                    item.id = prog.id;
                    data.programs.push({id: prog.id, name: prog.name});
                    return done();
                },
                function (err) {
                    if (err) reject(err);
                    console.log("Finished creating programs");
                    fulfill(data);
                }
            )

        }
    )
};

exp.testSeedEvents = function(data){
    return new Promise(
        async function (fulfill, reject) {
            console.log('Seeding program events');
            if (!data.programs) data.programs = [
                {name:'FLL 2017/2018 Slovensko', user:'user1'}
            ];
            console.log(data);
            data.events = [];
            eachAsync(
                data.programs,
                async function (item, index, done) {

                    const e = await Event.create({
                        name: "Event "+index+" "+item.name,
                        startDate: Date.now(),
                        programId: item.id
                    });
                    console.log('Event', e.name, ' id ', e.id);
                    data.events.push({id: e.id, name: e.name});
                    return done();
                },
                function (err) {
                    if (err) reject(err);
                    console.log("Finished creating events");
                    fulfill(data);
                }
            )

        }
    )
};
