"use strict";

const mongoose = require('mongoose');
const cel = require('connect-ensure-login');
const express = require("express");
const router = express.Router();
const log = require('../lib/logger');

const TeamEvent = mongoose.model('TeamEvent');

module.exports = router;

router.param('id', async function (req, res, next){
    const id = req.params.id;
    let te;
    try {
        te = await TeamEvent.findById(id);
        if (!te)
            throw new Error("team-event not found");

        req.teamEvent = te;
        log.DEBUG("TeamEvent id="+te.id);

        next();
    } catch (err) {
        res.render('error',{message:"TeamEvent nenájdný",error:err});
    }

});


router.get('/:id', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    const siteUrl = req.protocol + '://' + req.get("host");
    console.log("SITE URL",siteUrl);
    const cmd = req.query.cmd;
    console.log("/profile - get");

    if (cmd)
        next();
    else {
        res.json(req.teamEvent);
        res.end();
    }

});

router.get('/:id', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    next()

});

router.post('/:id', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    console.log("/team-event - post");
    console.log(req.body.cmd);
    const r = {result:"error", status:200};
    const id = req.params.id;
    switch (req.body.cmd){
        case 'assignNumber':
            let teamNumber = req.body.teamNumber;
            console.log('Going to assign number=', teamNumber, 'to teamEvent=', req.teamEvent.id);
            try {
                req.teamEvent.teamNumber = teamNumber;
                let te = await req.teamEvent.save();
                if (te) {
                    console.log("Number assigned", te.id, te.teamNumber);
                    r.result = "ok";
                    r.teamEvent = te;
                }
            } catch (err) {
                r.error = err;
                log.WARN("Failed assigning number to teamEvent="+id+". err="+err);
            }
            break;
        default:
            console.log('cmd=unknown');
            break;
    }
    res.json(r);
    res.end();

});
