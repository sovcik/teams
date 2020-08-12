/* eslint-disable no-unused-vars */
/* eslint-disable no-async-promise-executor */

const mongoose = require('mongoose');
const Promise = (mongoose.Promise = require('bluebird'));

const db = require('./common');

const debugLib = require('debug')('lib-db-user');
const logERR = require('debug')('ERROR:lib-db-user');
const logWARN = require('debug')('WARN:lib-db-user');
const logINFO = require('debug')('INFO:lib-db-user');

const exp = {};

module.exports = exp;

const User = mongoose.models.User;
const TeamUser = mongoose.models.TeamUser;
const Team = mongoose.models.Team;

exp.getCoachTeams = function(myId, userId) {
    return new Promise(async function(fulfill, reject) {
        const debug = debugLib.extend('getCoachTeams');

        debug('getCoachTeams  coach=%s', userId);
        const teams = [];
        try {
            const ut = await TeamUser.find({ userId: userId, role: 'coach' });
            debug('Found %s teams', ut.length);
            for (let i of ut) {
                const t = await Team.findOneActive({ _id: i.teamId });
                if (t) teams.push({ _id: t._id, name: t.name });
            }
            fulfill(teams);
        } catch (err) {
            logWARN('Error getting coachTeams, err=%s', err);
            reject(err);
        }
    });
};
