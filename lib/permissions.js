/* eslint-disable no-unused-vars */
/* eslint-disable no-async-promise-executor */

'use strict';

const mongoose = require('mongoose');
const Promise = (mongoose.Promise = require('bluebird'));

const debugLib = require('debug')('lib-perm');
const logERR = require('debug')('ERROR:lib-perm');
const logWARN = require('debug')('WARN:lib-perm');
const logINFO = require('debug')('INFO:lib-perm');

const User = mongoose.models.User;
const Team = mongoose.models.Team;
const TeamUser = mongoose.models.TeamUser;
const TeamEvent = mongoose.models.TeamEvent;
const Program = mongoose.models.Program;
const Event = mongoose.models.Event;
const Invoice = mongoose.models.Invoice;
const InvoicingOrg = mongoose.models.InvoicingOrg;

const exp = (module.exports = {});

exp.isCoach = function(userId, teamId) {
    return new Promise(async function(fulfill, reject) {
        let isCoach = false;
        if (!teamId) return fulfill(isCoach);

        try {
            // is user coach?
            const t = await TeamUser.findOne({ userId: userId, teamId: teamId, role: 'coach' });
            if (t) isCoach = true; // user does exist in role coach for specified team, so he is coach
        } catch (err) {
            logERR('Error checking if user is coach err=%s', err.message);
            return reject(isCoach);
        }

        return fulfill(isCoach);
    });
};

exp.isInvOrgManager = function(userId, invOrgId) {
    return new Promise(async function(fulfill, reject) {
        let isIOMgr = false;
        if (!invOrgId) return fulfill(isIOMgr);

        try {
            const io = await InvoicingOrg.findById(invOrgId);
            if (io && io.managers.indexOf(userId) >= 0) {
                isIOMgr = true;
            }
        } catch (err) {
            logERR('Error checking if user is InvOrgManager err=%s', err.message);
            return reject(isIOMgr);
        }

        return fulfill(isIOMgr);
    });
};

exp.isEventManager = function(userId, eventId) {
    return new Promise(async function(fulfill, reject) {
        let isEvMgr = false;
        if (!eventId) return fulfill(isEvMgr);

        try {
            const e = await Event.findById(eventId);
            if (e && e.managers.indexOf(userId) >= 0) {
                isEvMgr = true;
            }
        } catch (err) {
            logERR('Error checking if user is EventManager err=%s', err.message);
            return reject(isEvMgr);
        }

        return fulfill(isEvMgr);
    });
};

exp.getUserPermissions = function(userId, teamId, eventId, invOrgId) {
    return new Promise(async function(fulfill, reject) {
        const debug = debugLib.extend('getUsrPerms');
        const p = {};
        p.user = userId;
        p.code = 'X';

        try {
            const u = await User.findById(userId);
            if (!u) return fulfill(p); // user does not exist -> no permissions

            p.canReadPublic = true;

            // is user admin?
            if (u.isAdmin || u.isSuperAdmin) {
                debug('Permissions: Admin');
                p.code = 'A';
                p.isAdmin = u.isAdmin || u.isSuperAdmin;
                p.isSuperAdmin = u.isSuperAdmin;
                p.canWrite = true;
                p.canRead = true;
                return fulfill(p);
            }

            if (teamId) {
                p.isCoach = await exp.isCoach(userId, teamId);
            }

            if (invOrgId) {
                p.isInvoicingOrgManager = await exp.isInvOrgManager(userId, invOrgId);
            }

            if (eventId) {
                p.isEventManager = await exp.isEventManager(userId, eventId);
            }
        } catch (err) {
            logERR('Error getting user permissions err=%s', err.message);
            return reject(p);
        }
        return fulfill(p);
    });
};

exp.getUserTeamPermissions = function(userId, teamId) {
    return new Promise(async function(fulfill, reject) {
        const debug = debugLib.extend('getUsrTeamPerms');
        const p = {};
        p.user = userId;
        p.team = teamId;
        p.code = 'X';

        try {
            const u = await User.findById(userId);
            if (!u) return fulfill(p); // user does not exist -> no permissions

            p.canReadPublic = true;

            // is user admin?
            if (u.isAdmin || u.isSuperAdmin) {
                debug('Permissions: Admin');
                p.code = 'A';
                p.isAdmin = u.isAdmin || u.isSuperAdmin;
                p.isSuperAdmin = u.isSuperAdmin;
                p.canWrite = true;
                p.canRead = true;
                return fulfill(p);
            }

            // is user coach?
            const isCoach = await exp.isCoach(userId, teamId);

            if (isCoach) {
                debug('Permissions: Coach');
                p.code = 'W';
                p.canWrite = true;
                p.canRead = true;
                p.isCoach = true;
                return fulfill(p);
            } // user is coach -> can modify

            const e = await TeamEvent.find({ teamId: teamId }, {}, { lean: true });
            if (e) {
                let ev = await Event.populate(e, {
                    path: 'eventId',
                    select: { name: 1, startDate: 1, endDate: 1, managers: 1 }
                });

                let eo = false;
                let i = 0;
                while (!eo && i < ev.length) {
                    eo = ev[i].eventId.managers.indexOf(userId) > -1;
                    i++;
                }
                if (eo) {
                    p.code = 'R';
                    p.canRead = true;
                    p.isEventOrganizer = true; //todo: this is not right
                }
            }
        } catch (err) {
            logERR('Error getting user-team permissions err=%s', err.message);
            return reject(p);
        }
        return fulfill(p);
    });
};

exp.getUserInvoicePermissions = function(userId, invId) {
    return new Promise(async function(fulfill, reject) {
        const debug = debugLib.extend('getUsrInvPerms');
        const p = {};
        p.user = userId;
        p.invoice = invId;
        p.code = 'X';

        try {
            debug('Fetching permissions for user=' + userId + ' invoice=' + invId);
            const u = await User.findById(userId);
            const inv = await Invoice.findById(invId);

            if (!u || !inv) return fulfill(p); // user/invoice does not exist -> no permissions

            p.canReadPublic = 1;

            // is user admin?
            if (u.isAdmin || u.isSuperAdmin) {
                p.code = 'A';
                p.isAdmin = u.isAdmin || u.isSuperAdmin;
                p.isSuperAdmin = u.isSuperAdmin;
                p.canWrite = true;
                p.canRead = true;
                return fulfill(p);
            }

            // is user coach?
            const isCoach = await exp.isCoach(userId, inv.team);
            if (isCoach) {
                p.code = 'R';
                p.canRead = true;
                p.isCoach = true;
            }

            // is user invoicing org manager
            const isIOMgr = await exp.isInvOrgManager(userId, inv.invoicingOrg);
            if (isIOMgr) {
                p.isInvoicingOrgManager = true;
                p.code = 'W';
                p.canWrite = true;
                p.canRead = true;
                p.isCoach = true;
            }
        } catch (err) {
            logERR('Error getting user-invoice permissions. err=%s', err.message);
            return reject(p);
        }
        return fulfill(p);
    });
};
