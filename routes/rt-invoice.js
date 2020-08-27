/* eslint-disable no-unused-vars */
/* eslint-disable no-async-promise-executor */

'use strict';

const mongoose = require('mongoose');
const express = require('express');
const cel = require('connect-ensure-login');
const router = express.Router();
const email = require('../lib/email');

const libInvoice = require('../lib/invoice');
const libFmt = require('../lib/fmt');
const libPerm = require('../lib/permissions');

const debugLib = require('debug')('rt-invoice');
const logERR = require('debug')('ERROR:rt-invoice');
const logWARN = require('debug')('WARN:rt-invoice');
const logINFO = require('debug')('INFO:rt-invoice');

const Invoice = mongoose.models.Invoice;
const InvoicingOrg = mongoose.models.InvoicingOrg;
const Team = mongoose.models.Team;

module.exports = router;

router.param('id', async function (req, res, next) {
    const debug = debugLib.extend('param');
    const invoiceId = req.params.id;
    let inv;
    const reqq = req;
    // if user not logged in
    if (!reqq.user)
        reqq.user = {
            isAdmin: false,
            isInvoicingManager: false,
            locales: libFmt.defaultLocales,
        };

    try {
        inv = await Invoice.findById(invoiceId, {}, { lean: false });
        reqq.invoice = inv;
        if (!inv) throw new Error('invoice not found');

        debug(
            'Invoice id=%s num=%s iorg=%s',
            reqq.invoice.id,
            reqq.invoice.number,
            reqq.invoice.invoicingOrg
        );

        try {
            const p = await libPerm.getUserInvoicePermissions(reqq.user.id, inv.id);
            reqq.user.permissions = p;

            //console.log("PERM=",p);
            //console.log("USER=",req.user);
        } catch (err) {
            logWARN('Failed fetching user permissions. err=%s', err.message);
        }

        next();
    } catch (err) {
        res.render('message', { title: 'Faktúra nenájdná', error: {} });
    }
});

router.get('/', async function (req, res, next) {
    const debug = debugLib.extend('get/');
    debug('/invoice/ - get');

    if (req.user) req.user.permissions = await libPerm.getUserInvoicePermissions(req.user.id, null);

    next();
});

router.get('/:id', async function (req, res, next) {
    const siteUrl = req.protocol + '://' + req.get('host');
    const cmd = req.query.cmd;

    const debug = debugLib.extend('get/id');
    debug('/invoice/ID - get');

    if (cmd) next();
    else {
        let i = await Team.populate(req.invoice, 'team');
        //console.log("INV=",req.invoice);
        res.render('invoice', {
            inv: req.invoice,
            siteUrl: siteUrl,
            user: req.user,
            fmt: libFmt,
            PageTitle:
                (req.invoice.isDraft ? 'Draft ' : '') +
                req.invoice.number +
                ' (' +
                (!req.invoice.team ? '---' : req.invoice.team.name) +
                ')',
        });
    }
});

router.get('/:id/view', async function (req, res, next) {
    const siteUrl = req.protocol + '://' + req.get('host');
    const cmd = req.query.cmd;

    const debug = debugLib.extend('get/id/view');
    debug('/invoice/ID/view - get');

    if (cmd) next();
    else {
        let i = await Team.populate(req.invoice, 'team');
        res.render('invoice', {
            inv: req.invoice,
            siteUrl: siteUrl,
            user: req.user,
            fmt: libFmt,
            PageTitle:
                (req.invoice.isDraft ? 'Draft ' : '') +
                req.invoice.number +
                ' (' +
                (!req.invoice.team ? '---' : req.invoice.team.name) +
                ')',
        });
    }
});

router.get('/:id/edit', async function (req, res, next) {
    const siteUrl = req.protocol + '://' + req.get('host');
    const cmd = req.query.cmd;

    const debug = debugLib.extend('get/id/edit');
    debug('/invoice/ID/edit - get');

    if (cmd) next();
    else {
        let i = await Team.populate(req.invoice, 'team');
        res.render('invoice-edit', {
            inv: req.invoice,
            siteUrl: siteUrl,
            user: req.user,
            fmt: libFmt,
            PageTitle:
                (req.invoice.isDraft ? 'Draft ' : '') +
                req.invoice.number +
                ' (' +
                (!req.invoice.team ? '---' : req.invoice.team.name) +
                ')',
        });
    }
});

router.get('/', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    const cmd = req.query.cmd;
    const teamId = req.query.teamId;
    const invType = req.query.type;
    const invOrg = req.query.invOrg;
    const invYear = req.query.year;
    const isPaid = req.query.isPaid;
    const userId = req.user.id;

    const debug = debugLib.extend('get+cmd/');
    debug('/invoice/ - get+CMD');
    debug('%O', req.query);

    const r = { result: 'error', status: 200, error: {} };

    try {
        let p = await libPerm.getUserPermissions(userId, teamId, null, invOrg);

        if (!(p.isCoach && teamId) && !p.isInvoicingOrgManager && !p.isAdmin) {
            throw new Error('Invoices query - Permission denied');
        }

        switch (cmd) {
            case 'getList':
                // eslint-disable-next-line no-case-declarations
                let q = {};
                if (teamId) q.team = teamId;
                if (invType) q.type = invType;
                if (isPaid && isPaid != 'A') q.paidOn = isPaid == 'N' ? null : { $type: 'date' };
                if (invOrg) q.invoicingOrg = invOrg;
                if (invYear)
                    q.issuedOn = {
                        $gte: invYear + '-01-01T00:00:00',
                        $lte: invYear + '-12-31T23:59:59',
                    };

                if (!p.isAdmin && !p.isInvoicingOrgManager)
                    // exclude draft invoices for normal users
                    q.isDraft = false;

                debug('Going to get list of invoices %s', q);

                // eslint-disable-next-line no-case-declarations
                const l = await Invoice.find(
                    q,
                    {
                        team: true,
                        number: true,
                        name: true,
                        type: true,
                        issuedOn: true,
                        dueOn: true,
                        paidOn: true,
                        taxInvoice: true,
                        billOrg: true,
                        billAdr: true,
                        total: true,
                        currency: true,
                        isDraft: true,
                    },
                    {
                        sort: {
                            issuedOn: -1,
                            number: -1,
                        },
                    }
                );
                r.result = 'ok';
                r.list = l;
                r.user = req.user;
                break;

            default:
                debug('cmd=unknown');
                r.error.message = 'unknown command';
        }
    } catch (err) {
        r.error = {};
        r.error.message = err.message;
        logERR('rt-inv GET cmd err=%s', err.message);
    }
    res.json(r);
    res.end();
});

router.get('/:id', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    const cmd = req.query.cmd;
    let team;

    const debug = debugLib.extend('get+cmd/id');
    debug('/invoice/ID - get (CMD)');
    debug('%O', req.query);

    const r = { result: 'error', status: 200, error: {} };

    try {
        if (
            !req.user.permissions.isCoach &&
            !req.user.permissions.isInvoicingOrgManager &&
            !req.user.permissions.isAdmin
        ) {
            throw new Error('Invoice query - Permission denied');
        }

        switch (cmd) {
            default:
                debug('cmd=unknown');
                r.error.message = 'unknown command';
        }
    } catch (err) {
        r.error = {};
        r.error.message = err.message;
        logERR('rt-inv GET cmd err=%s', err.message);
    }
    res.json(r);
    res.end();
});

router.post('/', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    const cmd = req.body.cmd;

    const debug = debugLib.extend('post/');
    debug('/invoice - post');
    debug('%O', req.body);

    const r = { result: 'error', status: 200 };

    const invOrgId = req.body.invOrgId;
    const invType = req.body.type;
    const teamId = req.body.teamId;

    let p = await libPerm.getUserPermissions(req.user.id, teamId, null, invOrgId);

    try {
        switch (cmd) {
            case 'create':
                debug('Going to create invoice');
                if (!p.isAdmin && !p.isInvoicingOrgManager) {
                    r.error = {};
                    r.error.message = 'permission denied';
                    res.json(r);
                    res.end();
                    return;
                }

                try {
                    let inv;
                    if (teamId) {
                        inv = await libInvoice.createTeamInvoice(invOrgId, invType, teamId);
                    }

                    r.result = 'ok';
                    r.invoice = inv;
                    logINFO(
                        'INVOICE created: id=%s no=%s by user=%s',
                        inv.id,
                        inv.number,
                        req.user.username
                    );
                } catch (err) {
                    r.error = err;
                    logWARN('Failed creating invoice. err=%s', err.message);
                }

                break;

            default:
                debug('cmd=unknown');
        }
    } catch (err) {
        r.error = err;
        logERR('INVOICE POST failed err=%s', err.message);
    }
    res.json(r);
    res.end();
});

router.post('/:id/fields', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    const debug = debugLib.extend('post/id/fields');
    debug('/invoice/:ID/fields - post');
    debug('%O', req.body);
    const r = { result: 'error', status: 200 };

    // no modifications allowed unless user is billing organization manager or admin
    if (!req.user.permissions.isAdmin && !req.user.permissions.isInvoicingOrgManager) {
        r.error = {};
        r.error.message = 'permission denied';
        res.json(r);
        res.end();
        return;
    }

    try {
        if (req.body.name) {
            let na = req.body.name.split('.'); // split name
            let t = await Invoice.findById(req.body.pk);
            if (t) {
                switch (na.length) {
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
                    r.result = 'ok';
                } else r.error = { message: 'Chyba: ' + verr };
            } else {
                r.error = { message: 'Faktura nebola nájdená id=' + req.body.pk };
            }
        }
    } catch (err) {
        r.error = { message: err.message };
        logERR('Error rt-invoice post. err=%s', err.message);
    }

    res.json(r);
    res.end();
});

router.post('/:id', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    const siteUrl = req.protocol + '://' + req.get('host');
    const invType = req.body.type;

    const debug = debugLib.extend('post/id');
    debug('/invoice - post (ID)');
    debug('%O', req.body);

    const r = { result: 'error', status: 200 };

    try {
        switch (req.body.cmd) {
            case 'markAsPaid':
                try {
                    if (req.invoice.paidOn) throw new Error('Invoice already paid.');
                    if (
                        !req.user.permissions.isInvoicingOrgManager &&
                        !req.user.permissions.isAdmin
                    )
                        throw new Error('permission denied');

                    // if specified, use that date otherwise use current date
                    let dp = req.body.paidOn ? new Date(req.body.paidOn) : Date.now();
                    logINFO(
                        'Going to set invoice as paid. no=%s id=%s date=%s',
                        req.invoice.number,
                        req.invoice.id,
                        dp
                    );

                    let i = await Invoice.findByIdAndUpdate(
                        req.invoice.id,
                        { $set: { paidOn: dp } },
                        { new: true }
                    );
                    if (i) {
                        logINFO(
                            'INVOICE paid: no=%s id=%s by user=%s',
                            i.number,
                            i.id,
                            req.user.username
                        );
                        r.result = 'ok';
                        r.invoice = i;

                        try {
                            i = await Team.populate(i, 'team'); // email requires populating team
                            email.sendInvoicePaid(req.user, i, siteUrl);
                        } catch (er) {
                            logWARN(
                                'Failed sending paid notification for invoice inv=%s err=%s',
                                i.id,
                                er.message
                            );
                        }
                    }
                } catch (err) {
                    throw new Error('Failed marking invoice as paid. err=' + err.message);
                }
                break;
            case 'copyToNew':
                try {
                    if (
                        !req.user.permissions.isInvoicingOrgManager &&
                        !req.user.permissions.isCoach &&
                        !req.user.permissions.isAdmin
                    ) {
                        debug('Invoice copy - permission denied');
                        throw new Error('permission denied');
                    }

                    debug('Going to create new invoice from existing invoice %s', req.invoice.id);

                    let invNew = await libInvoice.copyInvoice(req.invoice.id, invType);
                    invNew = await Team.populate(invNew, 'team');
                    if (invNew) {
                        req.invoice.taxInvoice = invNew.id;
                        try {
                            req.invoice.save();
                        } catch (err) {
                            logWARN(
                                'Failed to save tax invoice number %s to invoice %s'.invNew._id,
                                req.invoice.id
                            );
                        }

                        r.result = 'ok';
                        r.invoice = invNew;

                        logINFO('INVOICE copied to %s', invNew.id);
                        email.sendInvoice(req.user, invNew, siteUrl);
                    }
                } catch (err) {
                    throw new Error(
                        'Failed copying invoice ' + req.invoice._id + ' err=' + err.message
                    );
                }

                break;
            case 'remove':
                debug('Going to remove invoice #%s user=%s', req.invoice._id, req.user.username);
                try {
                    if (
                        !req.user.permissions.isInvoicingOrgManager &&
                        !req.user.permissions.isAdmin
                    ) {
                        logWARN(
                            'Invoice remove - permission denied. user=%s invoice=%s',
                            req.user.username,
                            req.invoice._id
                        );
                        throw new Error('permission denied');
                    }

                    let invId = req.invoice._id;

                    let d = await libInvoice.removeInvoice(invId);

                    let toEml = new Set();
                    toEml.add(process.env.EMAIL_REPLYTO_BILLING);

                    if (d._id) {
                        logINFO(
                            'Invoice removed: #%s id=%s by user=%s',
                            d.number,
                            invId,
                            req.user.username
                        );
                        email.sendMessage(
                            req.user,
                            req.user.email,
                            toEml,
                            'Invoice deleted ' + d.number,
                            'Invoice deleted',
                            'Invoice ' +
                                d.number +
                                ' deleted by user: ' +
                                req.user.username +
                                ' email:' +
                                req.user.email,
                            siteUrl
                        );

                        r.result = 'ok';
                        r.invoice = d;
                    }
                } catch (err) {
                    throw new Error('Removing invoice ' + req.invoice.id + ' err=' + err.message);
                }

                break;
            case 'addItem':
                try {
                    if (
                        !req.user.permissions.isInvoicingOrgManager &&
                        !req.user.permissions.isAdmin
                    ) {
                        logWARN(
                            'Invoice add item - permission denied. user=%s invoice=%s',
                            req.user.username,
                            req.invoice._id
                        );
                        debug('PERMS=%s', req.user.permissions);
                        throw new Error('permission denied');
                    }

                    if (!req.body.text || !req.body.value) throw new Error('wrong post data');

                    let qty = parseInt(req.body.qty ? req.body.qty : 1);
                    let value = parseInt(req.body.value);

                    let maxLineNo = parseInt(req.body.itemNo ? req.body.itemNo : 0);
                    if (maxLineNo == 0) {
                        req.invoice.items.forEach(
                            (i) => (maxLineNo = maxLineNo < i.itemNo ? i.itemNo : maxLineNo)
                        );
                        maxLineNo++;
                    }

                    let itm = {
                        itemNo: maxLineNo,
                        text: req.body.text,
                        unit: req.body.unit ? req.body.unit : '',
                        qty: qty,
                        unitPrice: value,
                    };
                    if (req.body.note) itm.note = req.body.note;

                    debug('ITEM=%s', itm);

                    req.invoice.items.push(itm);

                    req.invoice.updateTotal();

                    await req.invoice.save();
                    debug('Invoice %s item added total=', req.invoice._id, req.invoice.total);
                    r.result = 'ok';
                    r.invoice = req.invoice;
                } catch (err) {
                    logWARN(
                        'Adding item failed to invoice=%s err=%s',
                        req.invoice._id,
                        err.message
                    );
                    throw new Error(
                        'Adding item to invoice ' + req.invoice._id + ' err=' + err.message
                    );
                }

                break;
            case 'removeItem':
                try {
                    if (
                        !req.user.permissions.isInvoicingOrgManager &&
                        !req.user.permissions.isAdmin
                    ) {
                        logWARN(
                            'Invoice remove item - permission denied. user=%s invoice=%s',
                            req.user.username,
                            req.invoice._id
                        );
                        throw new Error('permission denied');
                    }

                    if (!req.body.itemNo) throw new Error('wrong request');

                    let i = parseInt(req.body.itemNo);

                    let inv = await Invoice.findByIdAndUpdate(
                        req.invoice._id,
                        { $pull: { items: { itemNo: i } } },
                        { new: true }
                    );

                    inv.updateTotal();

                    await inv.save();
                    debug('Invoice %s item removed total=%s', inv._id, inv.total);
                    r.result = 'ok';
                    r.invoice = inv;
                } catch (err) {
                    logWARN(
                        'Removing item failed from invoice=%s err=%s',
                        req.invoice._id,
                        err.message
                    );
                    throw new Error(
                        'Removing item from invoice ' + req.invoice.id + ' err=' + err.message
                    );
                }

                break;

            case 'notifyOverdue':
                try {
                    if (
                        !req.user.permissions.isInvoicingOrgManager &&
                        !req.user.permissions.isAdmin
                    ) {
                        logWARN(
                            'Invoice notify overdue - permission denied. user=%s invoice=%s',
                            req.user.username,
                            req.invoice._id
                        );
                        throw new Error('permission denied');
                    }

                    let cSubj = 'Faktúra po dátume splatnosti';
                    let cTitle = 'Faktúra po dátume splatnosti';
                    let toEml = new Set();
                    let cReplyTo = process.env.EMAIL_REPLYTO_BILLING;
                    toEml.add(req.invoice.billContact.email);
                    toEml.add(req.invoice.issuingContact.email);
                    toEml.add(req.user.email);
                    toEml.add(process.env.EMAIL_BCC_INVOICE);

                    let cMsg =
                        "Dobrý deň,<br><br>chceli by sme vás poprosiť o pomoc pri spracovaní faktúry č.<a href='" +
                        siteUrl +
                        '/invoice/' +
                        req.invoice._id +
                        "'>" +
                        req.invoice.number +
                        '</a>.<br>' +
                        'Evidujeme ju ako neuhradenú. Faktúru si môžete pozrieť/vytlačiť kliknutím na nasledujúcu linku <br>' +
                        "<a href='" +
                        siteUrl +
                        '/invoice/' +
                        req.invoice._id +
                        "'>" +
                        siteUrl +
                        '/invoice/' +
                        req.invoice._id +
                        '</a><br>' +
                        'Pokiaľ ste úhradu vykonali, prosíme vás, aby ste nás kontaktovali a pomohli nám identifikovať chýbajúcu platbu.<br>' +
                        'V prípade, ak ste faktúru ešte neuhrádzali, prosíme vás kontakt a o pomoc pri riešení tejto situácie.<br><br>' +
                        'Ďakujeme za pochopenie.<br><br>' +
                        'Tím FLL Slovensko<br>' +
                        'faktury@fll.sk';

                    email.sendMessage(req.user, cReplyTo, toEml, cSubj, cTitle, cMsg, siteUrl);

                    r.result = 'ok';
                } catch (err) {
                    throw new Error(
                        'Notify overdue invoice ' + req.invoice.id + ' err=' + err.message
                    );
                }
                break;
            case 'confirm':
                if (!req.user.permissions.isInvoicingOrgManager && !req.user.permissions.isAdmin) {
                    throw new Error('Invoice confirm - Permission denied');
                }
                try {
                    debug('RT:Confirming invoice inv=%s', req.invoice.id);
                    let inv = await libInvoice.confirmInvoice(req.invoice.id);
                    r.result = 'ok';
                    r.invoice = inv;
                    logINFO(
                        'INVOICE confirmed. id=%s no=%s by user=%s',
                        inv._id,
                        inv.number,
                        req.user.username
                    );
                    email.sendInvoice(req.user, inv, siteUrl);
                } catch (err) {
                    r.error = err;
                    logWARN('Failed confirming invoice. err=%s', err.message);
                }
                break;
            case 'renumber':
                if (!req.user.permissions.isInvoicingOrgManager && !req.user.permissions.isAdmin) {
                    throw new Error('Invoice items renumber - Permission denied');
                }
                try {
                    debug('Renumbering invoice items inv=%s', req.invoice.id);
                    req.invoice.renumber();
                    await req.invoice.save();
                    r.result = 'ok';
                    r.invoice = req.invoice;
                    logINFO(
                        'INVOICE items renumbered. id=%s no=%s by user=%s',
                        req.invoice._id,
                        req.invoice.number,
                        req.user.username
                    );
                } catch (err) {
                    r.error = err;
                    logWARN('Failed renumbering invoice items. err=%s', err.message);
                }
                break;
            case 'reloadBillTo':
                debug('Reloading invoice bill-to');
                if (!req.user.permissions.isInvoicingOrgManager && !req.user.permissions.isAdmin) {
                    throw new Error('Invoice reload bill-to - Permission denied');
                }

                try {
                    let team = await Team.findById(req.invoice.team);
                    req.invoice.billOrg = team.billingOrg;
                    req.invoice.billAdr = team.billingAdr;
                    req.invoice.billContact = team.billingContact;
                    await req.invoice.save();
                    logINFO(
                        'INVOICE bill-to reloaded: id=%s no=%s by user=%s',
                        req.invoice.id,
                        req.invoice.number,
                        req.user.username
                    );
                    r.result = 'ok';
                    r.invoice = req.invoice;
                } catch (err) {
                    r.error = err;
                    logWARN('Failed reloading invoice bill-to. err=%s', err.message);
                }
                break;
            default:
                debug('cmd=unknown');
                break;
        }
    } catch (err) {
        r.error = {};
        logERR('%s', err.message);
        r.error.message = err.message;
    }
    res.json(r);
    res.end();
});
