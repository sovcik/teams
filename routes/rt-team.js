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

router.get('/', cel.ensureLoggedIn('/login'), function (req, res, next) {
    const teamId = req.query.id;

    if (!teamId) res.redirect('/profile');

    dbTeam.getTeamDetails(req.user.id, teamId)
        .then(
            function (team) {
                res.render('team', {team:team});
            }
        )
        .catch(
            function (err){
                res.status(404).end();
            }
        )

});

router.post('/', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    console.log("/team - post");
    console.log(req.body);
    var ret = true;
    var r = {result:"error", status:200};
    switch (req.body.cmd){
        case 'getTeamCoaches':
            console.log('Going to get team coaches');
            const tc = await dbTeam.getTeamCoaches(req.user.id, req.body.id);
            res.json({result:"ok", list:tc});
            res.end();
            break;

        case 'getTeamMembers':
            console.log('Going to get team members');
            const tm = await dbTeam.getTeamMembers(req.user.id, req.body.id);
            res.json({result:"ok", list:tm});
            res.end();
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
            res.json(r);
            res.end();
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
            res.json(r);
            res.end();
            break;

        default:
            console.log('cmd=unknown');
            res.json(r);
            res.end();
            break;
    }

});