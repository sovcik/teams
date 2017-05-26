var express = require('express');
var router = express.Router();
var auth = require('../lib/auth.js');

router.get('/', function(req, res, next) {
    res.render('login', { title: 'Login' });
});

router.post('/',
    auth.passport.authenticate('local', {
        successReturnToOrRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true })
);

module.exports = router;
