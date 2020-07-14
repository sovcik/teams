const express = require('express');
const router = express.Router();
const auth = require('../lib/auth.js');
const version = require('../package.json').version;

module.exports = router;

router.get('/', function(req, res, next) {
    const success = req.query.success;
    res.render('login', { success: success, version: version });
});

router.post(
    '/',
    auth.passport.authenticate('local', {
        successReturnToOrRedirect: '/profile',
        failureRedirect: '/login?success=0',
        failureFlash: true
    })
);
