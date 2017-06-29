"use strict";

const log = require('logger');
const mongoose = require('mongoose');
const Promise = mongoose.Promise = require('bluebird');

const User = mongoose.models.User;
const Team = mongoose.models.Team;
const TeamUser = mongoose.models.TeamUser;
const TeamEvent = mongoose.models.TeamEvent;
const Program = mongoose.models.Program;
const Event = mongoose.models.Event;
const Invoice = mongoose.models.Invoice;

const exp = module.exports = {};

exp.userTeamPermissions = function (userId,teamId){
    return new Promise(
        async function(fulfill, reject){
            try {
                let p = 'X';

                const u = await User.findById(userId);
                if (!u) return fulfill('X');  // user does not exist -> no permissions

                if (u.isAdmin || u.isSuperAdmin) return fulfill('A'); // user is admin

                const t = await TeamUser.findOne({userId: userId, teamId: teamId, role: 'coach'});
                if (t) return fulfill('W'); // user is coach -> can modify

            } catch (err) {
                return reject('X');
            }
            return fulfill(p);

        }
    );

};