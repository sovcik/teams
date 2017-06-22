"use strict";

const log = require('../../logger');

const exp = {};

module.exports = exp;

exp.upgrade = function(){
    new Promise(async function (fulfill, reject) {
        let s = false;
        try {
            log.INFO("Starting database upgrade");
            //s = await require('./0001').upgrade();


            log.INFO("Database upgrade completed");
            return fulfill(true);
        } catch (err) {
            return reject(err);
        }

    });
};
