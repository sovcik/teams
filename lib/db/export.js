/* eslint-disable no-unused-vars */
/* eslint-disable no-async-promise-executor */
'use strict';

const mongoose = require('mongoose');
const Promise = (mongoose.Promise = require('bluebird'));
const eachAsync = require('each-async');

const debugLib = require('debug')('lib-db-export');
const logERR = require('debug')('ERROR:lib-db-export');
const logWARN = require('debug')('WARN:lib-db-export');
const logINFO = require('debug')('INFO:lib-db-export');

const User = mongoose.models.User;
const Team = mongoose.models.Team;
const TeamUser = mongoose.models.TeamUser;
const TeamEvent = mongoose.models.TeamEvent;
const Program = mongoose.models.Program;
const Event = mongoose.models.Event;

const exp = {};

module.exports = exp;

exp.exportProgramData = function (progId, eventId, privateData) {
    return new Promise(async function (fulfill, reject) {
        const debug = debugLib.extend('exportProgData');
        var data = {};
        try {
            logINFO(
                'Export: program id=%s eventId=%s privateData=%s',
                progId,
                eventId,
                privateData
            );

            let p = await Program.findById(progId, { name: 1, managers: 1 }, { lean: true });
            if (!p) throw new Error('Program not found id=' + progId);

            let teq = { programId: p._id };

            if (eventId) {
                let e = await Event.findById(eventId, { name: 1, managers: 1 }, { lean: true });
                if (!e) throw new Error('Event not found id=' + eventId);
                teq = { programId: p._id, eventId: e._id };
            }

            data.program = p;
            data.program.teams = [];

            let teList = await TeamEvent.find(teq, {}, { lean: true });

            eachAsync(
                teList,
                async function (te, idx, next) {
                    let selectTeamFields = { name: 1, 'foundingOrg.name': 1, foundingAdr: 1 };
                    if (privateData)
                        selectTeamFields = {
                            name: 1,
                            foundingOrg: 1,
                            foundingAdr: 1,
                            foundingContact: 1,
                            shippingOrg: 1,
                            shippingAdr: 1,
                            shippingContact: 1,
                        };

                    var t = await Team.findById(te.teamId, selectTeamFields, { lean: true });

                    if (t) {
                        te = await Event.populate(te, {
                            path: 'eventId',
                            select: { name: 1, startDate: 1, endDate: 1 },
                        });
                        t.event = te;

                        t.coaches = [];
                        t.members = [];

                        let mList = await TeamUser.find({ teamId: t._id });

                        for (let m of mList)
                            if (m.role === 'coach') t.coaches.push(m.userId);
                            else t.members.push(m.userId);

                        let selectUserFields = { fullName: 1 };
                        if (privateData)
                            selectUserFields = { fullName: 1, email: 1, dateOfBirth: 1, phone: 1 };

                        t = await User.populate(t, {
                            path: 'coaches members',
                            select: selectUserFields,
                        });
                        t.memberCount = t.members.length;

                        t.members = []; // do not export member data for now

                        data.program.teams.push(t);

                        next();
                    } else {
                        logERR(
                            'Failed to fetch team: id=%s referenced in teamEvent=%s',
                            te.teamId,
                            te.id
                        );
                    }
                },
                function (err) {
                    if (err) {
                        debug('Error processing program events err=', err);
                        reject(err);
                    }
                    debug('Finished processing program events');
                    return fulfill(data);
                }
            );
        } catch (err) {
            debug(err);
            return reject(err);
        }
    });
};
