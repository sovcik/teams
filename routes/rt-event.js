/* eslint-disable no-unused-vars */
/* eslint-disable no-async-promise-executor */

'use strict';

const mongoose = require('mongoose');
const express = require('express');
const cel = require('connect-ensure-login');
const router = express.Router();
const email = require('../lib/email');
const libInvoice = require('../lib/invoice');
const libFmt = require('../lib/fmt');
const dbExport = require('../lib/db/export');
const debugLib = require('debug')('rt-event');
const logERR = require('debug')('ERROR:rt-event');
const logWARN = require('debug')('WARN:rt-event');

const Event = mongoose.models.Event;
const Team = mongoose.models.Team;
const TeamEvent = mongoose.models.TeamEvent;
const Program = mongoose.models.Program;
const InvoicingOrg = mongoose.models.InvoicingOrg;
const Invoice = mongoose.models.Invoice;
const User = mongoose.models.User;

module.exports = router;

router.param('id', async function(req, res, next) {
    const id = req.params.id;

    let debug = debugLib.extend('param/id');
    debug('Event id %s', id);

    try {
        const r = await Event.findById(id);
        req.event = r;
        if (r) {
            req.event = await Program.populate(req.event, 'programId');
            req.event = await InvoicingOrg.populate(req.event, 'invoicingOrg');
            if (req.user) {
                req.user.isEventOrganizer = req.event.managers.indexOf(req.user.id) >= 0;
                req.user.isProgramManager = req.event.programId.managers.indexOf(req.user.id) >= 0;
                req.user.isInvoicingOrgManager =
                    req.event.invoicingOrg.managers.indexOf(req.user.id) >= 0;
            } else {
                req.user = {
                    isAdmin: false,
                    isEventOrganizer: false,
                    isProgramManager: false,
                    isInvoicingOrgManager: false,
                    locales: libFmt.defaultLocales
                };
            }
            r.teams = [];
            let tmse = await TeamEvent.find({ eventId: r.id });
            let tms = await Team.populate(tmse, 'teamId');
            tms.forEach(t => r.teams.push({ id: t.teamId.id, name: t.teamId.name }));
            r.teams.sort(function(a, b) {
                return a.name > b.name ? 1 : b.name > a.name ? -1 : 0;
            });

            debug('Event id=%s name=%s', r.id, r.name);
        } else throw new Error('event not found');
        next();
    } catch (err) {
        logERR('param err=%s', err.message);
        res.render('message', {
            title: 'Stretnutie/Turnaj nenájdený',
            error: { status: err.message }
        });
    }
});

router.get('/:id', async function(req, res, next) {
    const cmd = req.query.cmd;
    let debug = debugLib.extend('get/id');
    debug('/event/:id - get');

    if (cmd) next();
    else res.render('event', { event: req.event, user: req.user, fmt: libFmt });
});

router.get('/:id', cel.ensureLoggedIn('/login'), async function(req, res, next) {
    const cmd = req.query.cmd;
    const eventId = req.params.id;
    let debug = debugLib.extend('get/id+cmd');
    debug('/event/:id - get (CMD)');
    debug('%O', req.query);

    const r = { result: 'error', status: 200 };

    //r.isAdmin = req.user.isAdmin || req.user.isSuperAdmin;
    //r.isEventOrganizer = req.user.isEventOrganizer;

    try {
        switch (cmd) {
            case 'getTeams':
                {
                    debug('Going to get list of registered teams');
                    const te = await TeamEvent.find({ eventId: eventId });
                    if (!te) throw new Error('Error while fetching teams for event ' + eventId);

                    r.list = [];
                    let ti;
                    for (let t of te) {
                        try {
                            debug('TE=%s', t.id);
                            ti = await Team.findById(t.teamId);
                            let a = JSON.parse(JSON.stringify(ti)); // ti is  frozen for adding properties, so copy is needed
                            if (ti) {
                                a.teamEvent = t;
                                r.list.push(a);
                            }
                        } catch (err) {
                            throw new Error(
                                'Error while fetching data for teamEvent=' + ti.teamEvent
                            );
                        }
                    }

                    r.result = 'ok';
                }
                break;
            case 'getOrganizers':
                {
                    debug('Going to get list of event organizers');
                    let e = await User.populate(req.event, {
                        path: 'managers',
                        select: { fullName: 1 }
                    });
                    r.list = e.managers;
                    r.result = 'ok';
                }
                break;
            case 'export':
                if (!req.user.isAdmin && !req.user.isEventOrganizer) {
                    r.error = { message: 'permission denied' };
                    break;
                }

                try {
                    debug(
                        'Event data export requested by user= %s for event %s',
                        req.user.username,
                        req.event._id
                    );
                    r.data = await dbExport.exportProgramData(
                        req.event.programId,
                        req.event._id,
                        true
                    );
                    r.user = req.user;
                    r.result = 'ok';
                } catch (err) {
                    r.error = { message: 'Failed to export event data. err=' + err };
                }

                break;

            default:
                debug('cmd=unknown');
        }
    } catch (err) {
        r.error = err;
        logERR('GET /event/:id failed. err=%s', err.message);
    }
    res.json(r);
    res.end();
});

router.get(
    '/',
    /*cel.ensureLoggedIn('/login'), */ async function(req, res, next) {
        const cmd = req.query.cmd;
        const progId = req.query.program;
        const evtOrgId = req.query.eo;
        const onlyActive = req.query.active;

        let debug = debugLib.extend('get/cmd');
        debug('/event - get (CMD)');
        debug('%O', req.query);

        const r = { result: 'error', status: 200 };
        r.isAdmin = req.user && (req.user.isAdmin || req.user.isSuperAdmin);
        r.isEventOrganizer = req.user && req.user.isEventOrganizer;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        try {
            switch (cmd) {
                case 'getList':
                    {
                        debug('Going to get list of events');
                        let q = { recordStatus: 'active' };
                        if (progId) q.programId = progId;
                        if (evtOrgId) q.managers = evtOrgId;
                        if (onlyActive == 1) {
                            q.recordStatus = 'active';
                            if (!r.isAdmin)
                                // admin will see all events - even past ones
                                q.$or = [{ regEndDate: null }, { regEndDate: { $gte: today } }]; // start-date not specified or greater then today
                        }
                        const p = await Event.find(q, {
                            id: 1,
                            name: 1,
                            startDate: 1,
                            endDate: 1,
                            regEndDate: 1
                        });
                        r.result = 'ok';
                        r.list = p;
                        r.list.sort(function(a, b) {
                            return a.name > b.name ? 1 : b.name > a.name ? -1 : 0;
                        });
                    }
                    break;

                case 'getAvailTeamEvents':
                    {
                        debug('Going to get list of team events');
                        const t = await Team.findById(req.query.teamId);
                        if (t) {
                            const p = await Event.find(
                                { recordStatus: 'active', programId: t.programId },
                                {
                                    name: true,
                                    id: true
                                }
                            );
                            r.result = 'ok';
                            r.list = p;
                            r.list.sort(function(a, b) {
                                return a.name > b.name ? 1 : b.name > a.name ? -1 : 0;
                            });
                        } else {
                            throw new Error('Team not found');
                        }
                    }
                    break;
                default:
                    if (cmd) debug('cmd=unknown');
            }
        } catch (err) {
            r.error = {};
            r.error.message = err.message;
        }
        res.json(r);
        res.end();
    }
);

router.post('/:id/fields', cel.ensureLoggedIn('/login'), async function(req, res, next) {
    let debug = debugLib.extend('post/id/fields');
    debug('/event/:ID/fields - post');
    debug('%O', req.body);
    const r = { result: 'error', status: 200 };

    // no modifications allowed unless user is program manager or admin
    if (!req.user.isAdmin && !req.user.isEventOrganizer) {
        r.error = {};
        r.error.message = 'permission denied';
        res.json(r);
        res.end();
        return;
    }

    try {
        if (req.body.name) {
            let p = await Event.findById(req.body.pk);
            if (p) {
                p[req.body.name] = req.body.value;
                let verr = p.validateSync();
                if (!verr) {
                    await p.save();
                    r.result = 'ok';
                    if (req.body.name === 'startDate') {
                        // and set new date also to event registrations
                        await TeamEvent.update(
                            { eventId: req.event._id },
                            { $set: { eventDate: req.body.value } },
                            { multi: true }
                        );
                    }
                } else r.error = { message: 'Chyba: ' + verr };
            } else {
                r.error = { message: 'Program nenájdený id=' + req.body.pk };
            }
        }
    } catch (err) {
        r.error = { message: err.message };
        logERR('POST fields err=%s', err.message);
    }

    res.json(r);
    res.end();
});

router.post('/:id', cel.ensureLoggedIn('/login'), async function(req, res, next) {
    const siteUrl = req.protocol + '://' + req.get('host');
    const cmd = req.body.cmd;

    let debug = debugLib.extend('post/id');

    debug('/event/:id - put');
    debug('%O', req.body);

    const r = { result: 'error', status: 200 };
    r.isAdmin = req.user.isAdmin || req.user.isSuperAdmin;
    r.isEventOrganizer = req.user.isEventOrganizer;

    let today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
        switch (cmd) {
            case 'deregisterTeam':
                {
                    debug('Going to de-register team for an event=%s', req.event._id);
                    let qr = {
                        teamId: req.body.teamId,
                        eventId: req.body.eventId,
                        $or: [{ eventDate: { $gte: today } }, { eventDate: null }]
                    };
                    let tpr = await TeamEvent.findOne(qr); // find all ACTIVE events from the same program team is already registered for
                    if (tpr) {
                        await TeamEvent.deleteOne({ _id: tpr._id });
                    } else {
                        debug('Team not registered for specified event, or event is in the past.');
                    }
                    r.result = 'ok';
                }
                break;
            case 'registerTeam':
                {
                    debug('Going to register team for an event=%s', req.event._id);

                    let t = await Team.findOneActive({ _id: req.body.teamId });
                    if (!t) throw new Error('Team not found');

                    // check if required data has been provided
                    if (!(t.foundingOrg.name && t.billingOrg.name && t.shippingOrg.name))
                        throw new Error('Required team data not provided');

                    let e = await Event.findOneActive(req.event._id);
                    if (!e) throw new Error('Event is not active id=' + e._id);

                    if (e.regEndDate && e.regEndDate < today && !r.isAdmin && !r.isEventOrganizer)
                        throw new Error(
                            'Event is not open for registration. Registration end=' + e.regEndDate
                        );

                    debug('Registering for program id=', e.programId);

                    let q = {
                        teamId: t._id,
                        programId: e.programId,
                        $or: [{ eventDate: { $gte: today } }, { eventDate: null }]
                    };
                    let tp = await TeamEvent.findOne(q); // find all ACTIVE events from the same program team is already registered for
                    if (tp) {
                        debug(
                            'Already registered teamevent id=%s event=%s program=%s dateStart=%s',
                            tp._id,
                            tp.eventId,
                            tp.programId,
                            tp.eventDate
                        );
                        throw new Error(
                            'Team is already registered for active event in the same program'
                        );
                    }

                    /*
                 tp = await Event.populate(tp, "eventId"); // load event data

                 for (let et of tp){
                 if (et.eventId.startDate >= today || !et.eventId.startDate) {
                 log.DEBUG("Already registered teamevent id="+et._id+" event="+et.eventId._id+" program="+et.programId+" dateStart="+et.eventId.startDate);
                 throw new Error("Team is already registered for active event in the same program");
                 }
                 }
                 */

                    e = await User.populate(e, 'managers'); // needed in order to get event managers' emails
                    if (!e)
                        throw new Error('Failed to populate event managers for event id=' + e._id);

                    let te;

                    te = await TeamEvent.findOne({ teamId: t._id, eventId: e._id });
                    if (te)
                        throw new Error(
                            'Team is already registered for specified event id=' + e._id
                        );

                    try {
                        te = await TeamEvent.create({
                            teamId: t.id,
                            eventId: e.id,
                            programId: e.programId,
                            registeredOn: Date.now(),
                            eventDate: e.startDate
                        });
                    } catch (er) {
                        logERR(
                            'POST Failed registering team=%s for event=%s err=%s',
                            t.name,
                            e.name,
                            er.message
                        );
                    }

                    if (te) email.sendEventRegisterConfirmation(req.user, t, e, siteUrl);
                    else throw new Error('Failed to register');

                    const createInvoice = req.body.createInvoice;

                    if (createInvoice == 'yes') {
                        let inv;
                        try {
                            debug('Going to create invoice team=%s event=%s', t.id, e.id);
                            inv = await Invoice.findOne({
                                invoicingOrg: e.invoicingOrg,
                                type: 'T'
                            }); // find invoice template used by invoicing org
                            inv = await libInvoice.createInvoice(
                                e.invoicingOrg,
                                null, // null means 'use settings'
                                t.billingOrg,
                                t.billingAdr,
                                t.billingContact,
                                !inv ? null : inv._id
                            );
                            inv.event = e._id; // link with event
                            inv.team = t._id; // link with team
                            await inv.save(); // save changes

                            inv = await libInvoice.confirmInvoice(inv._id); // confirm invoice draft -> create invoice from invoice draft
                            debug('Invoice created #%s', inv.number);
                        } catch (er) {
                            logERR(
                                'Failed creating invoice for teamId=%s eventId=%s err=%s',
                                te.teamId,
                                te.eventId,
                                er.message
                            );
                        }

                        try {
                            if (inv) {
                                inv = await Team.populate(inv, 'team');
                                email.sendInvoice(req.user, inv, siteUrl);
                            }
                        } catch (er) {
                            logERR(
                                'POST Failed sending invoice inv=%s for team=%s err=%s',
                                inv.id,
                                te.teamId,
                                er.message
                            );
                        }
                    }

                    r.result = 'ok';

                    r.messages = [];
                    if (e.message) r.messages.push({ message: e.message });

                    let p = await Program.findById(e.programId);

                    if (p.message) r.messages.push({ message: p.message });

                    r.teamEvent = te;
                }
                break;
            case 'addOrganizer':
                {
                    debug('Going to add organizer for an event');

                    if (
                        !req.user.isAdmin &&
                        !req.user.isEventOrganizer &&
                        !req.user.isProgramManager
                    ) {
                        logWARN('addOrganizer: Permission denied for user=%s', req.user.username);
                        r.error = { message: 'permission denied' };
                        break;
                    }

                    let u = await User.findOneActive({ username: req.body.username });
                    if (!u) throw new Error('User not found ' + req.body.username);

                    try {
                        let e = await Event.findOneAndUpdate(
                            { _id: req.event._id },
                            { $addToSet: { managers: u._id } }
                        );
                        if (!e) throw new Error('Failed to update event=' + req.event._id);

                        r.result = 'ok';
                        r.event = e;
                    } catch (err) {
                        logERR('POST Failed to save event organizer. err=%s', err.message);
                    }
                }
                break;
            case 'setDate':
                debug('Going to set event date');

                if (!req.user.isAdmin && !req.user.isEventOrganizer && !req.user.isProgramManager) {
                    logWARN('setDate: Permission denied for user=%s', req.user.username);
                    r.error = { message: 'permission denied' };
                    break;
                }

                try {
                    let newEvDate = new Date(req.body.newStartDate);

                    let e = await Event.findOneAndUpdate(
                        { _id: req.event._id },
                        { $set: { startDate: newEvDate, endDate: newEvDate } }
                    );
                    if (!e) throw new Error('Failed to update event=' + req.event._id);

                    // and set new date also to event registrations
                    await TeamEvent.update(
                        { eventId: req.event._id },
                        { $set: { eventDate: newEvDate } },
                        { multi: true }
                    );

                    r.result = 'ok';
                    r.event = e;
                } catch (err) {
                    logERR('POST Failed to save new event date. err=%s');
                }
                break;

            default:
                debug('cmd=unknown');
        }
    } catch (err) {
        logERR('%s', err.message);
        r.error = { message: err.message };
    }
    res.json(r);
    res.end();
});

router.post('/', cel.ensureLoggedIn('/login'), async function(req, res, next) {
    const cmd = req.body.cmd;

    let debug = debugLib.extend('post');
    debug('%O', req.body);

    const r = { result: 'error', status: 200 };
    r.isAdmin = req.user.isAdmin || req.user.isSuperAdmin;
    r.isEventOrganizer = req.user.isEventOrganizer;

    try {
        switch (cmd) {
            case 'createEvent':
                {
                    if (!req.user.isAdmin && !req.user.isProgramManager)
                        return res.render('message', { title: 'Prístup zamietnutý' });

                    let name = req.body.name;
                    debug('Going to create event %s', name);

                    let p = await Program.findOneActive({ _id: req.body.programId });
                    if (!p) throw new Error('Program does not exist');
                    let io = await InvoicingOrg.findOneActive({ _id: req.body.invOrgId });
                    if (!io) throw new Error('Invoicing org does not exist');

                    let e = await Event.findOneActive({ name: name });
                    if (e) throw new Error('Duplicate event name');

                    try {
                        e = await Event.create({
                            name: name,
                            programId: p.id,
                            invoicingOrg: io.id
                        });
                        debug('Event created name=%s id=%s', e.name, e.id);
                        r.result = 'ok';
                        r.event = e;
                    } catch (er) {
                        logERR('Failed creating event=%s err=%s', name, er.message);
                        r.error = {};
                        r.error.message = er.message;
                    }
                }
                break;

            default:
                debug('cmd=unknown');
        }
    } catch (err) {
        r.error = {};
        r.error.message = err.message;
        logERR('%s', err.message);
    }
    res.json(r);
    res.end();
});
