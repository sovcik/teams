"use strict";

const mongoose = require('mongoose');
const express = require('express');
const cel = require('connect-ensure-login');
const router = express.Router();
const email = require('../lib/email');
const log = require('../lib/logger');
const libInvoice = require('../lib/invoice');

const Invoice = mongoose.models.Invoice;
const Team = mongoose.models.Team;

module.exports = router;

router.param('invoiceId', async function (req, res, next){
    const invoiceId = req.params.invoiceId;
    let inv;
    try {
        inv = await Invoice.findById(invoiceId);
        req.invoice = inv;
        if (inv)
            console.log("Invoice id=",invoiceId," num=",inv.number);
        else
            throw new Error("invoice not found");
        next();
    } catch (err) {
        res.render('error',{message:"Faktúra nenájdná",error:{}});
    }

});


router.get('/:invoiceId', async function (req, res, next) {
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
                    paidOn: true
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

router.get('/:invoiceId', cel.ensureLoggedIn('/login'), async function (req, res, next) {
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
                if (!isAdmin) {
                    console.log("Invoice create - permission denied");
                    throw new Error("Permission denied");
                }

                console.log('Going to create invoice');
                const inv = await libInvoice.createInvoice(teamId, eventId, invType);
                r.result = "ok";
                r.invoice = inv;
                console.log("INVOICE created",inv.id);

                break;

            case 'copyNew':
                if (!isAdmin) {
                    console.log("Invoice copy - permission denied");
                    throw new Error("Permission denied");
                }

                console.log('Going to create new invoice from existing invoice');
                const invNew = await libInvoice.copyInvoice(req.query.fromInv, invType);
                r.result = "ok";
                r.invoice = invNew;
                console.log("INVOICE copied to",invNew.id);

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


