const mongoose = require('mongoose');
const Promise = mongoose.Promise = require('bluebird');
const eachAsync = require('each-async');

const db = require('./common');

const exp = {};

module.exports = exp;

const User = mongoose.models.User;
const UserTeam = mongoose.models.UserTeam;
const Team = mongoose.models.Team;

exp.getTeamDetails = function(myId, teamId) {
    return new Promise(async function (fulfill, reject) {
        console.log("GET-TEAM-DETAILS");
        try {
            const p = await exp.teamPermissions(myId, teamId);
            const t = await Team.findOneActive({_id: teamId});
            if (!t) {
                console.log('Team not found id=',teamId);
                return reject(null);
            }
            console.log("Found team: ", t.name, t.id);
            fulfill(t);

        } catch (err) {
            console.log('Error getting teamDetails');
            console.log(err);
            reject(err);
        }

    });
};

exp.getTeamCoaches = function(myId, teamId) {
    return new Promise(async function (fulfill, reject) {
        console.log("GET-TEAM-COACHES");
        const coaches = [];
        try {
            const p = await exp.teamPermissions(myId, teamId);
            const t = await Team.findOneActive({_id: teamId});
            if (!t) {
                console.log('Team not found id=',teamId);
                return reject(null);
            }
            console.log("Found team: ", t.name, t.id);
            let tc = [];
            if (p != 'R1')
                tc = await UserTeam.findActive({teamId: teamId, role:'coach'});
            console.log('TEAM coaches',tc);
            //let us = await* [233,2342,234,432,423].map(id=>User.findById(id));

            eachAsync(
                tc,
                async function(item, index, done) {
                    console.log("Searching coach ",item.userId);
                    let u = await User.findOneActive({_id: item.userId});
                    let ud = {};
                    switch (p) {
                        case 'A':
                        case 'W':
                        case 'R':
                            if (u.dateOfBirth) ud.dateOfBirth = u.dateOfBirth;
                        case 'R2':
                            ud.fullName = u.fullName;
                            ud.id = u.id;
                            break;
                    }
                    coaches.push(ud);
                    done();
                },
                function(err) {
                    if (err) reject(err);
                    console.log("Coaches loaded");
                    fulfill(coaches);
                }
            )

        } catch (err) {
            console.log('Error getting team coaches');
            console.log(err);
            reject(err);
        }

    });
};

exp.getTeamMembers = function(myId, teamId) {
    return new Promise(async function (fulfill, reject) {
        console.log("GET-TEAM-MEMBERS");
        members = [];
        try {
            const p = await exp.teamPermissions(myId, teamId);
            const t = await Team.findOneActive({_id: teamId});
            if (!t) {
                console.log('Team not found id=',teamId);
                return reject(null);
            }
            console.log("Found team: ", t.name, t.id);
            let tm = [];
            if (p != 'R1')
                tm = await UserTeam.findActive({teamId: teamId, role:'member'});
            console.log('Found members',tm.length);
            eachAsync(
                tm,
                async function(item, index, done) {
                    console.log("Processing member ",item.userId);
                    let u = await User.findOneActive({_id: item.userId});
                    let ud = {};
                    switch (p) {
                        case 'A':
                        case 'W':
                        case 'R':
                            if (u.dateOfBirth) ud.dateOfBirth = u.dateOfBirth;
                            if (u.email) ud.email = u.email;
                        case 'R2':
                            ud.fullName = u.fullName;
                            ud.id = u.id;
                            break;
                    }
                    members.push(ud);
                    console.log("Adding member",ud.fullName, ud.dateOfBirth);
                    done();
                },
                function(err) {
                    if (err) reject(err);
                    console.log("Members loaded");
                    fulfill(members);
                }
            )

        } catch (err) {
            console.log('Error getting team members');
            console.log(err);
            reject(err);
        }

    });
};


exp.teamPermissions = async function(myId, teamId) {
    return (new Promise(async function (fulfill, reject) {
        //TODO: return team permissions for specified user
        /*
         A - admin
         W - write (can modify members)
         R - read (can read all data about member)
         R1 - can read only team name
         R2 - R1 + team member names
         X - nothing
         */
        fulfill('W');
    }));
};
