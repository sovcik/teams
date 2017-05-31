const mongoose = require('mongoose');
const Promise = mongoose.Promise = require('bluebird');
const eachAsync = require('each-async');

const db = require('./common');

const exp = {};

module.exports = exp;

const User = mongoose.models.User;
const UserTeam = mongoose.models.UserTeam;
const Team = mongoose.models.Team;

exp.getTeamDetails = async function(myId, teamId) {
    return new Promise(async function (fulfill, reject) {
        console.log("GET-TEAM-DETAILS");
        const team = {name: 'xxx', members: []};
        try {
            const p = await exp.teamPermissions(myId, teamId);
            const t = await Team.findOneActive({_id: teamId});
            if (!t) return reject(null);
            console.log("Found team: ", t.name, t.id);
            team.name = t.name;
            let tm = [];
            if (p != 'R1')
                tm = await UserTeam.findActive({teamId: teamId});
            console.log('TEAM members',tm);
            eachAsync(
                tm,
                async function(item, index, done) {
                    console.log("Searching member ",item.userId);
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
                    team.members.push(ud);
                    done();
                },
                function(err) {
                    if (err) reject(err);
                    console.log("Members loaded");
                    fulfill(team);
                }
            )

        } catch (err) {
            console.log('Error getting teamDetails');
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
