"use strict";

const mongoose = require('mongoose');
const express = require('express');
const cel = require('connect-ensure-login');
const router = express.Router();
const email = require('../lib/email');
const log = require('../lib/logger');
const libInvoice = require('../lib/invoice');
const libFmt = require('../lib/fmt');
const libPerm = require('../lib/permissions');

const Invoice = mongoose.models.Invoice;
const InvoicingOrg = mongoose.models.InvoicingOrg;
const Team = mongoose.models.Team;

module.exports = router;

router.param('id', async function (req, res, next){
    const invoiceId = req.params.id;
    let inv;
    // if user not logged in
    if (!req.user)
        req.user = {
            locales:"sk-SK"
        };

    try {
        inv = await Invoice.findById(invoiceId);
        req.invoice = inv;
        if (!inv)
            throw new Error("invoice not found");

        log.DEBUG("Invoice id="+req.invoice.id+" num="+req.invoice.number+" iorg="+req.invoice.invoicingOrg);

        try {

            const p = await libPerm.getUserInvoicePermissions(req.user.id, inv.id);
            req.user.permissions = p;
        } catch (err) {
            log.WARN("Failed fetching user permissions. err="+err.message);
        }

        next();
    } catch (err) {
        res.render('message',{title:"Faktúra nenájdná",error:{}});
    }

});


router.get('/:id', async function (req, res, next) {
    const siteUrl = req.protocol + '://' + req.get("host");
    console.log("SITE URL",siteUrl);
    const cmd = req.query.cmd;
    console.log("/invoice/ID - get");

    if (cmd)
        next();
    else {
        let i = await Team.populate(req.invoice,'team');
        res.render('invoice', {inv: req.invoice, siteUrl: siteUrl, user: req.user, fmt:libFmt} );
    }
});

router.get('/', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    const cmd = req.query.cmd;
    const teamId = req.query.teamId;
    const invType = req.query.type;
    const invOrg = req.query.invOrg;
    const isPaid = req.query.isPaid;
    console.log("/invoice - get (with CMD)");
    console.log(req.query);

    const r = {result:"error", status:200, error:{}};

    try {
        switch (cmd) {
            case 'getList':

                let q = {};
                if (teamId)  q.team = teamId;
                if (invType) q.type = invType;
                if (isPaid && isPaid != "A") q.paidOn = (isPaid == "N"?null:{$type:"date"});
                if (invOrg) q.invoicingOrg = invOrg;
                console.log('Going to get list of invoices',q);

                const l = await Invoice.find(q, {
                    team: true,
                    number: true,
                    type: true,
                    issuedOn: true,
                    dueOn: true,
                    paidOn: true,
                    taxInvoice: true,
                    billOrg: true,
                    billAdr: true,
                    total:true,
                    currency:true
                });
                r.result = "ok";
                r.list = l;
                r.user = req.user;
                break;

            default:
                console.log('cmd=unknown');
                r.error.message = "unknown command";
        }
    } catch (err) {
        r.error = {};
        r.error.message = err.message;
    }
    res.json(r);
    res.end();

});

router.get('/:id', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    const cmd = req.query.cmd;
    let team;
    console.log("/invoice/ID - get (CMD)");
    console.log(req.query);

    const r = {result:"error", status:200, error:{}};

    try {
        switch (cmd) {
            case 'reloadInvoiceData':
                console.log('Reloading invoice data');
                if (req.user.permissions.canWrite || req.user.permissions.isCoach ) {
                    team = await Team.findById(req.invoice.team);
                    req.invoice.billOrg = team.billingOrg;
                    req.invoice.billAdr = team.billingAdr;
                    req.invoice.billContact = team.billingContact;
                    await req.invoice.save();
                    log.INFO("INVOICE data reloaded: id=" + req.invoice.id + " no=" + req.invoice.number + " by user=" + req.user.username);
                    return res.redirect('/invoice/' + req.invoice.id);
                } else {
                    error.message="permission denied";
                }
                break;

            default:
                console.log('cmd=unknown');
                r.error.message = "unknown command";
        }
    } catch (err) {
        r.error = {};
        r.error.message = err.message;
    }
    res.json(r);
    res.end();

});

router.post('/', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    const cmd = req.body.cmd;
    const teamId = req.body.teamId;
    const invType = req.body.type;
    const eventId = req.body.eventId;
    console.log("/invoice - put");
    console.log(req.body);
    const r = {result:"error", status:200};
    try {
        switch (cmd) {
            case 'create':
                console.log('Going to create invoice');
                if (!req.user.permissions.isCoach
                    && !req.user.permissions.isInvoicingOrgManager
                    && !req.user.permissions.isAdmin) {
                    console.log("Invoice create - permission denied");
                    throw new Error("Permission denied");
                }

                try {
                    const inv = await libInvoice.createInvoice(teamId, eventId, invType);
                    r.result = "ok";
                    r.invoice = inv;
                    log.INFO("INVOICE created: id=" + inv.id + " no=" + inv.number + " by user=" + req.user.username);
                } catch (err) {
                    r.error = err;
                    log.WARN("Failed creating invoice. err="+err.message);
                }

                break;

            default:
                console.log("cmd=unknown");

        }
    } catch (err) {
        r.error = err;

    }
    res.json(r);
    res.end();

});

router.post('/:id', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    const siteUrl = req.protocol + '://' + req.get("host");
    console.log("/invoice - post (ID)");
    const invType = req.body.type;

    console.log(req.body);
    const r = {result:"error", status:200};

    try {
        switch (req.body.cmd) {
            case 'markAsPaid':
                try {
                    if (req.invoice.paidOn)
                        throw new Error("Invoice already paid.");
                    if (!req.user.permissions.isInvoicingOrgManager
                        && !req.user.permissions.isAdmin)
                        throw new Error("permission denied");

                    // if specified, use that date otherwise use current date
                    let dp = req.body.paidOn ? new Date(req.body.paidOn) : Date.now();
                    log.DEBUG('Going to set invoice as paid. no='+req.invoice.number+' id='+req.invoice.id+" date="+dp);

                    const i = await Invoice.findByIdAndUpdate(req.invoice.id, {$set: {paidOn: dp}}, {new:true});
                    if (i) {
                        log.INFO("INVOICE paid: no=" + i.number + " id=" + i.id + " by user=" + req.user.username);
                        r.result = "ok";
                        r.invoice = i;
                        email.sendInvoice(req.user,i,siteUrl);
                    }
                } catch (err) {
                    throw new Error("Failed marking invoice as paid. err=" + err.message);
                }
                break;
            case 'copyToNew':
                try {
                    if (!req.user.permissions.isInvoicingOrgManager
                        && !req.user.permissions.isCoach
                        && !req.user.permissions.isAdmin ) {
                        console.log("Invoice copy - permission denied");
                        throw new Error("permission denied");
                    }

                    console.log('Going to create new invoice from existing invoice',req.invoice.id);
                    const invNew = await libInvoice.copyInvoice(req.invoice.id, invType);
                    if (invNew) {
                        req.invoice.taxInvoice = invNew.id;
                        try {
                            req.invoice.save();
                        } catch (err) {
                            log.WARN("Failed to save tax invoice number "+invNew.id+" to invoice "+req.invoice.id);
                        }

                        r.result = "ok";
                        r.invoice = invNew;

                        log.INFO("INVOICE copied to " + invNew.id);
                        email.sendInvoice(req.user,invNew,siteUrl);
                    }
                } catch (err) {
                    throw new Error("Failed copying invoice "+req.invoice.id+" err="+err.message);
                }

                break;
            default:
                console.log('cmd=unknown');
                break;
        }
    } catch (err) {
        r.error = {};
        r.error.message = err.message;
    }
    res.json(r);
    res.end();


});



