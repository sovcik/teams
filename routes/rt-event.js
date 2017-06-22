"use strict";

const mongoose = require('mongoose');
const express = require('express');
const cel = require('connect-ensure-login');
const router = express.Router();
const email = require('../lib/email');
const log = require('../lib/logger');

const Event = mongoose.models.Event;
const Team = mongoose.models.Team;
const TeamEvent = mongoose.models.TeamEvent;
const Program = mongoose.models.Program;
const EventOrganizer = mongoose.models.EventOrganizer;

module.exports = router;

router.get('/', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    const cmd = req.query.cmd;
    const eventId = req.query.id;
    console.log("/event - get");
    console.log(req.query);

    const r = {result:"error", status:200};

    try {
        if (await EventOrganizer.findOne({userId:req.user.id, eventId:eventId}))
            req.user.isOrganizer = true;

    } catch(err) {
        log.WARN("Failed getting organizer status for user id="+req.user.id);
    }

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
                } else {
                    throw new Error("Team not found");
                }
                break;
            default:
                let e;
                if (cmd)
                    console.log('cmd=unknown');
                try {
                    e = await Event.findOne({_id: eventId});
                } catch (err) {

                }
                if (e) {
                    e.teams = [];
                    //console.log("rendering event", e);
                    let tmse = await TeamEvent.find({eventId:e.id});
                    let tms = await Team.populate(tmse,'teamId');
                    tms.forEach(t => e.teams.push({id:t.teamId.id, name:t.teamId.name}));

                    //console.log("+++++ populated EVENT",e);

                    return res.render('event', {event: e, user: req.user});
                } else
                    if (!cmd)
                        return res.render('error',{message:"Stretnutie/turnaj nenájdený", error:{status:''}});

        }
    } catch (err) {
        r.error = {};
        r.error.message = err.message;
    }
    res.json(r);
    res.end();

});

router.post('/', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    const siteUrl = req.protocol + '://' + req.get("host");
    const cmd = req.body.cmd;
    console.log("/event - put");
    console.log(req.body);
    const r = {result:"error", status:200};
    try {
        switch (cmd) {
            case 'registerTeam':
                console.log('Going to register team for an event');
                let t = await Team.findOneActive({_id: req.body.teamId});
                if (!t) throw new Error("Team not found");

                let p = await Program.findOneActive({_id:t.programId});
                if (!p) throw new Error("Team not joined in program");

                let e = await Event.findOneActive({programId:p.id, _id:req.body.eventId});
                if (!e) throw new Error("Event not found or not relevant for program team is joined to");

                let te = await TeamEvent.create({teamId:t.id, eventId:e.id, programId:p.id, registeredOn:Date.now()});
                if (!te) throw new Error("Failed to register");

                email.sendEventRegisterConfirmation(req.user, t, e, siteUrl);

                r.result = "ok";
                r.list = p;
                break;
            case 'createEvent':
                if (req.user.role != 'A')
                    return res.redirect('/profile');

                let name = req.body.name;
                console.log('Going to create event ', name);
                try {
                    let p = await Program.findOneActive({_id:req.body.programId});
                    if (!p) throw new Error("Program does not exist");
                    let e = await Event.findOneActive({name:name});
                    if (e) throw new Error("Duplicate event name");
                    e = await Event.create({name:name, programId:req.body.programId});
                    console.log("Program created", p.name, p.id);
                    r.result = "ok";
                } catch (err) {
                    r.error = {};
                    r.error.message = err.message;
                    console.log(err);
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