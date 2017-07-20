"use strict";

const mongoose = require('mongoose');
const express = require('express');
const cel = require('connect-ensure-login');
const router = express.Router();
const email = require('../lib/email');
const log = require('../lib/logger');
const libInvoice = require('../lib/invoice');
const libFmt = require('../lib/fmt');

const Event = mongoose.models.Event;
const Team = mongoose.models.Team;
const TeamEvent = mongoose.models.TeamEvent;
const Program = mongoose.models.Program;
const InvoicingOrg = mongoose.models.InvoicingOrg;

module.exports = router;

router.param('id', async function (req, res, next){
    const id = req.params.id;
    let r;
    console.log("Event id",id);
    try {
        r = await Event.findById(id);
        req.event = r;
        if (r) {
            req.user.isEventOrganizer = (req.event.managers.indexOf(req.user.id) >= 0);
            r = await InvoicingOrg.populate(r,'invoicingOrg');
            r.teams = [];
            let tmse = await TeamEvent.find({eventId: r.id});
            let tms = await Team.populate(tmse, 'teamId');
            tms.forEach(t => r.teams.push({id: t.teamId.id, name: t.teamId.name}));
            r.teams.sort(function(a,b) {return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);} );

            console.log("Event id=", r.id, " name=", r.name);

        } else
            throw new Error("event not found");
        next();
    } catch (err) {
        res.render('error',{message:"Stretnutie/Turnaj nenájdený",error:{status:err.message}});
    }

});


router.get('/:id', async function (req, res, next) {
    const cmd = req.query.cmd;
    console.log("/event/:id - get");

    if (cmd)
        next();
    else
        res.render('event',{event: req.event, user: req.user, fmt:libFmt});

});

router.get('/:id', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    const cmd = req.query.cmd;
    const eventId = req.params.id;
    console.log("/event/:id - get (CMD)");
    console.log(req.query);

    const r = {result:"error", status:200};
    r.isAdmin = req.user.isAdmin || req.user.isSuperAdmin;
    r.isEventOrganizer = req.user.isEventOrganizer;

    try {
        switch (cmd) {
            case 'getTeams':
                console.log('Going to get list of registered teams');
                const te = await TeamEvent.find({eventId:eventId});
                if (!te)
                    throw new Error("Error while fetching teams for event "+eventId);

                r.list = [];
                for (let t of te) {
                    try {
                        console.log("TE=",t.id);
                        let ti = await Team.findById(t.teamId);
                        let a = JSON.parse(JSON.stringify(ti)); // ti is  frozen for adding properties, so copy is needed
                        if (ti) {
                            a.teamEvent = t;
                            r.list.push(a);
                        }
                    } catch (err) {
                        throw new Error("Error while fetching data for teamEvent="+ti.teamEvent);
                    }
                }

                r.result = "ok";
                break;

            default:
                console.log('cmd=unknown');
        }
    } catch (err) {
        r.error = err;
        log.ERROR("GET /event/:id failed. err="+err);
    }
    res.json(r);
    res.end();

});


router.get('/', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    const cmd = req.query.cmd;
    console.log("/event - get (CMD)");
    console.log(req.query);

    const r = {result:"error", status:200};
    r.isAdmin = req.user.isAdmin || req.user.isSuperAdmin;
    r.isEventOrganizer = req.user.isEventOrganizer;

    try {
        switch (cmd) {
            case 'getList':
                console.log('Going to get list of all events');
                const p = await Event.find({recordStatus: 'active'}, {
                    name: true,
                    id: true
                });
                r.result = "ok";
                r.list = p;
                r.list.sort(function(a,b) {return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);} );
                break;

            case 'getAvailTeamEvents':
                console.log('Going to get list of team events');
                const t = await Team.findOneActive({_id: req.query.teamId});
                if (t) {
                    const p = await Event.find({recordStatus: 'active', programId: t.programId}, {
                        name: true,
                        id: true
                    });
                    r.result = "ok";
                    r.list = p;
                    r.list.sort(function(a,b) {return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);} );
                } else {
                    throw new Error("Team not found");
                }
                break;
            default:
                if (cmd)
                    console.log('cmd=unknown');
        }
    } catch (err) {
        r.error = {};
        r.error.message = err.message;
    }
    res.json(r);
    res.end();

});

router.post('/', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    const cmd = req.body.cmd;
    console.log("/event - put");
    console.log(req.body);

    const r = {result:"error", status:200};
    r.isAdmin = req.user.isAdmin || req.user.isSuperAdmin;
    r.isEventOrganizer = req.user.isEventOrganizer;

    try {
        switch (cmd) {
            case 'createEvent':
                if (!req.user.isAdmin)
                    return res.render('error',{message:"Prístup zamietnutý"});

                let name = req.body.name;
                console.log('Going to create event ', name);

                let p = await Program.findOneActive({_id:req.body.programId});
                if (!p) throw new Error("Program does not exist");
                let io = await InvoicingOrg.findOneActive({_id:req.body.invOrgId});
                if (!io) throw new Error("Invoicing org does not exist");

                let e = await Event.findOneActive({name:name});
                if (e) throw new Error("Duplicate event name");

                try {
                    e = await Event.create({name: name, programId: p.id, invoicingOrg: io.id});
                    console.log("Event created", e.name, e.id);
                    r.result = "ok";
                    r.event = e;
                } catch (er) {
                    log.ERROR("Failed creating event: "+name+" err="+er.message);
                    r.error = {};
                    r.error.message = er.message;

                }
                break;

            default:
                console.log("cmd=unknown");

        }
    } catch (err) {
        r.error = {};
        r.error.message = err.message;
    }
    res.json(r);
    res.end();

});

router.post('/:id', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    const siteUrl = req.protocol + '://' + req.get("host");
    const cmd = req.body.cmd;
    console.log("/event/:id - put");
    console.log(req.body);

    const r = {result:"error", status:200};
    r.isAdmin = req.user.isAdmin || req.user.isSuperAdmin;
    r.isEventOrganizer = req.user.isEventOrganizer;

    try {
        switch (cmd) {
            case 'registerTeam':
                console.log('Going to register team for an event');
                let t = await Team.findOneActive({_id: req.body.teamId});
                if (!t) throw new Error("Team not found");

                let p = await Program.findOneActive({_id:t.programId});
                if (!p) throw new Error("Team not joined in program");

                let e = await Event.findOneActive({programId:p.id, _id:req.event.id});
                if (!e) throw new Error("Event not found or not relevant for program team is joined to");

                let te;
                try {
                    te = await TeamEvent.create({
                        teamId: t.id,
                        eventId: e.id,
                        programId: p.id,
                        registeredOn: Date.now()
                    });
                } catch (er) {
                    log.ERROR("Failed registering team="+t.name+" for event="+e.name+" err="+er.message);
                }

                if (!te) throw new Error("Failed to register");

                let inv;
                try {
                    console.log('Going to create invoice');
                    inv = await libInvoice.createInvoice(te.teamId, te.eventId, "P");
                } catch (er) {
                    log.ERROR("Failed creating invoice for teamId="+te.teamId+" eventId="+te.eventId+" err="+er.message);
                }

                if (inv)
                    email.sendInvoice(req.user, inv, siteUrl);
                if (te)
                    email.sendEventRegisterConfirmation(req.user, t, e, siteUrl);

                r.result = "ok";
                r.teamEvent = te;
                break;

            default:
                console.log("cmd=unknown");

        }
    } catch (err) {
        r.error = {};
        r.error.message = err.message;
    }
    res.json(r);
    res.end();

});