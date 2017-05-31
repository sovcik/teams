const express = require('express');
const router = express.Router();
const cel = require('connect-ensure-login');
const dbTeam = require('../lib/db/Team');

module.exports = router;

router.get('/', cel.ensureLoggedIn('/login'), function (req, res, next) {
    const teamId = req.query.id;

    if (!teamId) res.redirect('/profile');

    dbTeam.getTeamDetails(req.user.id, teamId)
        .then(
            function (team) {
                res.render('team', {team:team});
            }
        )
        .catch(
            function (err){
                res.status(404).end();
            }
        )

});
