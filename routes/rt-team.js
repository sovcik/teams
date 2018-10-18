'use strict';

const log = require('../lib/logger');
const express = require('express');
const router = express.Router();
const cel = require('connect-ensure-login');
const mongoose = require('mongoose');

const dbTeam = require('../lib/db/Team');
const libPerm = require('../lib/permissions');
const fmtLib = require('../lib/fmt');

const Team = mongoose.model('Team');
const User = mongoose.model('User');
const Event = mongoose.model('Event');
const TeamUser = mongoose.model('TeamUser');
const TeamEvent = mongoose.model('TeamEvent');
const Invoice = mongoose.model('Invoice');

module.exports = router;

router.param('id', async function (req, res, next){
    const id = req.params.id;

    console.log("Team id=",id);
    try {
        if (!req.user)
            req.user = {id:'999999999999999999999990'};

        let r = await Team.findById(id);

        if (r) {
            req.user.permissions = await libPerm.getUserTeamPermissions(req.user.id, r.id);

            /*
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
            */

            //console.log("FFFF", req.user, id);
            r = await dbTeam.getTeamDetails(req.user.id, id);

            req.team = r;

        } else {
            console.log('team not found ',id);
            throw new Error("team not found");
        }
        next();
    } catch (err) {
        log.ERROR(err.message);
        console.log(err.stack);
        res.render('message',{title:"Tím nenájdený",error:{status:err.message}});
    }

});

router.get('/', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    const cmd = req.query.cmd;
    console.log("/team - get");
    console.log(req.query);

    var r = {result:"error", status:200};
    try {
        switch (cmd) {
            case 'getList':
                let act = req.query.active;
                log.DEBUG('Going to get list of teams');
                let q = {};
                if (act == "yes") {
                    q.recordStatus = 'active';
                    log.DEBUG('Sending only ACTIVE teams');
                }
                if (act == "no") {
                    q.recordStatus = 'inactive';
                    log.DEBUG('Sending only INACTIVE teams');
                }

                const tc = await Team.find(q,{name:1, foundingOrg:1, foundingAdr:1});
                r.result = "ok";
                r.list = tc;
                break;

            default:
                console.log('cmd=unknown');

        }
    } catch(err) {
        r.error = {message:err.message};
        log.ERROR(err.message);
    }
    res.json(r);
    res.end();

});

router.get('/:id', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    const cmd = req.query.cmd;
    console.log("/team/:id - get");

    if (cmd)
        next();
    else
        return res.render('team', {team: req.team, user: req.user, fmt:fmtLib});

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
        log.ERROR("Error rt-team get/:id err="+err.message);
    }
    res.json(r);
    res.end();

});

router.post('/:id/fields', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    console.log("/team/:ID/fields - post");
    console.log(req.body);
    const r = {result:"error", status:200};

    // no modifications allowed unless user is team coach or admin
    if (!req.user.permissions.isAdmin && !req.user.permissions.isCoach){
        r.error = {};
        r.error.message = "permission denied";
        res.json(r);
        res.end();
        return;
    }

    try {
        if (req.body.name) {
            let t = await Team.findById(req.body.pk);
            if (t) {
                t[req.body.name] = req.body.value;
                let verr = t.validateSync();
                if (!verr) {
                    await t.save();
                    r.result = "ok";
                } else
                    r.error = {message:"Chyba: "+verr};
            } else {
                r.error = {message:"Tím nenájdený id="+req.body.pk};
            }
        }

    } catch (err) {
        r.error = {message:err.message};
        log.ERROR("Error rt-team post. err="+err.message);
    }

    res.json(r);
    res.end();

});

router.post('/:id', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    console.log("/team/ID - post");
    console.log(req.body);
    const r = {result:"error", status:200};

    // no modifications allowed unless user is team coach or admin
    if (!req.user.permissions.isAdmin && !req.user.permissions.isCoach){
        r.error = {message:"permission denied"};
        res.json(r);
        res.end();
        return;
    }

    if (!req.user.permissions.isAdmin && req.team.recordStatus !== 'active'){
        r.error = {message:"inactive record"};
        res.json(r);
        res.end();
        return;
    }

    switch (req.body.cmd){
        case 'saveAdrDetails':
            log.DEBUG('Going to save team address details');
            try {
                let doc = JSON.parse(req.body.data);
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
                let dob = new Date(req.body.dob);
                dob.setHours(dob.getHours()+12); // Todo: adjust for user's timezone - right now noon should do for Europe/US

                let m = await User.create({fullName:req.body.name, email:req.body.email, dateOfBirth:dob, username:req.body.name+req.team.id});
                if (!m)
                    throw new Error("Failed creating team member");
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
                        name:teamName
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
        case 'remove':
            console.log('Going to remove team', req.body.teamId);
            try{
                let t = await Team.findById(req.body.teamId);
                if (!t)
                    throw new Error("Team not found");

                let te = await TeamEvent.find({teamId:t._id});
                if (te) {
                    // now check if any of events team is registered for is active
                    te = await Event.populate(te,"eventId");
                    let eact = te.length > 0;
                    let td = new Date();
                    td.setHours(0,0,0,0);
                    for (let i=0; i<te.length && eact; i++)
                        eact = te[i].eventId.endDate >= td;

                    if (eact)
                        throw new Error("One of events team is registered for is active.");

                    // check if there are any unpaid invoices related to this team
                    let inv = await Invoice.find({team:t._id});
                    if (inv){
                        let pd = true;
                        td = new Date(1900,0,1);
                        for (let i=0; i< inv.length && pd; i++)
                            pd = inv[i].paidOn > td;

                        if (!pd)
                            throw new Error("One of invoices is not paid.");
                    }

                }

                if (t.recordStatus == 'active') {
                    t.deactivate();
                    await t.save();
                }

                console.log("Team",t._id,"removed");
                r.result = "ok";

                //todo: notify coaches

            } catch(err) {
                r.error = {message:err.message};
                console.log(err.message);
                log.ERROR("rt-team POST:"+err.message);
            }
            break;

        case 'restore':
            console.log('Going to restore team', req.body.teamId);
            try{
                let t = await Team.findById(req.body.teamId);
                if (!t)
                    throw new Error("Team not found");

                if (t.recordStatus == 'inactive') {
                    t.activate();
                    await t.save();
                }

                console.log("Team",t._id,"restored");
                r.result = "ok";

                //todo: notify coaches

            } catch(err) {
                r.error = {message:err.message};
                console.log(err.message);
                log.ERROR("rt-team POST:"+err.message);
            }
            break;


        default:
            console.log('cmd=unknown');
            break;
    }
    res.json(r);
    res.end();

});


