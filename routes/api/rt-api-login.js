/* eslint-disable no-unused-vars */
/* eslint-disable no-async-promise-executor */

const express = require('express');
const router = express.Router();
const auth = require('../../lib/auth.js');

const debugLib = require('debug')('rt-api');
const logERR = require('debug')('ERROR:rt-api');
const logWARN = require('debug')('WARN:rt-api');

module.exports = router;

router.post('/', auth.passport.authenticate('local'), function (req, res) {
    const debug = debugLib.extend('api');
    debug('authenticated %s %O', req.user.username, req.user);
    res.json({
        result: 'authenticated',
        user: {
            username: req.user.username,
            _id: req.user._id,
            isAdmin: req.user.isAdmin,
            isSuperAdmin: req.user.isSuperAdmin,
            fullName: req.user.fullName,
            dpaAccepted: req.user.dpaAccepted,
            email: req.user.email,
        },
    });
    res.end();
});
