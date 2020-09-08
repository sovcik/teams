/* eslint-disable no-unused-vars */
/* eslint-disable no-async-promise-executor */

const express = require('express');
const router = express.Router();
const auth = require('../lib/auth.js');
const version = require('../package.json').version;

const debugLib = require('debug')('rt-login');
const logERR = require('debug')('ERROR:rt-login');

module.exports = router;

router.get('/', function (req, res, next) {
    const success = req.query.success;
    res.render('login', { success: success, version: version });
});

router.post(
    '/',
    auth.passport.authenticate('local', {
        successReturnToOrRedirect: '/profile',
        failureRedirect: '/login?success=0',
        failureFlash: true,
    })
);
