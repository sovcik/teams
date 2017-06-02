const mongoose = require('mongoose');
const express = require('express');
const cel = require('connect-ensure-login');
const router = express.Router();

const Team = mongoose.model('Team');
const User = mongoose.model('User');
const UserTeam = mongoose.model('UserTeam');

const dbUser = require('../lib/db/User');

module.exports = router;

router.get('/', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    const userId = req.query.id;
    if (!userId) return res.redirect('/profile?id='+req.user.id);
    try {
        const u = await User.findOneActive({_id: userId});
        console.log('Rendering profile ',u);
        res.render('profile', {user:u, coach:1, coachingTeams:['T1', 'T2', 'T3'], memberTeams:['M1','M2']});
    } catch (err) {
        res.render('error', {message:"Profile not found",error:err});
    }

});

router.post('/', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    console.log("/profile - post");
    console.log(req.body);
    const ret = true;
    const r = {result:"error", status:200};
    const coachId = req.body.coachId;
    switch (req.body.cmd){
        case 'getCoachTeams':
            console.log('Going to get Coach teams');
            const ut = await dbUser.getCoachTeams(req.user.id, coachId);
            res.json({result:"ok", list:ut});
            res.end();
            break;
        case 'createTeam':
            let teamName = req.body.name;
            console.log('Going to create team: ', teamName);
            try {
                let t = await Team.findOneActive({name:teamName});
                if (t) {
                    r.message = 'Duplicate team name';
                } else {
                    t = await Team.create({name:teamName});
                    console.log("Team created", t.name, t.id);
                    let ut = await UserTeam.create({userId:coachId, teamId:t.id, role:'coach'});
                    r.result = "ok";
                    t.teamId = t.id;
                }
            } catch (err) {
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