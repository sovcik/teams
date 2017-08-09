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
        res.render('message',{message:"Program nenájdený",error:err});
    }

});

// PUBLIC PART OF API
router.get('/:id', async function (req, res, next) {
    let routerNext = false;
    const cmd = req.query.cmd;
    console.log("/program - PUBLIC get (ID,CMD)");
    console.log(req.query);
    const r = {result:"error", status:200};
    switch (cmd){
        case 'exportPublic':
            try {
                log.WARN('Program PUBLIC data export requested for program='+req.program._id);
                r.data = await dbExport.exportProgramData(req.program._id, false);
                r.user = req.user;
                r.result = 'ok';
            } catch (err) {
                r.error = {message:"Failed to export program data. err="+err};
            }

            break;

        default:
            routerNext = true;
            console.log("cmd=unknown");

    }
    if (routerNext)
        next();
    else {
        res.json(r);
        res.end();
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
                r.data = await dbExport.exportProgramData(req.program._id, true);
                r.user = req.user;
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
                return res.render('message',{message:"Prístup zamietnutý"});

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

router.post('/:id', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    console.log("/program - post (ID)");

    console.log(req.body.cmd);
    const r = {result:"error", status:200};

    try {
        switch (req.body.cmd) {
            case "addManager":
                console.log('Going to add manager to a program');

                if (!req.user.isAdmin && !req.user.isProgramManager) {
                    log.WARN("addManager: Permission denied for user=" + req.user.username);
                    r.error = {message: "permission denied"};
                    break;
                }

                let u = await User.findOneActive({username: req.body.username});
                if (!u) throw new Error("User not found " + req.body.username);

                try {

                    let e = await Program.findOneAndUpdate({_id: req.program._id}, {$addToSet: {managers: u._id}});
                    if (!e) throw new Error("Failed to update program=" + req.program._id);

                    r.result = "ok";
                    r.program = e;
                } catch (err) {
                    log.ERROR("Failed to save program manager. err=" + err);
                }
                break;
            default:
                console.log('cmd=unknown');
                break;
        }
    } catch (err) {
        console.log(err);
        r.error = {message:err.message};
    }
    res.json(r);
    res.end();


});