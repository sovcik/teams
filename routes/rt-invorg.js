"use strict";

const mongoose = require('mongoose');
const express = require('express');
const cel = require('connect-ensure-login');
const router = express.Router();
const log = require('../lib/logger');

const InvoicingOrg = mongoose.models.InvoicingOrg;
const Invoice = mongoose.models.Invoice;

module.exports = router;

router.param('id', async function (req, res, next){
    const id = req.params.id;
    let r;
    console.log("Invoicing org id",id);
    try {
        r = await InvoicingOrg.findById(id);
        req.iorg = r;
        if (r) {
            if (req.user)
                req.user.isInvoicingOrgManager = (req.iorg.managers.indexOf(req.user.id) >= 0);
            else
                req.user = {isInvoicingOrgManager:false};

            console.log("Invoicing org id=", r.id, " name=", r.org.name);

        } else
            throw new Error("invoicing org not found");
        next();
    } catch (err) {
        res.render('message',{title:"Fakturujúca organizácia nenájdená",error:{status:err.message}});
    }

});

router.get('/:id', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    const cmd = req.query.cmd;
    console.log("/invorg - get");

    if (cmd)
        next();
    else {
        req.iorg.invoices = [];
        let inv;
        try {
            inv = await Invoice.find({invoicingOrg: req.iorg.id});
        } catch (err) {
            log.WARN("Failed to fetch invoices for iorg "+req.iorg.id+" err="+err);
        }
        if (inv)
            req.iorg.invoices = inv;
        res.render('invoicingOrg', {io: req.iorg, user: req.user});
    }

});


router.get('/', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    const cmd = req.query.cmd;
    console.log("/invorg - get");
    console.log(req.query);
    const r = {result:"error", status:200};
    switch (cmd){
        case 'getList':
            console.log('Going to get list of invoicing orgs');
            let p;
            try {
                p = await InvoicingOrg.find({recordStatus: 'active'}, {org: true, adr: true});
            } catch (err) {
                log.WARN("Failed fetching list of invoicing orgs");
            }
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

    console.log(req.body);
    const r = {result:"error", status:200};

    switch (req.body.cmd){
        case 'create':
            if (!req.user.isAdmin)
                return res.render('message',{title:"Prístup zamietnutý"});
            try {
                let data = JSON.parse(req.body.data);
                let ioId = req.body.invOrgId;
                console.log('Going to create invoicing org ', data.orgName);

                const io = {};
                io.org = {};
                io.org.name = data.orgName;
                io.org.companyNo = data.compNo;
                io.org.taxNo = data.taxNo;
                io.org.VATNo = data.VATNo;
                io.org.bankAccount = data.bankAccount;
                io.org.bankSWIFT = data.bankSWIFT;

                io.adr = {};
                io.adr.addrLine1 = data.adr1;
                io.adr.addrLine2 = data.adr2;
                io.adr.city = data.city;
                io.adr.postCode = data.postCode;

                io.contact = {};
                io.contact.name = data.conName;
                io.contact.phone = data.conPhone;
                io.contact.email = data.conEmail;

                io.invNumPrefix = data.invNumPrefix;
                io.nextInvNumber = data.nextInvNumber;
                io.ntInvNumPrefix = data.ntInvNumPrefix;
                io.nextNTInvNumber = data.nextNTInvNumber;
                io.dueDays = data.dueDays;

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