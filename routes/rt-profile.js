const mongoose = require('mongoose');
const express = require('express');
const cel = require('connect-ensure-login');
const router = express.Router();
const bcrypt = require('bcrypt');
const log = require('../lib/logger');

const Team = mongoose.model('Team');
const User = mongoose.model('User');
const TeamUser = mongoose.model('TeamUser');
const Program = mongoose.model('Program');

const dbUser = require('../lib/db/User');

module.exports = router;

router.param('id', async function (req, res, next){
    const id = req.params.id;
    let u;
    try {
        u = await User.findById(id,{salt:0, passwordHash:0});
        req.profile = u;
        if (!u)
            throw new Error("profile not found");

        log.DEBUG("Profile id="+req.profile.id+" username="+req.profile.username);

        next();
    } catch (err) {
        res.render('error',{message:"Profil nenájdný",error:err});
    }

});


router.get('/:id', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    const siteUrl = req.protocol + '://' + req.get("host");
    console.log("SITE URL",siteUrl);
    const cmd = req.query.cmd;
    console.log("/profile/:id - get");

    if (cmd)
        next();
    else {
        let isProgramManager = false;
        let isCoach = false;
        try {
            let pm = await Program.findOne({managers:req.profile.id });
            if (pm) {
                isProgramManager = true;
                console.log("Profile is program manager");
            } else
                console.log("Profile is NOT program manager");
            let tm = await TeamUser.findOne({userId:req.profile.id, role:'coach'});
            if (tm) {
                isCoach = true;
                console.log("Profile is coach");
            } else
                console.log("Profile is NOT coach");
        } catch (err) {
            log.WARN("Failed fetching program data for user profile. "+err);
        }
        res.render('profile', {profile: req.profile, coach: isCoach, user: req.user, isProgramManager:isProgramManager});
    }

});

router.get('/', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    const cmd = req.query.cmd;
    console.log("/profile - get");
    console.log(req.query);
    if (!cmd) return res.redirect('/profile/'+req.user.id);
    const r = {result:"error", status:200};
    switch (cmd){
        case 'getList':
            console.log('Going to get list of users');
            try {
                let opts = {username:true, fullName:true, email:true, isAdmin:true, isSuperAdmin:true};
                const u = await User.findActive({username:{$exists:true}});
                if (u) {
                    r.result = "ok";
                    r.list = u;
                } else {
                    log.WARN("Failed to fetch list of users.");
                }
            } catch (err) {
                log.WARN("Failed to fetch list of users. err="+err);
                r.error = err;
            }
            break;
        default:
            console.log("cmd=unknown");
    }
    res.json(r);
    res.end();

});


router.get('/:id', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    const userId = req.params.id;
    const cmd = req.query.cmd;
    console.log("/profile/:id - get");
    console.log(req.query);
    const r = {result:"error", status:200};
    switch (cmd){
        case 'getCoachTeams':
            console.log('Going to get Coach teams');
            try {
                const ut = await dbUser.getCoachTeams(req.user.id, userId);
                r.result = "ok";
                r.list = ut;
            } catch (err) {
                log.WARN("Failed to fetch coach's teams. err="+err)
                r.error = err;
            }
            break;

        default:
            console.log("cmd=unknown");

    }
    res.json(r);
    res.end();

});

router.post('/:id', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    console.log("/profile/:id - post");
    console.log(req.body.cmd);
    const r = {result:"error", status:200};
    const id = req.params.id;
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
                    let ut = await TeamUser.create({userId:id, teamId:t.id, role:'coach'});
                    r.result = "ok";
                    t.teamId = t.id;
                }
            } catch (err) {
                r.error = err;
                log.WARN("Failed creating team for coach "+id+". err="+err);
            }
            break;
        case 'changePassword':
            try {
                const up1 = await User.findOneActive({_id: id});
                // check if user exists
                if (!up1)
                    throw new Error("User not found");
                // check if old password is correct
                if (!req.user.isAdmin && !req.user.isSuperAdmin)
                    if (!await bcrypt.compare(req.body.oldPwd, up1.passwordHash))
                        throw new Error("Invalid old password specified");

                // create new password
                let s = await bcrypt.genSalt(5);
                let h = await bcrypt.hash(req.body.newPwd, s);

                let user = await User.findByIdAndUpdate(id, { $set: { salt: s, passwordHash:h}}, { new: true });
                if (user) {
                    log.INFO("Password changed for " + user.username +" by " + req.user.username);
                    r.result = "ok";
                } else {
                    log.WARN("Failed changing password for user "+id);
                }
            } catch (err) {
                log.WARN('Error changing password for user '+id+" err="+err);
                r.error = err;
            }
            break;
        case 'makeAdmin':
            console.log("Going to make admin",id);
            if (!req.user.isAdmin && !req.user.isSuperAdmin)
                return res.render('error',{message:"Prístup zamietnutý"});
            try {
                let user = await User.findByIdAndUpdate(id, {$set: {isAdmin: true}}, {new: true});
                log.INFO("User " + user.username +" made admin by " + req.user.username);
                r.result = "ok";
            } catch(err) {
                log.WARN('Error making admin user '+id+" err="+err);
                r.error = err;
            }
            break;
        default:
            console.log('cmd=unknown');
            break;
    }
    res.json(r);
    res.end();

});

