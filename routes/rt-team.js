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
        //const r = await Team.findById(id);
        const r = await dbTeam.getTeamDetails(req.user, id);
        req.team = r;

        if (r) {
            console.log("Team id=", r.id, " name=", r.name);

            if (req.user) {
                let q = {teamId: req.team.id, userId: req.user.id, role: 'coach'};
                let tu = await TeamUser.findOne(q);
                if (tu) {
                    console.log('User is team coach');
                    req.user.isCoach = true;
                }
            }

        } else {
            console.log('team not found ',id);
            throw new Error("team not found");
        }
        next();
    } catch (err) {
        res.render('error',{message:"Tím nenájdený",error:{status:err.message}});
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
    switch (cmd){
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
    res.json(r);
    res.end();

});

router.post('/:id', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    console.log("/team - post");
    console.log(req.body);
    const r = {result:"error", status:200};

    // no modifications allowed unless user is team coach or admin
    if (!req.user.isAdmin && !req.user.isCoach){
        r.error = {};
        r.error.message = "permission denied";
        res.json(r);
        res.end();
        return;
    }

    switch (req.body.cmd){

        case 'saveAdrDetails':
            console.log('Going to save team address details');
            try {
                let doc = {};
                let data = JSON.parse(req.body.data);
                switch(req.body.type){
                    case 'billing':
                        doc.billingContact = {};
                        doc.billingAdr = {};
                        doc.billingOrg = {};
                        formatTeamDoc(data, doc.billingOrg, doc.billingAdr, doc.billingContact);
                        break;
                    case 'shipping':
                        doc.shippingContact = {};
                        doc.shippingAdr = {};
                        doc.shippingOrg = {};
                        formatTeamDoc(data, doc.shippingOrg, doc.shippingAdr, doc.shippingContact);
                        break;
                }
                console.log("DOCUMENT",doc);
                const nd = await dbTeam.saveTeamDetails(req.user, req.team.id, doc);
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
                let mt = await TeamUser.create({userId:m.id, teamId:req.team.id, role:'member'});
                r.result = "ok";
                r.memberId = m.id;

            } catch (err) {
                r.message = err.message;
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

function formatTeamDoc(data, org, adr, con){
    console.log("Formatting team document from posted data");
    console.log("DATA",data);
    org.name = data.orgName;
    org.companyNo = data.compNo;
    org.taxNo = data.taxNo;

    adr.addrLine1 = data.addr1;
    adr.addrLine2 = data.addr2;
    adr.city = data.city;
    adr.postCode = data.postCode;

    con.name = data.conName;
    con.phone = data.conPhone;
    con.email = data.conEmail;
}