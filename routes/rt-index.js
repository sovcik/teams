/* eslint-disable no-unused-vars */
/* eslint-disable no-async-promise-executor */

const express = require('express');
const router = express.Router();

module.exports = router;

/* GET home page. */
router.get('/', function(req, res, next) {
    res.redirect('/profile');
});
