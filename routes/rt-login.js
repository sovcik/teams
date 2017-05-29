const express = require('express');
const router = express.Router();
const auth = require('../lib/auth.js');

module.exports = router;

router.get('/', function (req, res, next) {
    res.render('login', {title: 'Login'});
});

router.post('/',
    auth.passport.authenticate('local', {
        successReturnToOrRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true
    })
);
