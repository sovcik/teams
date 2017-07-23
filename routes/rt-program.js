const mongoose = require('mongoose');
const express = require('express');
const cel = require('connect-ensure-login');
const router = express.Router();
const log = require('../lib/logger');
const dbExport = require('../lib/db/export');

const Program = mongoose.models.Program;
const User = mongoose.models.User;

module.exports = router;

router.param('id', async function (req, res, next){
    const id = req.params.id;
    let p;
    try {
        p = await Program.findById(id);
        req.program = p;
        if (!p)
            throw new Error("program not found");

        if (req.user)
            req.user.isProgramManager = (req.program.managers.indexOf(req.user.id) >= 0);

        log.DEBUG("Program id="+req.program.id);

        next();
    } catch (err) {
        res.render('error',{message:"Program nenájdený",error:err});
    }

});

router.get('/:id', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    const cmd = req.query.cmd;
    console.log("/program - get (ID)");

    if (cmd)
        next();
    else {
        res.render('program', {user: req.user, program:req.program});
    }

});

router.get('/', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    const cmd = req.query.cmd;
    console.log("/program - get");

    if (cmd)
        next();
    else {
        let list;
        try {
            list = await Program.findActive();
        } catch (err) {
            log.WARN("Failed to fetch list of programs. err="+err);
        }
        res.render('programs', {user: req.user, programs:list});
    }

});


router.get('/', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    const cmd = req.query.cmd;
    const pm = req.query.pm;
    console.log("/program - get (CMD)");
    console.log(req.query);
    const r = {result:"error", status:200};
    switch (cmd){
        case 'getList':
            console.log('Going to get list of programs');
            let q = { recordStatus: 'active' };
            try {
                if (pm)
                    q.managers = new mongoose.Types.ObjectId(pm);
                const p = await Program.find(q, {name:true, id:true});
                r.result = "ok";
                r.list = p;
            } catch (err) {
                // if wrong format, then it should return empty list
                r.error = {message:"error getting programs err=" + err};
            }

            break;
        default:
            console.log("cmd=unknown");

    }
    res.json(r);
    res.end();

});

router.get('/:id', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    const cmd = req.query.cmd;
    console.log("/program - get (ID,CMD)");
    console.log(req.query);
    const r = {result:"error", status:200};
    switch (cmd){
        case 'getManagers':
            console.log('Going to get list of program managers');

            try {
                if (req.program.managers.length == 0)
                    break;

                let u = await User.find({_id:{$in:req.program.managers}},{fullName:true, id:true});
                r.result = "ok";
                r.list = u;
            } catch (err) {
                r.error = {message:"error getting managers err=" + err};
            }
            break;
        case 'export':
            if (!req.user.isAdmin && !req.user.isProgramManager) {
                r.error = {message:"permission denied"};
                break;
            }

            try {
                log.WARN('Program data export requested by user='+req.user.username+' for program='+req.program._id);
                r.data = await dbExport.exportProgramData(req.program._id);
                r.result = 'ok';
            } catch (err) {
                r.error = {message:"Failed to export program data. err="+err};
            }

            break;
        default:
            console.log("cmd=unknown");

    }
    res.json(r);
    res.end();

});


router.post('/', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    console.log("/program - post");

    console.log(req.body.cmd);
    const r = {result:"error", status:200};

    switch (req.body.cmd){
        case 'createProgram':
            if (!req.user.isAdmin)
                return res.render('error',{message:"Prístup zamietnutý"});

            let name = req.body.name;
            console.log('Going to create program ', name);
            try {
                let p = await Program.findOneActive({name:name});
                if (p) throw new Error("Duplicate program name");
                p = await Program.create({name:name});
                console.log("Program created", p.name, p.id);
                r.result = "ok";
            } catch (err) {
                r.error = {};
                r.error.message = err.message;
                console.log(err);
            }
            break;
        default:
            console.log('cmd=unknown');
            break;
    }
    res.json(r);
    res.end();


});