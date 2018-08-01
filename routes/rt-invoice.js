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
            isAdmin: false,
            isInvoicingManager: false,
            locales:libFmt.defaultLocales
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

            console.log("PERM=",p);
            console.log("USER=",req.user);

        } catch (err) {
            log.WARN("Failed fetching user permissions. err="+err.message);
        }

        next();
    } catch (err) {
        res.render('message',{title:"Faktúra nenájdná",error:{}});
    }

});

router.get('/', async function (req, res, next) {
    console.log("/invoice/ - get");

    req.user.permissions = await libPerm.getUserInvoicePermissions(req.user.id, null);

    next();

});


router.get('/:id', async function (req, res, next) {
    const siteUrl = req.protocol + '://' + req.get("host");
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

        let p = await libPerm.getUserTeamPermissions(req.user.id, teamId);

        if (!p.isCoach
            && !p.isInvoicingOrgManager
            && !p.isAdmin) {
            throw new Error("Invoices query - Permission denied");
        }

        switch (cmd) {
            case 'getList':

                let q = {};
                if (teamId)  q.team = teamId;
                if (invType) q.type = invType;
                if (isPaid && isPaid != "A") q.paidOn = (isPaid == "N"?null:{$type:"date"});
                if (invOrg) q.invoicingOrg = invOrg;

                if (!p.isAdmin && !p.isInvoicingOrgManager) // exclude draft invoices for normal users
                    q.isDraft = false;

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
                    currency:true,
                    isDraft:true
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

        if (!req.user.permissions.isCoach
            && !req.user.permissions.isInvoicingOrgManager
            && !req.user.permissions.isAdmin) {
            throw new Error("Invoice query - Permission denied");
        }

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
    console.log("/invoice - post");
    console.log(req.body);
    const r = {result:"error", status:200};

    try {

        let p = await libPerm.getUserTeamPermissions(req.user.id, teamId);

        switch (cmd) {
            case 'create':
                console.log('Going to create invoice');

                if (!p.isCoach
                    && !p.isInvoicingOrgManager
                    && !p.isAdmin) {
                    throw new Error("Invoice create - Permission denied");
                }

                try {
                    let inv = await libInvoice.createInvoice(teamId, eventId, invType);
                    //inv = await libInvoice.confirmInvoice(inv._id);
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
        log.ERROR("INVOICE POST failed. "+err.message);
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

                    let i = await Invoice.findByIdAndUpdate(req.invoice.id, {$set: {paidOn: dp}}, {new:true});
                    i = await Team.populate(i,'team');
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
                    let invNew = await libInvoice.copyInvoice(req.invoice.id, invType);
                    invNew = await Team.populate(invNew,'team');
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
            case 'remove':
                try {
                    if (!req.user.permissions.isInvoicingOrgManager
                        && !req.user.permissions.isAdmin) {
                        log.WARN("Invoice remove - permission denied. user="+req.user.username+" invoice="+req.invoice._id);
                        throw new Error("permission denied");
                    }

                    let invId = req.invoice._id;
                    let d = await libInvoice.removeInvoice(invId);
                    if (d._id) {
                        log.INFO("Invoice removed: #" + d.number + " id=" + invId + " by user=" + req.user.username);

                        r.result = "ok";
                        r.invoice = d;
                    }

                } catch (err) {
                    throw new Error("Removing invoice "+req.invoice.id+" err="+err.message);
                }

                break;
            case 'addItem':
                try {
                    if (!req.user.permissions.isInvoicingOrgManager
                        && !req.user.permissions.isAdmin) {
                        log.WARN("Invoice add item - permission denied. user="+req.user.username+" invoice="+req.invoice._id);
                        throw new Error("permission denied");
                    }

                    if (!req.body.text || !req.body.value)
                        throw new Error("wrong post data");

                    let qty = parseInt(req.body.qty ? req.body.qty : 1);
                    let value = parseInt(req.body.value);

                    let maxLineNo = parseInt(req.body.itemNo ? req.body.itemNo : 0);
                    if (maxLineNo == 0) {
                        req.invoice.items.forEach(i => maxLineNo = maxLineNo < i.itemNo ? i.itemNo : maxLineNo);
                        maxLineNo++;
                    }

                    let itm = {
                        itemNo:maxLineNo,
                        text:req.body.text,
                        unit:req.body.unit ? req.body.unit : "",
                        qty:qty,
                        unitPrice:value,
                    };
                    if (req.body.note) itm.note = req.body.note;

                    console.log("ITEM=",itm);

                    req.invoice.items.push(itm);

                    req.invoice.updateTotal();

                    await req.invoice.save();
                    console.log('Invoice', req.invoice._id, "item added total=", req.invoice.total);
                    r.result = "ok";
                    r.invoice = req.invoice;

                } catch (err) {
                    log.WARN("Adding item to invoice="+req.invoice._id+" err="+err.message);
                    throw new Error("Adding item to invoice "+req.invoice.id+" err="+err.message);
                }

                break;
            case 'removeItem':
                try {
                    if (!req.user.permissions.isInvoicingOrgManager
                        && !req.user.permissions.isAdmin) {
                        log.WARN("Invoice remove item - permission denied. user="+req.user.username+" invoice="+req.invoice._id);
                        throw new Error("permission denied");
                    }

                    if (!req.body.itemNo)
                        throw new Error("wrong request");

                    let i = parseInt(req.body.itemNo);

                    let inv = await Invoice.findByIdAndUpdate(req.invoice._id, {$pull:{items:{itemNo:i}}}, { new: true });

                    console.log("HERE",inv);
                    inv.updateTotal();

                    await inv.save();
                    console.log('Invoice', inv._id, "item removed total=", inv.total);
                    r.result = "ok";
                    r.invoice = inv;

                } catch (err) {
                    log.WARN("Removing item from invoice="+req.invoice._id+" err="+err.message);
                    throw new Error("Removing item from invoice "+req.invoice.id+" err="+err.message);
                }

                break;

            case 'notifyOverdue':
                try {
                    if (!req.user.permissions.isInvoicingOrgManager
                        && !req.user.permissions.isAdmin) {
                        log.WARN("Invoice notify overdue - permission denied. user="+req.user.username+" invoice="+req.invoice._id);
                        throw new Error("permission denied");
                    }

                    let cSubj = "Faktúra po dátume splatnosti";
                    let cTitle = "Faktúra po dátume splatnosti";
                    let toEml = new Set();
                    let cReplyTo = process.env.EMAIL_REPLYTO_BILLING;
                    toEml.add(req.invoice.billContact.email);
                    toEml.add(req.invoice.issuingContact.email);
                    toEml.add(req.user.email);
                    toEml.add(process.env.EMAIL_BCC_INVOICE);

                    let cMsg =
                        "Dobrý deň,<br><br>chceli by sme vás poprosiť o pomoc pri spracovaní faktúry č.<a href='"+siteUrl+"/invoice/"+req.invoice._id+"'>"+req.invoice.number+"</a>.<br>"
                        + "Evidujeme ju ako neuhradenú. Faktúru si môžete pozrieť/vytlačiť kliknutím na nasledujúcu linku <br>"
                        + "<a href='"+siteUrl+"/invoice/"+req.invoice._id+"'>"+siteUrl+"/invoice/"+req.invoice._id+"</a><br>"
                        + "Pokiaľ ste úhradu vykonali, prosíme vás, aby ste nás kontaktovali a pomohli nám identifikovať chýbajúcu platbu.<br>"
                        + "V prípade, ak ste faktúru ešte neuhrádzali, prosíme vás kontakt a o pomoc pri riešení tejto situácie.<br><br>"
                        + "Ďakujeme za pochopenie.<br><br>"
                        + "Tím FLL Slovensko<br>"
                        + "faktury@fll.sk";

                    email.sendMessage(req.user, cReplyTo, toEml, cSubj, cTitle, cMsg, siteUrl);

                    r.result = "ok"

                } catch (err) {
                    throw new Error("Notify overdue invoice "+req.invoice.id+" err="+err.message);
                }
                break;
            case 'confirm':
                if (!req.user.permissions.isInvoicingOrgManager
                    && !req.user.permissions.isAdmin) {
                    throw new Error("Invoice confirm - Permission denied");
                }
                try {
                    log.DEBUG("RT:Confirming invoice inv=" + req.invoice.id);
                    let inv = await libInvoice.confirmInvoice(req.invoice.id);
                    r.result = "ok";
                    r.invoice = inv;
                    log.INFO("INVOICE confirmed. id="+inv._id+" no="+inv.number+" by user="+req.user.username);
                    email.sendInvoice(req.user,inv,siteUrl);
                } catch (err) {
                    r.error = err;
                    log.WARN("Failed confirming invoice. err="+err.message);
                }
                break;
            case 'renumber':
                if (!req.user.permissions.isInvoicingOrgManager
                    && !req.user.permissions.isAdmin) {
                    throw new Error("Invoice items renumber - Permission denied");
                }
                try {
                    log.DEBUG("Renumbering invoice items inv=" + req.invoice.id);
                    req.invoice.renumber();
                    await req.invoice.save();
                    r.result = "ok";
                    r.invoice = req.invoice;
                    log.INFO("INVOICE items renumbered. id="+req.invoice._id+" no="+req.invoice.number+" by user="+req.user.username);

                } catch (err) {
                    r.error = err;
                    log.WARN("Failed renumbering invoice items. err="+err.message);
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



