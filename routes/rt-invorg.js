"use strict";

const mongoose = require('mongoose');
const express = require('express');
const cel = require('connect-ensure-login');
const router = express.Router();
const log = require('../lib/logger');
const libFmt = require('../lib/fmt');

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
                req.user = {
                    isAdmin:false,
                    isInvoicingOrgManager:false,
                    locales:libFmt.defaultLocales
                };

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
        res.render('invoicingOrg', {io: req.iorg, user: req.user, fmt:libFmt});
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
                p = await InvoicingOrg.find({recordStatus: 'active'}, {org: true, adr: true}, {lean:1});
                p.forEach(function(e){e.name = e.org.name}); // add name field so result can be used in generic LoadList method
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

router.post('/:id/fields', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    console.log("/invorg/:ID/fields - post");
    console.log(req.body);
    const r = {result:"error", status:200};

    // no modifications allowed unless user is invoicing org manager or admin
    if (!req.user.isAdmin && !req.user.isInvoicingOrgManager){
        r.error = {};
        r.error.message = "permission denied";
        res.json(r);
        res.end();
        return;
    }

    try {
        if (req.body.name) {
            let t = await InvoicingOrg.findById(req.body.pk);
            let na = req.body.name.split('.'); // split name
            if (t) {
                switch (na.length){
                    case 1:
                        t[na[0]] = req.body.value;
                        break;
                    case 2:
                        t[na[0]][na[1]] = req.body.value;
                        break;
                    case 3:
                        t[na[0]][na[1]][na[2]] = req.body.value;
                        break;
                }

                let verr = t.validateSync();
                if (!verr) {
                    await t.save();
                    r.result = "ok";
                } else
                    r.error = {message:"Chyba: "+verr};
            } else {
                r.error = {message:"InvOrg nenájdená id="+req.body.pk};
            }
        }

    } catch (err) {
        r.error = {message:err.message};
        log.ERROR("Error rt-team post. err="+err.message);
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
                console.log('Going to create invoicing org ');

                const io = {};
                io.org = {};
                io.org.name = req.body.name?req.body.name:"IOName";

                io.adr = {};

                io.contact = {};

                io.invNumPrefix = "INV";
                io.nextInvNumber = 1;
                io.ntInvNumPrefix = "NT";
                io.nextNTInvNumber = 1;
                io.dueDays = 14;

                let i = InvoicingOrg(io);
                i = await i.save();
                if (i) {
                    console.log("invoicing org created", i.org.name, i.id);
                    r.result = "ok";
                }
            } catch (err) {
                r.error = {};
                r.error.message = err.message;
                log.ERROR("rt-invorg POST:"+err.message);
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