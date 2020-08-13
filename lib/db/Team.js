/* eslint-disable no-unused-vars */
/* eslint-disable no-async-promise-executor */
'use strict';

const mongoose = require('mongoose');
const Promise = (mongoose.Promise = require('bluebird'));
const eachAsync = require('each-async');

const debugLib = require('debug')('lib-db-team');
const logERR = require('debug')('ERROR:lib-db-team');
const logWARN = require('debug')('WARN:lib-db-team');
const logINFO = require('debug')('INFO:lib-db-team');

const db = require('./common');
const libPerm = require('../permissions');

const exp = {};

module.exports = exp;

const User = mongoose.models.User;
const Team = mongoose.models.Team;
const TeamUser = mongoose.models.TeamUser;
const TeamEvent = mongoose.models.TeamEvent;
const Program = mongoose.models.Program;
const Event = mongoose.models.Event;

exp.getTeamDetails = function(userId, teamId) {
    return new Promise(async function(fulfill, reject) {
        const debug = debugLib.extend('getTeamDetails');
        debug('GET-TEAM-DETAILS teamId=%s user=%s', teamId, userId);
        try {
            const p = await libPerm.getUserTeamPermissions(userId, teamId);
            const t = await Team.findById(teamId, {}, { lean: true });
            if (!t) {
                debug('Team not found id=', teamId);
                return reject(null);
            }
            t.id = '' + t._id;

            t.events = [];
            const evList = await TeamEvent.find({ teamId: t.id });
            const evDetails = await Event.populate(evList, 'eventId');
            evDetails.forEach(e =>
                t.events.push({
                    _id: e.eventId._id,
                    name: e.eventId.name,
                    programId: e.programId,
                    registeredOn: e.registeredOn,
                    eventDate: e.eventDate
                })
            );

            debug('Applying permissions=' + p.code);
            // apply permissions
            switch (p.code) {
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
            logWARN('Error getting teamDetails. err=%s', err.message);
            return reject(err);
        }
    });
};

exp.getTeamCoaches = function(user, teamId) {
    return new Promise(async function(fulfill, reject) {
        const debug = debugLib.extend('getTeamCoaches');
        debug('GET-TEAM-COACHES');
        const coaches = [];
        try {
            const p = await libPerm.getUserTeamPermissions(user.id, teamId);
            const t = await Team.findById(teamId);
            if (!t) {
                debug('Team not found id=%s', teamId);
                return reject(null);
            }
            let tc = [];
            if (p.code != 'R1') tc = await TeamUser.find({ teamId: teamId, role: 'coach' });

            eachAsync(
                tc,
                async function(item, index, done) {
                    debug('Searching coach %s', item.userId);
                    let u = await User.findOneActive({ _id: item.userId });
                    let ud = {};
                    switch (p.code) {
                        case 'A':
                        case 'W':
                        case 'R':
                            if (u.dateOfBirth) ud.dateOfBirth = u.dateOfBirth;
                        // eslint-disable-next-line no-fallthrough
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
                    debug('Coaches loaded');
                    return fulfill(coaches);
                }
            );
        } catch (err) {
            logWARN('Error getting team coaches. err=%s', err.message);
            return reject(err);
        }
    });
};

exp.getTeamMembers = function(userId, teamId) {
    return new Promise(async function(fulfill, reject) {
        const debug = debugLib.extend('getTeamMembers');
        debug('GET-TEAM-MEMBERS user=', userId);
        const members = [];
        try {
            const p = await libPerm.getUserTeamPermissions(userId, teamId);
            debug('Permissions=', p);
            const t = await Team.findById(teamId);
            if (!t) {
                debug('Team not found id=', teamId);
                return reject(null);
            }
            debug('Found team: ', t.name, t.id);
            let tm = [];
            if (p != 'R1') tm = await TeamUser.find({ teamId: teamId, role: 'member' });
            debug('Found members', tm.length);

            eachAsync(
                tm,
                async function(item, index, done) {
                    let u = await User.findOneActive({ _id: item.userId });
                    let ud = {};
                    switch (p.code) {
                        case 'A':
                        case 'W':
                        case 'R':
                            if (u.dateOfBirth) ud.dateOfBirth = u.dateOfBirth;
                            if (u.email) ud.email = u.email;
                        // eslint-disable-next-line no-fallthrough
                        case 'R2':
                            ud.fullName = u.fullName;
                            ud._id = u._id;
                            break;
                    }
                    members.push(ud);
                    return done();
                },
                function(err) {
                    if (err) return reject(err);
                    debug('Members loaded');
                    return fulfill(members);
                }
            );
        } catch (err) {
            logWARN('Error getting team members. err=%s', err.message);
            return reject(err);
        }
    });
};

exp.saveTeamDetails = function(user, teamId, doc) {
    return new Promise(async function(fulfill, reject) {
        const debug = debugLib.extend('saveTeamDetails');
        debug('SAVE-TEAM-DETAILS');

        try {
            const p = await libPerm.getUserTeamPermissions(user.id, teamId);
            const t = await Team.findOneActive({ _id: teamId });
            if (!t) {
                debug('Team not found id=', teamId);
                return reject(null);
            }
            debug('Found team: ', t.name, t._id);

            if (p.code === 'A' || p.code === 'W') {
                const res = await Team.findOneAndUpdate(
                    { _id: teamId },
                    { $set: doc },
                    { new: true }
                );
                return fulfill(res);
            } else return reject({ message: 'Permission denied' });
        } catch (err) {
            logWARN('Error saving team details. err=%s', err.message);
            return reject(err);
        }
    });
};

/*
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
         *
        if (user) {
            if (user.isEventManager) p = 'R2';
            if (user.isProgramManager) p = 'R';
            if (user.isCoach) p = 'W';
            if (user.isAdmin) p = 'A';
        }

        fulfill(p);
    }));
};
*/
