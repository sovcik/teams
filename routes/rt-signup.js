/* eslint-disable no-unused-vars */
/* eslint-disable no-async-promise-executor */

const express = require('express');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const router = express.Router();
const request = require('request-promise');
const email = require('../lib/email');

const debugLib = require('debug')('rt-signup');
const logERR = require('debug')('ERROR:rt-signup');
const logWARN = require('debug')('WARN:rt-signup');
const logINFO = require('debug')('INFO:rt-signup');

const User = mongoose.models.User;

module.exports = router;

router.get('/', async function(req, res, next) {
    const debug = debugLib.extend('public-get/');
    const captchaSiteKey = process.env.CAPTCHA_SITEKEY;
    const email = req.query.email;
    if (req.user) {
        debug('User already logged in:' + req.user.username);
        return res.redirect('/profile');
    } else if (email) {
        const user = await User.find({ username: email });
        res.json({ result: 'ok', found: user ? 1 : 0 });
        res.end();
    } else return res.render('signup', { captchaSiteKey: captchaSiteKey });
});

router.post('/', async function(req, res, next) {
    const debug = debugLib.extend('public-post/');
    const siteUrl = req.protocol + '://' + req.get('host');
    //const uv = new mongoose.model('UserVerify');
    //const username = req.body.email;

    const captcha_res = req.body['g-recaptcha-response'];
    const recapUrl =
        'https://www.google.com/recaptcha/api/siteverify?' +
        'secret=' +
        process.env.CAPTCHA_SECRET +
        '&response=' +
        captcha_res +
        '&remoteip=' +
        req.connection.remoteAddress;

    // Configure the request
    var options = {
        url: recapUrl,
        method: 'POST',
        body: {},
        json: true
    };

    // Start the request
    const resp = await request(options);

    debug('CAPTCHA RESPONSE', resp);
    if (!resp.success) {
        logWARN('CAPTCHA ERROR %s', resp['error-codes']);
        return res.render('message', {
            title: 'Nie ste človek?',
            error: {
                message:
                    'Pravdepodobne ste neodpovedali správne na otázky, ktorými systém overuje, či ste skutočne človek. Skúste znovu.'
            }
        });
    }

    try {
        const s = await bcrypt.genSalt(5);
        const h = await bcrypt.hash(req.body.password, s);
        const u = await User.findOneActive({ username: req.body.userName });

        if (u) return res.render('message', { title: 'Užívateľ už existuje', error: {} });

        const user = await User.create({
            username: req.body.userName,
            passwordHash: h,
            salt: s,
            fullName: req.body.fullName,
            email: req.body.email
        });

        logINFO('User created: username=%s id=%s', user.username, user.id);
        email.sendSignupConfirmation(user, siteUrl);
        return res.render('message', {
            title: 'Vytvorenie účtu bolo úspešné',
            message: 'Pri prihlasovaní použite údaje vložené na predchádzajúcej stránke..',
            link: {
                description: 'Pre pokračovanie kliknite na',
                url: '/login',
                text: 'tento link'
            }
        });
    } catch (err) {
        return res.render('message', { title: 'Nepodarilo sa vytvoriť účet', error: err });
    }
});
