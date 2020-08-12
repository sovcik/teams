/* eslint-disable no-unused-vars */
/* eslint-disable no-async-promise-executor */

'use strict';

const mongoose = require('mongoose');
const express = require('express');
const cel = require('connect-ensure-login');
const router = express.Router();

const libFmt = require('../lib/fmt');
const libInvoice = require('../lib/invoice');

const debugLib = require('debug')('rt-invorg');
const logERR = require('debug')('ERROR:rt-invorg');
const logWARN = require('debug')('WARN:rt-invorg');
const logINFO = require('debug')('INFO:rt-invorg');

const InvoicingOrg = mongoose.models.InvoicingOrg;
const Invoice = mongoose.models.Invoice;
const User = mongoose.models.User;

module.exports = router;

router.param('id', async function(req, res, next) {
    const id = req.params.id;
    let r;

    const debug = debugLib.extend('param');
    debug('Invoicing org id %s', id);

    try {
        r = await InvoicingOrg.findById(id);
        req.iorg = r;
        if (r) {
            if (req.user)
                req.user.isInvoicingOrgManager = req.iorg.managers.indexOf(req.user.id) >= 0;
            else
                req.user = {
                    isAdmin: false,
                    isInvoicingOrgManager: false,
                    locales: libFmt.defaultLocales
                };

            debug('Invoicing org id=%s name=%s', r.id, r.org.name);
        } else throw new Error('invoicing org not found');
        next();
    } catch (err) {
        res.render('message', {
            title: 'Fakturujúca organizácia nenájdená',
            error: { status: err.message }
        });
    }
});

router.get('/:id', cel.ensureLoggedIn('/login'), async function(req, res, next) {
    const cmd = req.query.cmd;

    const debug = debugLib.extend('get/id');
    debug('/invorg - get');

    if (cmd) next();
    else {
        let inv;
        try {
            // each invoicing org should have at least one invoice template
            inv = await Invoice.find({ invoicingOrg: req.iorg.id, type: 'T' });
        } catch (err) {
            logWARN('Failed to find templates for iorg %s err=%s', req.iorg.id, err);
        }

        if (inv.length < 1) {
            debug('Creating invoice template for INVORG %s', req.iorg.id);
            await libInvoice.createTemplateInvoice(req.iorg.id);
        } else {
            debug('TEMPLATES %s', inv);
        }

        res.render('invoicingOrg', { io: req.iorg, user: req.user, fmt: libFmt });
    }
});

router.get('/:id', cel.ensureLoggedIn('/login'), async function(req, res, next) {
    const cmd = req.query.cmd;
    const debug = debugLib.extend('get+cmd/id');
    debug('query %O', req.query);

    const r = { result: 'error', status: 200 };
    switch (cmd) {
        case 'getManagers':
            debug('Going to get list of invorg managers');

            try {
                if (req.iorg.managers.length == 0) break;

                let u = await User.find(
                    { _id: { $in: req.iorg.managers } },
                    { fullName: true, id: true }
                );
                r.result = 'ok';
                r.list = u;
            } catch (err) {
                r.error = { message: 'error getting managers err=' + err };
            }
            break;

        default:
            debug('cmd=unknown');
    }
    res.json(r);
    res.end();
});

router.get('/', cel.ensureLoggedIn('/login'), async function(req, res, next) {
    const cmd = req.query.cmd;
    const iom = req.query.iom;
    const active = req.query.active;

    const debug = debugLib.extend('get/');
    debug('/invorg - get');
    debug('%O', req.query);

    const r = { result: 'error', status: 200 };
    switch (cmd) {
        case 'getList':
            debug('Going to get list of invoicing orgs');
            // eslint-disable-next-line no-case-declarations
            let p;
            // eslint-disable-next-line no-case-declarations
            let q = { recordStatus: 'active' };

            try {
                if (iom) q.managers = new mongoose.Types.ObjectId(iom);
                p = await InvoicingOrg.find(q, { org: true, adr: true }, { lean: 1 });
                p.forEach(function(e) {
                    e.name = e.org.name;
                }); // add name field so result can be used in generic LoadList method
            } catch (err) {
                logWARN('Failed fetching list of invoicing orgs');
            }
            r.result = 'ok';
            r.list = p;
            break;
        default:
            debug('cmd=unknown');
    }
    res.json(r);
    res.end();
});

router.post('/:id/fields', cel.ensureLoggedIn('/login'), async function(req, res, next) {
    const debug = debugLib.extend('post/id/fields');
    debug('/invorg/:ID/fields - post');
    debug('%O', req.body);
    const r = { result: 'error', status: 200 };

    // no modifications allowed unless user is invoicing org manager or admin
    if (!req.user.isAdmin && !req.user.isInvoicingOrgManager) {
        r.error = {};
        r.error.message = 'permission denied';
        res.json(r);
        res.end();
        return;
    }

    try {
        if (req.body.name) {
            let t = await InvoicingOrg.findById(req.body.pk);
            let na = req.body.name.split('.'); // split name
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
                r.error = { message: 'InvOrg nenájdená id=' + req.body.pk };
            }
        }
    } catch (err) {
        r.error = { message: err.message };
        logERR('Error rt-team post. err=%s', err.message);
    }

    res.json(r);
    res.end();
});

router.post('/:id', cel.ensureLoggedIn('/login'), async function(req, res, next) {
    const debug = debugLib.extend('post/id');
    debug('/invorg - post (ID)');

    debug('%O', req.body.cmd);
    const r = { result: 'error', status: 200 };

    try {
        switch (req.body.cmd) {
            case 'addManager':
                debug('Going to add manager to an organization');

                if (!req.user.isAdmin && !req.user.isInvoicingOrgManager) {
                    logWARN('addManager: Permission denied for user=%s', req.user.username);
                    r.error = { message: 'permission denied' };
                    break;
                }

                // eslint-disable-next-line no-case-declarations
                let u = await User.findOneActive({ username: req.body.username });
                if (!u) throw new Error('User not found ' + req.body.username);

                try {
                    let e = await InvoicingOrg.findOneAndUpdate(
                        { _id: req.iorg._id },
                        { $addToSet: { managers: u._id } }
                    );
                    if (!e) throw new Error('Failed to update organization=' + req.iorg._id);

                    r.result = 'ok';
                    r.invorg = e;
                } catch (err) {
                    logERR('Failed to save organization manager. err=%s', err.message);
                }
                break;
            default:
                debug('cmd=unknown');
                break;
        }
    } catch (err) {
        logERR('%s', err.message);
        r.error = { message: err.message };
    }
    res.json(r);
    res.end();
});

router.post('/', cel.ensureLoggedIn('/login'), async function(req, res, next) {
    const debug = debugLib.extend('post/');
    debug('/invorg - post body=%O', req.body);

    const r = { result: 'error', status: 200 };

    switch (req.body.cmd) {
        case 'create':
            if (!req.user.isAdmin) return res.render('message', { title: 'Prístup zamietnutý' });
            try {
                debug('Going to create invoicing org ');

                const io = {};
                io.org = {};
                io.org.name = req.body.name ? req.body.name : 'IOName';

                let i = InvoicingOrg(io);
                i = await i.save();
                if (i) {
                    debug('invoicing org created %s %s', i.org.name, i.id);
                    r.result = 'ok';
                }
                // create default invoice template for newly created invoicing org
                await libInvoice.createTemplateInvoice(i.id);
            } catch (err) {
                r.error = {};
                r.error.message = err.message;
                logERR('rt-invorg POST err=%s', err.message);
                console.log(err);
            }

            break;
        default:
            debug('cmd=unknown');
            break;
    }
    res.json(r);
    res.end();
});
