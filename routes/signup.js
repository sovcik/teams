var express = require('express');
var router = express.Router();
var auth = require('../lib/auth.js');

router.get('/', function(req, res, next) {
    res.render('signup');
});

router.post('/', function(req, res, next){


});

module.exports = router;