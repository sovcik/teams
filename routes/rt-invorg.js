"use strict";

const mongoose = require('mongoose');
const express = require('express');
const cel = require('connect-ensure-login');
const router = express.Router();

const InvoicingOrg = mongoose.models.InvoicingOrg;

module.exports = router;

router.get('/', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    const cmd = req.query.cmd;
    console.log("/invorg - get");
    console.log(req.query);
    const r = {result:"error", status:200};
    switch (cmd){
        case 'getList':
            console.log('Going to get list of invoicing orgs');
            const p = await InvoicingOrg.find({ recordStatus: 'active' },{org:true, adr:true});
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
    console.log("/invorg - post");
    console.log("User role=",req.user.role);

    console.log(req.body);
    const r = {result:"error", status:200};

    switch (req.body.cmd){
        case 'create':
            if (req.user.role != 'A')
                return res.redirect('/profile');
            try {
                let data = JSON.parse(req.body.data);
                let ioId = req.body.invOrgId;
                console.log('Going to create invoicing org ', data.orgName);

                const io = {};
                io.org = {};
                io.org.name = data.orgName;
                io.org.companyNo = data.compNo;
                io.org.taxNo = data.taxNo;

                io.adr = {};
                io.adr.addrLine1 = data.adr1;
                io.adr.addrLine2 = data.adr2;
                io.adr.city = data.city;
                io.adr.postCode = data.postCode;

                io.contact = {};
                io.contact.name = data.conName;
                io.contact.phone = data.conPhone;
                io.contact.email = data.conEmail;

                let i = InvoicingOrg(io);
                i = await i.save();
                if (i) {
                    console.log("invoicing org created", i.org.name, i.id);
                    r.result = "ok";
                }
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