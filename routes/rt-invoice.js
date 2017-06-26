"use strict";

const mongoose = require('mongoose');
const express = require('express');
const cel = require('connect-ensure-login');
const router = express.Router();
const email = require('../lib/email');
const log = require('../lib/logger');

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
    const cmd = req.query.cmd;
    console.log("/invoice - get");

    if (cmd)
        next();
    else
        res.render('invoice',{inv:req.invoice});

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
