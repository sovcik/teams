'use strict';

const express = require('express');
const router = express.Router();
const cel = require('connect-ensure-login');
const mongoose = require('mongoose');

const dbTeam = require('../lib/db/Team');

const Team = mongoose.model('Team');
const User = mongoose.model('User');
const UserTeam = mongoose.model('UserTeam');

module.exports = router;

router.get('/',cel.ensureLoggedIn('/login'), async function (req, res, next) {
    const teamId = req.query.id;
    const cmd = req.query.cmd;

    if (!teamId) res.redirect('/profile');

    console.log("/team - get");
    console.log(req.query);
    var ret = true;
    var r = {result:"error", status:200};
    switch (cmd){
        case 'getTeamCoaches':
            console.log('Going to get team coaches');
            const tc = await dbTeam.getTeamCoaches(req.user.id, teamId);
            r.result = "ok";
            r.list = tc;
            break;

        case 'getTeamMembers':
            console.log('Going to get team members');
            const tm = await dbTeam.getTeamMembers(req.user.id, teamId);
            r.result = "ok";
            r.list = tm;
            break;

        case 'getAdrDetails':
            console.log('Going to get team address details');
            const tad = await dbTeam.getTeamDetails(req.user.id, teamId);
            r.result = "ok";
            r.details = tad;
            break;

        default:
            console.log('cmd=unknown');
            const t = await dbTeam.getTeamDetails(req.user.id, teamId);
            return res.render('team',{team:t});
            break;
    }
    res.json(r);
    res.end();

});

router.post('/', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    console.log("/team - post");
    console.log(req.body);
    var ret = true;
    var r = {result:"error", status:200};
    switch (req.body.cmd){

        case 'saveAdrDetails':
            console.log('Going to save team address details');
            try {
                let doc = formatTeamDoc(req.body.data);
                const nd = await dbTeam.saveTeamDetails(req.user.id, req.body.teamId, doc);
                r.result = "ok";
            } catch (err) {
                r.message = err.message;
                console.log(err);
            }
            break;

        case 'createTeamMember':
            let memberName = req.body.name;
            console.log('Going to create member: ', memberName);
            try {

                let m = await User.create({fullName:req.body.name, email:req.body.email, dateOfBirth:req.body.dob});
                console.log("Member created", m.fullName, m.id);
                let mt = await UserTeam.create({userId:m.id, teamId:req.body.teamId, role:'member'});
                r.result = "ok";
                r.memberId = m.id;

            } catch (err) {
                r.message = err.message;
                console.log(err);
            }
            break;
        case 'removeTeamMember':
            console.log('Going to remove member: ', req.body.memberId, "from team", req.body.teamId);
            try{
                let conf = await UserTeam.deleteOne({"userId":req.body.memberId, "teamId":req.body.teamId});
                if (conf.deletedCount > 0) {
                    console.log('Member removed', req.body.memberId);
                    r.result = "ok"
                }
            } catch(err) {
                r.message = err.message;
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

function formatTeamDoc(data){
    console.log("Formatting team document from posted data");
    const doc = {};

}