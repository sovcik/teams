'use strict';

const mongoose = require('mongoose');
const Promise = mongoose.Promise = require('bluebird');
const eachAsync = require('each-async');
const log = require('../logger');

const db = require('./common');

const exp = {};

module.exports = exp;

const User = mongoose.models.User;
const Team = mongoose.models.Team;
const TeamUser = mongoose.models.TeamUser;
const TeamEvent = mongoose.models.TeamEvent;
const Program = mongoose.models.Program;
const Event = mongoose.models.Event;

exp.getTeamDetails = function(user, teamId) {
    return new Promise(async function (fulfill, reject) {
        console.log("GET-TEAM-DETAILS teamId=",teamId);
        try {
            const p = await exp.teamPermissions(user, teamId);
            const t = await Team.findById(teamId,{},{lean:true});
            if (!t) {
                console.log('Team not found id=',teamId);
                return reject(null);
            }
            t.id = ''+ t._id;
            const pr = await Program.findOneActive({_id:t.programId});
            if (pr)
                t.programName = pr.name;
            else
                t.programName = "-- undefined --";

            t.events = [];
            const evList = await TeamEvent.find({teamId:t.id});
            const evDetails = await Event.populate(evList,'eventId');
            evDetails.forEach(e => t.events.push({_id:e.eventId._id, name:e.eventId.name, programId:e.programId, registeredOn:e.registeredOn}));

            // apply permissions
            switch (p){
                case 'P1':
                    t.billingContact = {};
                    t.shippingContact = {};
                    break;
                case 'X':
                    t.billingContact = {};
                    t.shippingContact = {};
                    t.billingAdr = {};
                    t.shippingAdr = {};
                    break;
            }

            return fulfill(t);

        } catch (err) {
            log.WARN('Error getting teamDetails. err='+err.message);
            return reject(err);
        }

    });
};

exp.getTeamCoaches = function(user, teamId) {
    return new Promise(async function (fulfill, reject) {
        console.log("GET-TEAM-COACHES");
        const coaches = [];
        try {
            const p = await exp.teamPermissions(user, teamId);
            const t = await Team.findById(teamId);
            if (!t) {
                console.log('Team not found id=',teamId);
                return reject(null);
            }
            console.log("Found team: ", t.name, t.id);
            let tc = [];
            if (p != 'R1')
                tc = await TeamUser.find({teamId: teamId, role:'coach'});
            console.log('TEAM coaches',tc.length);

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
                            ud._id = u._id;
                            break;
                    }
                    coaches.push(ud);
                    done();
                },
                function(err) {
                    if (err) return reject(err);
                    console.log("Coaches loaded");
                    return fulfill(coaches);
                }
            )

        } catch (err) {
            log.WARN('Error getting team coaches. err='+err.message);
            return reject(err);
        }

    });
};

exp.getTeamMembers = function(user, teamId) {
    return new Promise(async function (fulfill, reject) {
        console.log("GET-TEAM-MEMBERS");
        const members = [];
        try {
            const p = await exp.teamPermissions(user, teamId);
            const t = await Team.findById(teamId);
            if (!t) {
                console.log('Team not found id=',teamId);
                return reject(null);
            }
            console.log("Found team: ", t.name, t.id);
            let tm = [];
            if (p != 'R1')
                tm = await TeamUser.find({teamId: teamId, role:'member'});
            console.log('Found members',tm.length);

            eachAsync(
                tm,
                async function(item, index, done) {
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
                    return done();
                },
                function(err) {
                    if (err) return reject(err);
                    console.log("Members loaded");
                    return fulfill(members);
                }
            )

        } catch (err) {
            log.WARN('Error getting team members. err='+err.message);
            return reject(err);
        }

    });
};

exp.saveTeamDetails = function(user, teamId, doc) {
    return new Promise(async function (fulfill, reject) {
        console.log("SAVE-TEAM-DETAILS");

        try {
            const p = await exp.teamPermissions(user, teamId);
            const t = await Team.findOneActive({_id: teamId});
            if (!t) {
                console.log('Team not found id=',teamId);
                return reject(null);
            }
            console.log("Found team: ", t.name, t._id);

            if (p === 'A' || p === 'W') {
                const res = await Team.findOneAndUpdate({_id: teamId}, {$set:doc}, {new:true});
                return fulfill(res);
            } else
                return reject({message:"Permission denied"});


        } catch (err) {
            log.WARN('Error saving team details. err='+err.message);
            return reject(err);
        }

    });
};


exp.teamPermissions = async function(user, teamId) {
    return (new Promise(async function (fulfill, reject) {
        let p = 'X';
        //TODO: return team permissions for specified user
        /*
         A - admin
         W - write (can modify members)
         R - read (can read all data about team)
         R1 - can read only team name & team contact
         R2 - R1 + team member names (no personal details)
         X - nothing
         */
        if (user) {
            if (user.isEventManager) p = 'R2';
            if (user.isProgramManager) p = 'R';
            if (user.isCoach) p = 'W';
            if (user.isAdmin) p = 'A';
        }

        fulfill(p);
    }));
};
