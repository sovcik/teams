const mongoose = require('mongoose');
const express = require('express');
const cel = require('connect-ensure-login');
const router = express.Router();

const Team = mongoose.model('Team');

module.exports = router;

router.get('/', cel.ensureLoggedIn('/login'), function (req, res, next) {

    res.render('profile', {user:req.user, coach:1, coachingTeams:['T1', 'T2', 'T3'], memberTeams:['M1','M2']});
});