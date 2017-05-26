var express = require('express');
var router = express.Router();

router.get('/', require('connect-ensure-login').ensureLoggedIn('/login'), function(req, res, next) {
    res.render('profile', { user: req.user.username });
});

module.exports = router;