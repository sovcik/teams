/* eslint-disable no-unused-vars */
/* eslint-disable no-async-promise-executor */

'use strict';

const mongoose = require('mongoose');
const cel = require('connect-ensure-login');
const express = require('express');
const router = express.Router();

const debugLib = require('debug')('rt-teamEvent');
const logERR = require('debug')('ERROR:rt-teamEvent');
const logWARN = require('debug')('WARN:rt-teamEvent');
const logINFO = require('debug')('INFO:rt-teamEvent');

const TeamEvent = mongoose.model('TeamEvent');
const Team = mongoose.model('Team');

module.exports = router;

router.param('id', async function(req, res, next) {
    const debug = debugLib.extend('param');
    const id = req.params.id;
    let te;
    try {
        te = await TeamEvent.findById(id);
        if (!te) throw new Error('team-event not found');

        req.teamEvent = te;
        debug('TeamEvent id=' + te.id);

        next();
    } catch (err) {
        res.render('message', { title: 'TeamEvent nenájdný', error: err });
    }
});

router.get('/:id', cel.ensureLoggedIn('/login'), async function(req, res, next) {
    const debug = debugLib.extend('get/id');
    const siteUrl = req.protocol + '://' + req.get('host');
    const cmd = req.query.cmd;
    debug('/profile - get');

    if (cmd) next();
    else {
        res.json(req.teamEvent);
        res.end();
    }
});

router.get('/:id', cel.ensureLoggedIn('/login'), async function(req, res, next) {
    next();
});

router.post('/:id', cel.ensureLoggedIn('/login'), async function(req, res, next) {
    const debug = debugLib.extend('post/id');
    debug('/team-event - post, body=%O', req.body);

    const r = { result: 'error', status: 200 };
    const id = req.params.id;
    switch (req.body.cmd) {
        case 'assignNumber':
            {
                let teamNumber = req.body.teamNumber;
                debug(
                    'Going to assign team number=%s to teamEvent=%s',
                    teamNumber,
                    req.teamEvent.id
                );
                try {
                    req.teamEvent.teamNumber = teamNumber;
                    req.teamEvent.confirmed = Date.now();
                    let te = await req.teamEvent.save();
                    if (te) {
                        debug('Number assigned %s %s', te.id, te.teamNumber);
                        r.result = 'ok';
                        r.teamEvent = te;
                    }
                } catch (err) {
                    r.error = err;
                    logWARN('Failed assigning number to teamEvent=%s err=%s', id, err);
                }
            }
            break;
        default:
            debug('cmd=unknown');
            break;
    }
    res.json(r);
    res.end();
});

router.get(
    '/',
    /*cel.ensureLoggedIn('/login'), */ async function(req, res, next) {
        const debug = debugLib.extend('public-get/');
        const cmd = req.query.cmd;
        debug('/team-event: get, qry=%O', req.query);

        var r = { result: 'error', status: 200 };
        try {
            switch (cmd) {
                case 'getTeams':
                    {
                        debug('Going to get list of teams');
                        let q = {};
                        if (req.query.programId) q.programId = req.query.programId;
                        if (req.query.eventId) q.eventId = req.query.eventId;

                        debug('Query: %s', q.toString());

                        r.list = [];
                        const tc = await TeamEvent.find(q);
                        if (tc) {
                            let tms = await Team.populate(tc, 'teamId');
                            tms.forEach(t =>
                                r.list.push({
                                    _id: t.teamId.id,
                                    name: t.teamId.name,
                                    number: t.teamNumber,
                                    foundingOrg: t.teamId.foundingOrg,
                                    foundingAdr: t.teamId.foundingAdr,
                                    foundingContact: req.user ? t.teamId.foundingContact : {},
                                    eventId: t.eventId,
                                    programId: t.programId
                                })
                            );
                        }
                        r.result = 'ok';
                    }
                    break;

                default:
                    debug('cmd=unknown');
            }
        } catch (err) {
            r.error = { message: err.message };
            logERR('%s', err.message);
        }
        res.json(r);
        res.end();
    }
);
