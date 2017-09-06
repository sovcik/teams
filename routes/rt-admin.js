const mongoose = require('mongoose');
const express = require('express');
const cel = require('connect-ensure-login');
const router = express.Router();
const log = require('../lib/logger');

const Event = mongoose.models.Event;
const Team = mongoose.models.Team;
const TeamEvent = mongoose.models.TeamEvent;
const Program = mongoose.models.Program;

module.exports = router;

router.get('/', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    console.log("/admin - get");
    if (!req.user.isAdmin)
        return res.render('message',{title:"Prístup zamietnutý"});

    const cmd = req.query.cmd;

    console.log(req.query);
    const r = {result:"error", status:200};
    try {
        switch (cmd) {
            case 'getAvailTeamEvents':
                log.INFO('u('+req.user.username+') Going to get list of team events');
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
                if (!cmd)
                    return res.render('admin', {user:req.user});
                else
                    console.log("cmd=unknown");

        }
    } catch (err) {
        r.error = {};
        r.error.message = err.message;
    }
    res.json(r);
    res.end();

});

router.post('/', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    console.log("/admin - post");
    if (!req.user.isAdmin)
        return res.render('message',{title:"Prístup zamietnutý"});
    
    const cmd = req.body.cmd;
    console.log(req.body);
    const r = {result:"error", status:200};
    try {
        switch (cmd) {
            case 'registerTeam':
                console.log('Going to register team for an event');
                const t = await Team.findOneActive({_id: req.body.teamId});
                if (!t) throw new Error("Team not found");

                const p = await Program.findOneActive({_id:t.programId});
                if (!p) throw new Error("Team not joined in program");

                const e = await Event.findOneActive({programId:p.id, _id:req.body.eventId});
                if (!e) throw new Error("Event not found or not relevant for program team is joined to");

                const te = await TeamEvent.create({teamId:t.id, eventId:e.id, programId:p.id, registeredOn:Date.now()});
                if (!te) throw new Error("Failed to register");

                r.result = "ok";
                r.list = p;
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

