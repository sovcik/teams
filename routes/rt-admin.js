/* eslint-disable no-unused-vars */
/* eslint-disable no-async-promise-executor */

const mongoose = require('mongoose');
const express = require('express');
const cel = require('connect-ensure-login');
const router = express.Router();

const debugLib = require('debug')('rt-admin');
const logERR = require('debug')('ERROR:rt-admin');
const logWARN = require('debug')('WARN:rt-admin');

const Event = mongoose.models.Event;
const Team = mongoose.models.Team;
const TeamEvent = mongoose.models.TeamEvent;
const Program = mongoose.models.Program;

module.exports = router;

router.get('/', cel.ensureLoggedIn('/login'), async function(req, res, next) {
    let debug = debugLib.extend('get/admin');
    debug('/admin - get');
    if (!req.user.isAdmin) return res.render('message', { title: 'Prístup zamietnutý' });

    const cmd = req.query.cmd;

    debug('%O', req.query);
    const r = { result: 'error', status: 200 };
    try {
        switch (cmd) {
            case 'getAvailTeamEvents':
                {
                    debug('u(%s) Going to get list of team events', req.user.username);
                    const t = await Team.findOneActive({ _id: req.query.teamId });
                    if (t) {
                        const p = await Event.find(
                            { recordStatus: 'active', programId: t.programId },
                            {
                                name: true,
                                id: true
                            }
                        );
                        r.result = 'ok';
                        r.list = p;
                    } else {
                        throw new Error('Team not found');
                    }
                }
                break;
            default:
                if (!cmd) return res.render('admin', { user: req.user });
                else debug('cmd=unknown');
        }
    } catch (err) {
        r.error = {};
        r.error.message = err.message;
        logERR('GET: %s', err.message);
    }
    res.json(r);
    res.end();
});

router.post('/', cel.ensureLoggedIn('/login'), async function(req, res, next) {
    let debug = debugLib.extend('post/admin');
    debug('/admin - post');
    if (!req.user.isAdmin) return res.render('message', { title: 'Prístup zamietnutý' });

    const cmd = req.body.cmd;
    debug('%O', req.body);
    const r = { result: 'error', status: 200 };
    try {
        switch (cmd) {
            case 'registerTeam':
                {
                    debug('Going to register team for an event');
                    const t = await Team.findOneActive({ _id: req.body.teamId });
                    if (!t) throw new Error('Team not found');

                    const p = await Program.findOneActive({ _id: t.programId });
                    if (!p) throw new Error('Team not joined in program');

                    const e = await Event.findOneActive({ programId: p.id, _id: req.body.eventId });
                    if (!e)
                        throw new Error(
                            'Event not found or not relevant for program team is joined to'
                        );

                    const te = await TeamEvent.create({
                        teamId: t.id,
                        eventId: e.id,
                        programId: p.id,
                        registeredOn: Date.now()
                    });
                    if (!te) throw new Error('Failed to register');

                    r.result = 'ok';
                    r.list = p;
                }
                break;
            default:
                debug('cmd=unknown');
        }
    } catch (err) {
        r.error = {};
        r.error.message = err.message;
        logERR('rt-admin POST: %s', err.message);
    }
    res.json(r);
    res.end();
});
