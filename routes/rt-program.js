const mongoose = require('mongoose');
const express = require('express');
const cel = require('connect-ensure-login');
const router = express.Router();

const Program = mongoose.models.Program;

module.exports = router;

router.get('/', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    const cmd = req.query.cmd;
    console.log("/program - get");
    console.log(req.query);
    const r = {result:"error", status:200};
    switch (cmd){
        case 'getList':
            console.log('Going to get list of programs');
            const p = await Program.find({ recordStatus: 'active' },{name:true, id:true});
            r.result = "ok";
            r.list = p;
            break;
        default:
            console.log("cmd=unknown");

    }
    res.json(r);
    res.end();

});

router.post('/', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    console.log("/program - post");
    console.log("User role=",req.user.role);

    console.log(req.body.cmd);
    const r = {result:"error", status:200};

    switch (req.body.cmd){
        case 'createProgram':
            if (req.user.role != 'A')
                return res.redirect('/profile');

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