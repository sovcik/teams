"use strict";

const router = require('express').Router();

router.use('/invoice',require('./rt-p-invoice'));



module.exports = router;