const express = require('express');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const auth = require('../lib/auth.js');
const router = express.Router();
const request = require('request');

const User = mongoose.models.User;

module.exports = router;

router.get('/', function (req, res, next) {
    if (req.user) {
        console.log("User already logged in:" + req.user.username);
        res.redirect('/profile');
    } else
        res.render('signup');
});

router.post('/', async function (req, res, next) {
    //const uv = new mongoose.model('UserVerify');
    //const username = req.body.email;

    console.log(req);
    const captcha_res = req.body['g-recaptcha-response'];

    // Configure the request
    var options = {
        url: 'https://www.google.com/recaptcha/api/siteverify',
        method: 'POST',
        json: {'secret': process.env.CAPTCHA_SECRET, response:captcha_res, remoteip:req.connection.remoteAddress}
    };

    console.log(options);

    // Start the request
    const resp = await request(options);
    console.log("CAPTCHA RESPONSE",resp);
    if (!resp.success){
        console.log('CAPTCHA ERROR',resp['error-codes']);
        return res.render('error',{message:"Konto môže vytvoriť iba človek.", error:{}});
    }

    try {
        const s = await bcrypt.genSalt(1);
        const h = await bcrypt.hash(req.body.password, s);
        const u = await User.findOneActive({email:req.body.email});

        if (u) return res.render('error',{message:"Užívateľ už existuje", error:{}});

        const user = await User.create(
            {
                username: req.body.email,
                passwordHash: h,
                salt: s,
                fullName: req.body.email,
                email: req.body.email
            });
        console.log("User created: " + user.username + "===" + user.id);
        res.redirect('/profile');
    } catch (err) {
        res.render('error', {message:"Nepodarilo sa vytvoriť účet", error:err});
    }
    /*
    u = await uv.addNew(dbConnection, username, req.user.username, req.user.password, function(err, user){
        if (err) {
            console.log("Error creating signup record for "+username);
            return;
        }
        console.log("Signup created for "+username);
    });
    */

});
