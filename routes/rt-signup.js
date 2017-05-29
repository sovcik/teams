const express = require('express');
const mongoose = require('mongoose');
const auth = require('../lib/auth.js');
const router = express.Router();

module.exports = router;

router.get('/', function (req, res, next) {
    if (req.user) {
        console.log("User already logged in:" + req.user.username);
        res.redirect('/profile');
    } else
        res.render('signup');
});

router.post('/', function (req, res, next) {
    const uv = new mongoose.model('UserVerify');
    const username = req.user.username;
    uv.addNew(dbConnection, username, req.user.username, req.user.password, function(err, user){
        if (err) {
            console.log("Error creating signup record for "+username);
            return;
        }
        console.log("Signup created for "+username);
    });

});
