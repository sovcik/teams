"use strict";

const mongoose = require('mongoose');
const express = require('express');
const cel = require('connect-ensure-login');
const router = express.Router();
const email = require('../lib/email');
const log = require('../lib/logger');
const libInvoice = require('../lib/invoice');

const Invoice = mongoose.models.Invoice;
const InvoicingOrg = mongoose.models.InvoicingOrg;
const Team = mongoose.models.Team;

module.exports = router;

router.param('id', async function (req, res, next){
    const invoiceId = req.params.id;
    let inv;
    try {
        inv = await Invoice.findById(invoiceId);
        req.invoice = inv;
        if (!inv)
            throw new Error("invoice not found");

        log.DEBUG("Invoice id="+req.invoice.id+" num="+req.invoice.number+" iorg="+req.invoice.invoicingOrg);

        try {
            const iorg = await InvoicingOrg.findById(req.invoice.invoicingOrg);
            if (iorg)
                req.user.isInvoicingOrgManager = (iorg.managers.indexOf(req.user.id) >= 0);
            if (req.user.isInvoicingOrgManager)
                console.log("User is invoicing org manager");
        } catch (err) {
            log.WARN("Failed fetching invoicing org. err="+err);
        }

        next();
    } catch (err) {
        res.render('error',{message:"Faktúra nenájdná",error:{}});
    }

});


router.get('/:id', async function (req, res, next) {
    const siteUrl = req.protocol + '://' + req.get("host");
    console.log("SITE URL",siteUrl);
    const cmd = req.query.cmd;
    console.log("/invoice - get");

    if (cmd)
        next();
    else
        res.render('invoice',{inv:req.invoice, siteUrl:siteUrl});

});

router.get('/', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    const cmd = req.query.cmd;
    const teamId = req.query.teamId;
    const invType = req.query.type;
    console.log("/invoice - get (with CMD)");
    console.log(req.query);

    const r = {result:"error", status:200, error:{}};

    try {
        switch (cmd) {
            case 'getList':

                console.log('Going to get list of invoices');
                let q = {};
                if (teamId)  q.team = teamId;
                if (invType) q.type = invType;
                const l = await Invoice.find(q, {
                    team: true,
                    number: true,
                    type: true,
                    issuedOn: true,
                    dueOn: true,
                    paidOn: true,
                    taxInvoice: true
                });
                r.result = "ok";
                r.list = l;
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
    let inv, team;
    console.log("/invoice/ID - get (with CMD)");
    console.log(req.query);

    const r = {result:"error", status:200, error:{}};

    try {
        switch (cmd) {
            case 'reloadInvoiceData':
                console.log('Reloading invoice data');
                team = await Team.findById(req.invoice.team);
                req.invoice.billOrg = team.billingOrg;
                req.invoice.billAdr = team.billingAdr;
                req.invoice.billContact = team.billingContact;
                await req.invoice.save();
                return res.redirect('/invoice/'+req.invoice.id);
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
                if (!user.isAdmin) {
                    console.log("Invoice create - permission denied");
                    throw new Error("Permission denied");
                }

                console.log('Going to create invoice');
                const inv = await libInvoice.createInvoice(teamId, eventId, invType);
                r.result = "ok";
                r.invoice = inv;
                console.log("INVOICE created",inv.id);

                break;



            default:
                console.log("cmd=unknown");

        }
    } catch (err) {
        r.error = {};
        r.error.message = err.message;
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
                    if (!req.user.isAdmin && !req.user.isInvoicingOrgManager)
                        return res.render('error', {message: "Prístup zamietnutý"});

                    console.log('Going to set invoice as paid', req.invoice.id);
                    const i = await Invoice.findByIdAndUpdate(req.invoice.id, {$set: {paidOn: Date.now()}}, {new:true});
                    if (i) {
                        log.INFO("invoice set to paid " + i.number + " " + i.id + " by user=" + req.user.username);
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
                    if (!req.user.isAdmin && !req.user.isInvoicingOrgManager) {
                        console.log("Invoice copy - permission denied");
                        throw new Error("Permission denied");
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



