"use strict";

const mongoose = require('mongoose');
const express = require('express');
const cel = require('connect-ensure-login');
const router = express.Router();
const email = require('../../lib/email');
const log = require('../../lib/logger');

const Invoice = mongoose.models.Invoice;

module.exports = router;

//router.get('/:invoiceId', cel.ensureLoggedIn('/login'), async function (req, res, next) {
router.get('/:invoiceId', async function (req, res, next) {
    const cmd = req.query.cmd;
    const invoiceId = req.params.invoiceId;
    console.log("/invoice - get");

    let inv;
    try {
        inv = await Invoice.findById(invoiceId);
    } catch (err) {

    }

    if (!inv)
        return res.render('error',{message:"Faktúra nenájdná",error:{}});

    //console.log("Rendering INVOICE",inv);

    return res.render('invoice',{inv:inv});

});
