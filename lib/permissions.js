"use strict";

const log = require('./logger');
const mongoose = require('mongoose');
const Promise = mongoose.Promise = require('bluebird');

const User = mongoose.models.User;
const Team = mongoose.models.Team;
const TeamUser = mongoose.models.TeamUser;
const TeamEvent = mongoose.models.TeamEvent;
const Program = mongoose.models.Program;
const Event = mongoose.models.Event;
const Invoice = mongoose.models.Invoice;
const InvoicingOrg = mongoose.models.InvoicingOrg;

const exp = module.exports = {};

exp.getUserTeamPermissions = function (userId,teamId){
    return new Promise(
        async function(fulfill, reject){
            const p = {};
            p.user = userId;
            p.team = teamId;
            p.code = 'X';

            try {
                const u = await User.findById(userId);
                if (!u) return fulfill(p);  // user does not exist -> no permissions

                p.canReadPublic = true;

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
                const t = await TeamUser.findOne({userId: userId, teamId: teamId, role: 'coach'});

                if (t) {
                    p.code = "W";
                    p.canWrite = true;
                    p.canRead = true;
                    p.isCoach = true;
                    return fulfill(p);
                } // user is coach -> can modify

                const e = await TeamEvent.find({teamId:teamId}, {}, {lean:true});
                if (e) {
                    let ev = await Event.populate(e,{path:"eventId",select:{name:1,startDate:1,endDate:1,managers:1}});

                    let eo = false;
                    let i = 0;
                    while(!eo && i<ev.length){
                        eo = (ev[i].eventId.managers.indexOf(userId) > -1);
                        i++;
                    }
                    if (eo){
                        p.code = "R";
                        p.canRead = true;
                        p.isEventOrganizer = true;
                    }

                }

            } catch (err) {
                log.ERROR("Error getting user-team permissions err="+err.message);
                return reject(p);
            }
            return fulfill(p);

        }
    );

};

exp.getUserInvoicePermissions = function (userId,invId){
    return new Promise(
        async function(fulfill, reject){
            const p = {};
            p.user = userId;
            p.invoice = invId;
            p.code = 'X';

            try {
                log.TRACE("Fetching permissions for user="+userId+" invoice="+invId);
                const u = await User.findById(userId);
                const inv = await Invoice.findById(invId);

                if (!u || !inv) return fulfill(p);  // user/invoice does not exist -> no permissions

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
                const t = await TeamUser.findOne({userId: userId, teamId: inv.team, role: 'coach'});
                if (t) {
                    p.code = "R";
                    p.canRead = true;
                    p.isCoach = true;
                }

                // is user invoicing org manager
                const io = await InvoicingOrg.findById(inv.invoicingOrg);
                if (io && (io.managers.indexOf(userId) >= 0)) {
                    p.isInvoicingOrgManager = true;
                    p.code = "W";
                    p.canWrite = true;
                    p.canRead = true;
                    p.isCoach = true;
                }

            } catch (err) {
                log.ERROR("Error getting user-invoice permissions. err="+err.message);
                return reject(p);
            }
            return fulfill(p);

        }
    );

};