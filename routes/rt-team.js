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

        case 'getData':
            console.log('Going to get team details');
            const td = await dbTeam.getTeamDetails(req.user.id, teamId);
            r.result = 'ok';
            r.team = td;
            break;

        default:
            let t;
            if (cmd)
                console.log('cmd=unknown');

            try {
                t = await dbTeam.getTeamDetails(req.user.id, teamId);
            } catch (err) {
                console.log('team not found id=', teamId);
            }

            if (t) {
                //console.log("rendering team", t);
                //console.log("team event", t.registeredOn, t.eventName);
                return res.render('team', {team: t, user: {id: req.user.id, name: req.user.username}});
            } else {
                if (!cmd)
                    return res.render('error',{message:"Tím nebol nájdený", error:{status:''}});
            }
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
                let mt = await TeamUser.create({userId:m.id, teamId:req.body.teamId, role:'member'});
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
                let conf = await TeamUser.deleteOne({"userId":req.body.memberId, "teamId":req.body.teamId});
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