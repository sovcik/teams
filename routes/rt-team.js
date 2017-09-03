'use strict';

const log = require('../lib/logger');
const express = require('express');
const router = express.Router();
const cel = require('connect-ensure-login');
const mongoose = require('mongoose');

const dbTeam = require('../lib/db/Team');

const Team = mongoose.model('Team');
const User = mongoose.model('User');
const TeamUser = mongoose.model('TeamUser');

module.exports = router;

router.param('id', async function (req, res, next){
    const id = req.params.id;

    console.log("Team id=",id);
    try {
        let r = await Team.findById(id);

        if (r) {
            console.log("Team id=", r.id, " name=", r.name);

            if (req.user) {
                let q = {teamId: id, userId: req.user.id, role: 'coach'};
                let tu = await TeamUser.findOne(q);
                if (tu) {
                    console.log('User is team coach');
                    req.user.isCoach = true;
                }
            } else {
                req.user = {isCoach:false};
            }

            r = await dbTeam.getTeamDetails(req.user, id);
            req.team = r;

        } else {
            console.log('team not found ',id);
            throw new Error("team not found");
        }
        next();
    } catch (err) {
        res.render('message',{title:"Tím nenájdený",error:{status:err.message}});
    }

});

router.get('/:id', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    const cmd = req.query.cmd;
    console.log("/team/:id - get");

    if (cmd)
        next();
    else
        return res.render('team', {team: req.team, user: req.user});

});

router.get('/:id',cel.ensureLoggedIn('/login'), async function (req, res, next) {

    const cmd = req.query.cmd;

    console.log("/team/:id - get (CMD)");
    console.log(req.query);

    var r = {result:"error", status:200};
    try {
        switch (cmd) {
            case 'getTeamCoaches':
                console.log('Going to get team coaches');
                const tc = await dbTeam.getTeamCoaches(req.user, req.team.id);
                r.result = "ok";
                r.list = tc;
                break;

            case 'getTeamMembers':
                console.log('Going to get team members');
                const tm = await dbTeam.getTeamMembers(req.user, req.team.id);
                r.result = "ok";
                r.list = tm;
                break;

            case 'getAdrDetails':
                console.log('Going to get team address details');
                //const tad = await dbTeam.getTeamDetails(req.user, req.team.id, req);
                r.result = "ok";
                r.details = req.team;
                break;

            case 'getData':
                console.log('Going to get team details');
                //const td = await dbTeam.getTeamDetails(req.user, req.team.id, req);
                r.result = 'ok';
                r.team = req.team;
                break;

            default:
                console.log('cmd=unknown');

        }
    } catch(err) {
        r.error = {message:err.message};
        log.ERROR(err);
    }
    res.json(r);
    res.end();

});

router.post('/:id', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    console.log("/team/ID - post");
    console.log(req.body);
    const r = {result:"error", status:200};

    // no modifications allowed unless user is team coach or admin
    if (!req.user.isAdmin && !req.user.isCoach){
        r.error = {message:"permission denied"};
        res.json(r);
        res.end();
        return;
    }

    switch (req.body.cmd){

        case 'saveAdrDetails':
            console.log('Going to save team address details');
            try {
                let doc = JSON.parse(req.body.data);
                console.log("DOCUMENT",doc);
                const nd = await dbTeam.saveTeamDetails(req.user, req.team.id, doc);
                r.result = "ok";
            } catch (err) {
                r.error = {message:err.message};
                console.log(err);
            }
            break;

        case 'createTeamMember':
            let memberName = req.body.name;
            console.log('Going to create member: ', memberName);
            try {

                let m = await User.create({fullName:req.body.name, email:req.body.email, dateOfBirth:req.body.dob});
                console.log("Member created", m.fullName, m.id);
                let mt = await TeamUser.create({userId:m.id, teamId:req.team.id, role:'member'});
                r.result = "ok";
                r.memberId = m.id;

            } catch (err) {
                r.error = {message:err.message};
                console.log(err);
            }
            break;
        case 'removeTeamMember':
            console.log('Going to remove member: ', req.body.memberId, "from team", req.team.id);
            try{
                let conf = await TeamUser.deleteOne({"userId":req.body.memberId, "teamId":req.team.id});
                if (conf.deletedCount > 0) {
                    console.log('Member removed', req.body.memberId);
                    r.result = "ok"
                }
            } catch(err) {
                r.error = {message:err.message};
                console.log(err);
            }
            break;
        case "addCoach":
            console.log('Going to add coach to team',req.team.id);

            try {
                let u = await User.findOneActive({username:req.body.username});
                if (!u) throw new Error("User not found '"+req.body.username+"'");

                let tu = await TeamUser.findOne({userId:u.id, teamId:req.team.id, role:'coach'});
                if (tu) throw new Error("User '"+u.username+"' is already coaching team '"+req.team.name+"'");

                tu = await TeamUser.create({userId:u.id, teamId:req.team.id, role:'coach'});
                if (!tu) throw new Error("Failed to add team coach for team="+req.team._id);

                r.result = "ok";
                r.teamuser = tu;
            } catch (err) {
                r.error = {message:err.message};
                log.ERROR("Failed adding team coach. err="+err);
            }
            break;
        case 'removeCoach':
            console.log('Going to remove coach: ', req.body.coachId, "from team", req.team.id);
            try{
                if (req.body.coachId == req.user._id)
                    throw new Error("User can't remove himself");
                let cc = await TeamUser.count({teamId:req.team.id, role:'coach'});
                if (cc <= 1)
                    throw new Error("At least one coach is required per team");
                let conf = await TeamUser.deleteOne({"userId":req.body.coachId, "teamId":req.team.id});
                if (conf.deletedCount > 0) {
                    console.log('Coach removed', req.body.coachId);
                    r.result = "ok"
                }
            } catch(err) {
                r.error = {message:err.message};
                console.log(err.message);
            }
            break;

        default:
            console.log('cmd=unknown');
            break;
    }
    res.json(r);
    res.end();

});

router.post('/', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    console.log("/team - post");
    console.log(req.body);
    const r = {result:"error", status:200};

    /*
    // no modifications allowed unless user is team coach or admin
    if (!req.user.isAdmin && !req.user.isCoach){
        r.error = {};
        r.error.message = "permission denied";
        res.json(r);
        res.end();
        return;
    }
    */

    switch (req.body.cmd){
        case 'create':
            // permissions for creating a team are not tested as every user can create team

            let teamName = req.body.name;
            console.log('Going to create team: ', teamName);
            try {
                let t = await Team.findOneActive({name:teamName});
                if (t) {
                    r.message = 'Duplicate team name';
                } else {
                    let c = await User.findOneActive({_id:req.body.coach});
                    if (!c) throw new Error("coach not found id="+req.body.coach);

                    t = await Team.create({
                        name:teamName,
                        programId:req.body.programId
                    });
                    console.log("Team created", t.name, t.id);
                    let ut = await TeamUser.create({userId:c.id, teamId:t.id, role:'coach'});
                    r.result = "ok";
                    t.teamId = t.id;
                }
            } catch (err) {
                r.error = {message:err.message};
                log.WARN("Failed creating team for coach "+id+". err="+err);
            }
            break;

        default:
            console.log('cmd=unknown');
            break;
    }
    res.json(r);
    res.end();

});


