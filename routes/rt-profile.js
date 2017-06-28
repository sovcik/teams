const mongoose = require('mongoose');
const express = require('express');
const cel = require('connect-ensure-login');
const router = express.Router();
const bcrypt = require('bcrypt');

const Team = mongoose.model('Team');
const User = mongoose.model('User');
const TeamUser = mongoose.model('TeamUser');

const dbUser = require('../lib/db/User');

module.exports = router;

router.get('/', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    const userId = req.query.id;
    const cmd = req.query.cmd;
    console.log("/profile - get");
    console.log(req.query);
    const r = {result:"error", status:200};
    if (!userId) return res.redirect('/profile?id='+req.user.id);
    switch (cmd){
        case 'getCoachTeams':
            console.log('Going to get Coach teams');
            const ut = await dbUser.getCoachTeams(req.user.id, userId);
            r.result = "ok";
            r.list = ut;
            break;
        default:
            if (cmd)
                console.log("cmd=unknown");
            else
                try {
                    const u = await User.findOneActive({_id: userId});
                    return res.render('profile', {profile:u, coach:1, user:req.user});
                } catch (err) {
                    return res.render('error', {message:"Profile not found",error:err});
                }

    }
    res.json(r);
    res.end();

});

router.post('/', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    console.log("/profile - post");
    console.log(req.body.cmd);
    const r = {result:"error", status:200};
    const coachId = req.body.coachId;
    switch (req.body.cmd){
        case 'createTeam':
            let teamName = req.body.name;
            console.log('Going to create team: ', teamName);
            try {
                let t = await Team.findOneActive({name:teamName});
                if (t) {
                    r.message = 'Duplicate team name';
                } else {
                    t = await Team.create({name:teamName, programId:req.body.programId});
                    console.log("Team created", t.name, t.id);
                    let ut = await TeamUser.create({userId:coachId, teamId:t.id, role:'coach'});
                    r.result = "ok";
                    t.teamId = t.id;
                }
            } catch (err) {
                r.message = err.message;
                console.log(err);
            }
            break;
        case 'changePassword':
            try {
                const up1 = await User.findOneActive({_id: req.body.userId});
                // check if user exists
                if (!up1)
                    throw new Error("User not found");
                // check if old password is correct
                if (!await bcrypt.compare(req.body.oldPwd, up1.passwordHash))
                    throw new Error("Invalid old password specified");

                // create new password
                const s = await bcrypt.genSalt(5);
                const h = await bcrypt.hash(req.body.newPwd, s);
                const user = await User.findByIdAndUpdate(req.body.userId, { $set: { salt: s, passwordHash:h}}, { new: true });
                console.log("Password changed: " + user.username + "===" + user.id);
                r.result = "ok";
            } catch (err) {
                console.log('Error changing password',err);
                r.error = {};
                r.error.message = err.message;
            }
            break;
        default:
            console.log('cmd=unknown');
            break;
    }
    res.json(r);
    res.end();


});