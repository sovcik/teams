/* eslint-disable no-unused-vars */
/* eslint-disable no-async-promise-executor */

'use strict';

const mongoose = require('mongoose');
const express = require('express');
const cel = require('connect-ensure-login');
const router = express.Router();

const dbExport = require('../lib/db/export');
const libFmt = require('../lib/fmt');

const debugLib = require('debug')('rt-program');
const logERR = require('debug')('ERROR:rt-program');
const logWARN = require('debug')('WARN:rt-program');
const logINFO = require('debug')('INFO:rt-program');

const Program = mongoose.models.Program;
const User = mongoose.models.User;

module.exports = router;

router.param('id', async function(req, res, next) {
    const debug = debugLib.extend('param');
    const id = req.params.id;
    let p;
    try {
        p = await Program.findById(id);
        req.program = p;
        if (!p) throw new Error('program not found');

        if (req.user) req.user.isProgramManager = req.program.managers.indexOf(req.user.id) >= 0;
        else
            req.user = {
                isAdmin: false,
                isProgramManager: false,
                locales: libFmt.defaultLocales
            };

        debug('Program id=%s', req.program.id);

        next();
    } catch (err) {
        res.render('message', { title: 'Program nenájdený', error: err });
    }
});

router.get(
    '/:id',
    /*cel.ensureLoggedIn('/login'), */ async function(req, res, next) {
        const debug = debugLib.extend('public-get/');
        const cmd = req.query.cmd;
        debug('/program - PUBLIC get (ID)');

        if (cmd) next();
        else {
            debug('USER=', req.user);
            res.render('program', { user: req.user, program: req.program, fmt: libFmt });
        }
    }
);

// PUBLIC PART OF API
router.get('/:id', async function(req, res, next) {
    const debug = debugLib.extend('public-get/id');
    let routerNext = false;
    const cmd = req.query.cmd;
    debug('/program - PUBLIC get (ID,CMD)');
    debug('%O', req.query);
    const r = { result: 'error', status: 200 };
    switch (cmd) {
        case 'exportPublic':
            try {
                logWARN('Program PUBLIC data export requested for program=%s', req.program._id);
                r.data = await dbExport.exportProgramData(req.program._id, null, false);
                //r.user = req.user;
                r.result = 'ok';
            } catch (err) {
                r.error = { message: 'Failed to export program data. err=' + err };
            }

            break;

        default:
            routerNext = true;
            debug('cmd=unknown');
    }
    if (routerNext) next();
    else {
        res.json(r);
        res.end();
    }
});

router.get(
    '/',
    /*cel.ensureLoggedIn('/login'),*/ async function(req, res, next) {
        const debug = debugLib.extend('public-get/');
        const cmd = req.query.cmd;
        debug('/program - get');

        if (cmd) next();
        else {
            let list;
            try {
                let today = new Date();
                today.setHours(0, 0, 0, 0);
                let q = { recordStatus: 'active' };
                q.$or = [
                    { startDate: null },
                    {
                        $and: [{ endDate: { $gte: today } }, { startDate: { $lte: today } }]
                    }
                ];
                //list = await Program.findActive();
                list = await Program.find(q, { name: true, id: true });
            } catch (err) {
                logWARN('Failed to fetch list of programs. err=%s', err);
            }
            res.render('programs', { user: req.user, programs: list, fmt: libFmt });
        }
    }
);

router.get('/', cel.ensureLoggedIn('/login'), async function(req, res, next) {
    const debug = debugLib.extend('get/');

    const cmd = req.query.cmd;
    const pm = req.query.pm;
    const active = req.query.active;

    debug('/program - get (CMD) qry=%O', req.query);

    const r = { result: 'error', status: 200 };

    let today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (cmd) {
        case 'getList':
            debug('Going to get list of programs');
            // eslint-disable-next-line no-case-declarations
            let q = { recordStatus: 'active' };

            if (active && !req.user.isAdmin) {
                q.$or = [
                    { startDate: null },
                    {
                        $and: [{ endDate: { $gte: today } }, { startDate: { $lte: today } }]
                    }
                ];
            }

            try {
                if (pm) q.managers = new mongoose.Types.ObjectId(pm);
                const p = await Program.find(q, { name: true, id: true });
                r.result = 'ok';
                r.list = p;
            } catch (err) {
                // if wrong format, then it should return empty list
                r.error = { message: 'error getting programs err=' + err };
            }

            break;
        default:
            debug('cmd=unknown');
    }
    res.json(r);
    res.end();
});

router.get('/:id', cel.ensureLoggedIn('/login'), async function(req, res, next) {
    const debug = debugLib.extend('get/id');
    const cmd = req.query.cmd;

    debug('query %O', req.query);

    const r = { result: 'error', status: 200 };
    switch (cmd) {
        case 'getManagers':
            debug('Going to get list of program managers');

            try {
                if (req.program.managers.length == 0) break;

                let u = await User.find(
                    { _id: { $in: req.program.managers } },
                    { fullName: true, id: true }
                );
                r.result = 'ok';
                r.list = u;
            } catch (err) {
                r.error = { message: 'error getting managers err=' + err };
            }
            break;

        case 'export':
            debug('data export');
            if (!req.user.isAdmin && !req.user.isProgramManager) {
                r.error = { message: 'permission denied' };
                break;
            }

            try {
                logWARN(
                    'Program data export requested by user=%s for program=%s',
                    req.user.username,
                    req.program._id
                );
                r.data = await dbExport.exportProgramData(req.program._id, null, true);
                r.user = req.user;
                r.result = 'ok';
            } catch (err) {
                logERR('Failed to export program data. err=%s', err.message);
                r.error = { message: 'Failed to export program data. err=' + err };
            }

            break;

        default:
            debug('cmd=unknown');
    }
    res.json(r);
    res.end();
});

router.post('/', cel.ensureLoggedIn('/login'), async function(req, res, next) {
    const debug = debugLib.extend('post/');
    debug('/program - post, body=%O', req.body);

    const r = { result: 'error', status: 200 };

    switch (req.body.cmd) {
        case 'createProgram':
            if (!req.user.isAdmin) return res.render('message', { title: 'Prístup zamietnutý' });

            // eslint-disable-next-line no-case-declarations
            let name = req.body.name;
            debug('Going to create program ', name);
            try {
                let p = await Program.findOneActive({ name: name });
                if (p) throw new Error('Duplicate program name');
                p = await Program.create({ name: name });
                debug('Program created', p.name, p.id);
                r.result = 'ok';
            } catch (err) {
                r.error = {};
                r.error.message = err.message;
                logERR('Error creating program. err=%s', err);
            }
            break;
        default:
            debug('cmd=unknown');
            break;
    }
    res.json(r);
    res.end();
});

router.post('/:id/fields', cel.ensureLoggedIn('/login'), async function(req, res, next) {
    const debug = debugLib.extend('post/id/fields');
    debug('/program/:ID/fields - post, body=%O', req.body);

    const r = { result: 'error', status: 200 };

    // no modifications allowed unless user is program manager or admin
    if (!req.user.isAdmin && !req.user.isProgramManager) {
        r.error = {};
        r.error.message = 'permission denied';
        res.json(r);
        res.end();
        return;
    }

    try {
        if (req.body.name) {
            let p = await Program.findById(req.body.pk);
            if (p) {
                p[req.body.name] = req.body.value;
                let verr = p.validateSync();
                if (!verr) {
                    await p.save();
                    r.result = 'ok';
                } else r.error = { message: 'Chyba: ' + verr };
            } else {
                r.error = { message: 'Program nenájdený id=' + req.body.pk };
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
    debug('/program - post (ID) body=%O', req.body);

    const r = { result: 'error', status: 200 };

    try {
        switch (req.body.cmd) {
            case 'addManager':
                debug('Going to add manager to a program');

                if (!req.user.isAdmin && !req.user.isProgramManager) {
                    logWARN('addManager: Permission denied for user=%s', req.user.username);
                    r.error = { message: 'permission denied' };
                    break;
                }

                // eslint-disable-next-line no-case-declarations
                let u = await User.findOneActive({ username: req.body.username });
                if (!u) throw new Error('User not found ' + req.body.username);

                try {
                    let e = await Program.findOneAndUpdate(
                        { _id: req.program._id },
                        { $addToSet: { managers: u._id } }
                    );
                    if (!e) throw new Error('Failed to update program=' + req.program._id);

                    r.result = 'ok';
                    r.program = e;
                } catch (err) {
                    logERR('Failed to save program manager. err=%s', err.message);
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
