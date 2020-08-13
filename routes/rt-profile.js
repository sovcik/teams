/* eslint-disable no-unused-vars */
/* eslint-disable no-async-promise-executor */

'use strict';

const mongoose = require('mongoose');
const express = require('express');
const cel = require('connect-ensure-login');
const router = express.Router();
const bcrypt = require('bcryptjs');
const email = require('../lib/email');
const libFmt = require('../lib/fmt');

const debugLib = require('debug')('rt-profile');
const logERR = require('debug')('ERROR:rt-profile');
const logWARN = require('debug')('WARN:rt-profile');
const logINFO = require('debug')('INFO:rt-profile');

const Team = mongoose.models.Team;
const User = mongoose.models.User;
const TeamUser = mongoose.models.TeamUser;
const Program = mongoose.models.Program;
const Event = mongoose.models.Event;
const OneTime = mongoose.models.OneTime;

const dbUser = require('../lib/db/User');
const libUser = require('../lib/user');

module.exports = router;

router.param('id', async function(req, res, next) {
    const debug = debugLib.extend('param');
    const id = req.params.id;
    let u;
    try {
        u = await User.findById(id, { salt: 0, passwordHash: 0 }, { lean: true });
        if (!u) throw new Error('profile not found');

        req.profile = u;
        req.profile.id = req.profile._id;

        debug('Profile id=%s username=%s', req.profile.id, req.profile.username);

        next();
    } catch (err) {
        res.render('message', { title: 'Profil nenájdný', error: err });
    }
});

router.get('/', async function(req, res, next) {
    const cmd = req.query.cmd;

    const debug = debugLib.extend('public get/');
    debug('/profile - PUBLIC get query=%O', req.query);

    switch (cmd) {
        case 'resetPwdRequest':
            return res.render('resetPwdRequest');
            // eslint-disable-next-line no-unreachable
            break;
        default:
            debug('cmd=unknown');
    }

    next();
});

router.get('/', cel.ensureLoggedIn('/login'), async function(req, res, next) {
    const cmd = req.query.cmd;

    const debug = debugLib.extend('get/');
    debug('/profile - get qry=%O', req.query);

    if (!cmd) return res.redirect('/profile/' + req.user.id);
    const r = { result: 'error', status: 200 };
    switch (cmd) {
        case 'getList':
            debug('Going to get list of users');
            try {
                let opts = {
                    username: true,
                    fullName: true,
                    email: true,
                    isAdmin: true,
                    isSuperAdmin: true
                };
                const u = await User.findActive({ username: { $exists: true } });
                if (u) {
                    r.result = 'ok';
                    r.list = u;
                } else {
                    logWARN('Failed to fetch list of users.');
                }
            } catch (err) {
                logWARN('Failed to fetch list of users. err=%s', err);
                r.error = err;
            }
            break;
        default:
            debug('cmd=unknown');
    }
    res.json(r);
    res.end();
});

router.get('/:id', async function(req, res, next) {
    const siteUrl = req.protocol + '://' + req.get('host');
    const cmd = req.query.cmd;

    const debug = debugLib.extend('public get/id');
    debug('/profile/:id - PUBLIC get');
    var nextRouter = true;

    switch (cmd) {
        case 'resetPwd':
            // eslint-disable-next-line no-case-declarations
            let otc = req.query.otc;

            // eslint-disable-next-line no-case-declarations
            let ot = await OneTime.findById(otc);
            if (!ot || !ot.active)
                throw new Error('onetime code not found, expired or already used');
            if (ot.type !== 'rstpwd') throw new Error('wrong onetime code type specified');

            logINFO('OneTime used: id=%s type=%s', otc, ot.type);

            res.render('resetPwd', { otc: otc, ot: ot, profile: req.profile, fmt: libFmt });

            nextRouter = false;
            break;
    }

    if (nextRouter) next();
});

router.get('/:id', cel.ensureLoggedIn('/login'), async function(req, res, next) {
    const siteUrl = req.protocol + '://' + req.get('host');
    const cmd = req.query.cmd;

    const debug = debugLib.extend('get/id');
    debug('/profile/:id - get');

    if (cmd) next();
    else {
        try {
            let pm = await Program.findOne({ managers: req.profile.id });
            if (pm) {
                req.profile.isProgramManager = true;
                debug('Profile is program manager');
            } else debug('Profile is NOT program manager');

            let em = await Event.findOne({ managers: req.profile.id, recordStatus: 'active' });
            if (em) {
                req.profile.isEventOrganizer = true;
                debug('Profile is event manager');
            } else debug('Profile is NOT event manager');

            let tm = await TeamUser.findOne({ userId: req.profile.id, role: 'coach' });
            if (tm) {
                req.profile.isCoach = true;
                debug('Profile is coach');
            } else debug('Profile is NOT coach');
        } catch (err) {
            logWARN('Failed fetching program data for user profile. err=%s', err);
        }
        res.render('profile', { profile: req.profile, user: req.user, fmt: libFmt });
    }
});

router.get('/:id', cel.ensureLoggedIn('/login'), async function(req, res, next) {
    const userId = req.params.id;
    const cmd = req.query.cmd;

    const debug = debugLib.extend('get+cmd/id');
    debug('/profile/:id - get qry=%O', req.query);

    const r = { result: 'error', status: 200 };
    switch (cmd) {
        case 'getFields':
            debug('Going to get profile fields');
            try {
                const u = await User.findById(req.profile.id, {
                    username: 1,
                    fullName: 1,
                    email: 1,
                    phone: 1
                });
                r.result = 'ok';
                r.fields = u;
            } catch (err) {
                logWARN('Failed to fetch profile fields. err=%s', err);
                r.error = err;
            }
            break;
        case 'getCoachTeams':
            debug('Going to get Coach teams');
            try {
                const ut = await dbUser.getCoachTeams(req.user.id, userId);
                r.result = 'ok';
                r.list = ut;
            } catch (err) {
                logERR("Failed to fetch coach's teams. err=%s", err.message);
                r.error = err;
            }
            break;

        default:
            debug('cmd=unknown');
    }
    res.json(r);
    res.end();
});

router.post('/', async function(req, res, next) {
    var cmd = req.body.cmd;
    const siteUrl = req.protocol + '://' + req.get('host');
    var nextRouter = true;

    const debug = debugLib.extend('public post/');
    debug('/profile - PUBLIC post body=%O', req.body);
    debug('cmd=' + cmd);

    switch (cmd) {
        case 'resetPwdRequest':
            // eslint-disable-next-line no-case-declarations
            let uname = req.body.loginName;
            debug('uname=%s', uname);
            try {
                let u = await User.findOneActive({ username: uname });
                if (!u) u = await User.findOneActive({ email: uname });
                if (u) {
                    debug('pwdReset user=%s', u.username);
                    let ot = await OneTime.create({
                        type: 'rstpwd',
                        user: {
                            username: u.username,
                            email: u.email
                        }
                    });

                    email.sendPwdResetCode(u, ot, siteUrl);
                }
                nextRouter = false;
                res.render('message', {
                    title: 'Reset hesla',
                    message:
                        'Ak ste zadali existujúce prihlasovacie meno alebo email, tak v nasledujúcich pár minútach by ste mali dostať email obsahujúci linku, cez ktorú budete môcť vaše heslo zmenit.',
                    link: {
                        description: 'Pre pokračovanie kliknite na',
                        url: '/login',
                        text: 'tento link'
                    }
                });
            } catch (err) {
                logWARN('Failed to request password reset err=%s', err.message);
            }
    }

    if (nextRouter) next();
});

router.post('/:id', async function(req, res, next) {
    const debug = debugLib.extend('public post/id');
    debug('/profile/:id - PUBLIC post body=%O', req.body);

    var cmd = req.body.cmd;
    var otc = req.body.otc;
    const siteUrl = req.protocol + '://' + req.get('host');
    var nextRouter = true;

    switch (cmd) {
        case 'resetPwd':
            try {
                let ot = await OneTime.findById(otc);
                if (!ot || !ot.active) throw new Error('onetime code not found or used already');

                // create new password
                let user = await libUser.setPassword(
                    null,
                    req.profile.id,
                    req.body.newPassword,
                    siteUrl
                );
                if (!user) throw new Error('Nepodarilo sa zmeniť heslo');

                ot.active = false;
                ot.save();

                res.render('message', {
                    title: 'Heslo bolo úspešne zmenené',
                    message: 'Teraz sa už môžete prihlásiť použitím vášho nového hesla.',
                    link: {
                        description: 'Pre pokračovanie kliknite na',
                        url: '/login',
                        text: 'tento link'
                    }
                });
                nextRouter = false;
            } catch (err) {
                logWARN('Password reset failed. err=%s', err.message);
                res.render('message', { title: 'Chyba', error: err });
            }
    }

    if (nextRouter) next();
});

router.post('/:id', cel.ensureLoggedIn('/login'), async function(req, res, next) {
    const debug = debugLib.extend('post/id');
    debug('/profile/:id - post body=%O', req.body);

    const r = { result: 'error', status: 200 };
    const id = req.params.id;
    const siteUrl = req.protocol + '://' + req.get('host');
    let perm = false;

    switch (req.body.cmd) {
        case 'saveFields':
            debug('Going to save profile fields');
            try {
                let doc = JSON.parse(req.body.data);
                debug('DOCUMENT=%s', doc);
                let user = await libUser.saveFields(req.user.id, req.profile.id, doc, siteUrl);
                r.result = 'ok';
            } catch (err) {
                r.error = { message: err.message };
                logERR('Error saving profile fields. err=%s', err.message);
            }
            break;
        case 'changePassword':
            try {
                const up1 = await User.findOneActive({ _id: id });
                // check if user exists
                if (!up1) throw new Error('User not found');
                // check if old password is correct
                if (!(req.user.isAdmin && !req.profile.isSuperAdmin) && !req.user.isSuperAdmin)
                    if (!(await bcrypt.compare(req.body.oldPwd, up1.passwordHash)))
                        throw new Error('Invalid old password specified');

                // create new password
                let user = await libUser.setPassword(req.user.id, id, req.body.newPwd, siteUrl);
                if (!user) throw new Error('Error changing password');
                r.result = 'ok';
            } catch (err) {
                logWARN('Error changing password for user %s err=%s', id, err);
                r.error = { message: err.message };
            }
            break;
        case 'setAdmin':
            debug('Going to setAdmin user ', id);
            if (!req.user.isSuperAdmin) {
                r.error = { message: 'Permission denied' };
                logWARN('setAdmin denied for user %s', req.user.username);
            } else {
                try {
                    let flgAdmin = req.body.val == 1;

                    let user = await User.findByIdAndUpdate(
                        id,
                        { $set: { isAdmin: flgAdmin } },
                        { new: true }
                    );
                    logINFO(
                        'User %s' + (flgAdmin ? ' made' : ' revoked') + 'admin by %s',
                        user.username,
                        req.user.username
                    );
                    r.result = 'ok';
                } catch (err) {
                    logWARN('Error making admin user %s err=%s', id, err);
                    r.error = { message: err.message };
                }
            }
            break;
        case 'setActive':
            debug('Going to setActive user %s', id);
            if (!req.user.isAdmin && !req.user.isSuperAdmin) {
                r.error = { message: 'Permission denied' };
            } else {
                try {
                    let flgActive = req.body.val == 1;

                    let user = await User.findByIdAndUpdate(
                        id,
                        { $set: { recordStatus: flgActive ? 'active' : 'inactive' } },
                        { new: true }
                    );
                    logINFO(
                        'User %s ' + (flgActive ? ' activated' : ' deactivated') + ' by %s',
                        user.username,
                        req.user.username
                    );
                    r.result = 'ok';
                } catch (err) {
                    logWARN('Error while setActive user=%s err=%s', id, err);
                    r.error = { message: err.message };
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
