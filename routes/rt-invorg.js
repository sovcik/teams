"use strict";

const debugLib = require('debug')('rt-invorg');
const mongoose = require('mongoose');
const express = require('express');
const cel = require('connect-ensure-login');
const router = express.Router();
const log = require('../lib/logger');
const libFmt = require('../lib/fmt');
const libInvoice = require('../lib/invoice');

const InvoicingOrg = mongoose.models.InvoicingOrg;
const Invoice = mongoose.models.Invoice;
const User = mongoose.models.User;

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
        let inv;
        try {
            // each invoicing org should have at least one invoice template
            inv = await Invoice.find({invoicingOrg: req.iorg.id, type:"T"});
        } catch (err) {
            log.WARN("Failed to find templates for iorg "+req.iorg.id+" err="+err);
        }

        if (inv.length < 1){
            console.log('Creating invoice template for INVORG ',req.iorg.id);
            await libInvoice.createTemplateInvoice(req.iorg.id);
        } else {
            console.log("TEMPLATES",inv);
        }

        res.render('invoicingOrg', {io: req.iorg, user: req.user, fmt:libFmt});
    }

});

router.get('/:id', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    const cmd = req.query.cmd;
    const debug = debugLib.extend('GET /id');
    debug('query %O',req.query);

    const r = {result:"error", status:200};
    switch (cmd){
        case 'getManagers':
            debug('Going to get list of invorg managers');

            try {
                if (req.iorg.managers.length == 0)
                    break;

                let u = await User.find({_id:{$in:req.iorg.managers}},{fullName:true, id:true});
                r.result = "ok";
                r.list = u;
            } catch (err) {
                r.error = {message:"error getting managers err=" + err};
            }
            break;

        default:
            debug('cmd=unknown');

    }
    res.json(r);
    res.end();

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

router.post('/:id', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    console.log("/invorg - post (ID)");

    console.log(req.body.cmd);
    const r = {result:"error", status:200};

    try {
        switch (req.body.cmd) {
            case "addManager":
                console.log('Going to add manager to an organization');

                if (!req.user.isAdmin && !req.user.isInvoicingOrgManager) {
                    log.WARN("addManager: Permission denied for user=" + req.user.username);
                    r.error = {message: "permission denied"};
                    break;
                }

                let u = await User.findOneActive({username: req.body.username});
                if (!u) throw new Error("User not found " + req.body.username);

                try {

                    let e = await InvoicingOrg.findOneAndUpdate({_id: req.iorg._id}, {$addToSet: {managers: u._id}});
                    if (!e) throw new Error("Failed to update organization=" + req.iorg._id);

                    r.result = "ok";
                    r.invorg = e;
                } catch (err) {
                    log.ERROR("Failed to save organization manager. err=" + err);
                }
                break;
            default:
                console.log('cmd=unknown');
                break;
        }
    } catch (err) {
        console.log(err);
        log.ERROR(err.message);
        r.error = {message:err.message};
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

                let i = InvoicingOrg(io);
                i = await i.save();
                if (i) {
                    console.log("invoicing org created", i.org.name, i.id);
                    r.result = "ok";
                }
                // create default invoice template for newly created invoicing org
                await libInvoice.createTemplateInvoice(i.id);

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