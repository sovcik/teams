const express = require('express');
const router = express.Router();

module.exports = router;

/* GET home page. */
router.get('/', function(req, res, next) {
    res.redirect('/profile');
});
