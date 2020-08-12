/* eslint-disable no-unused-vars */
/* eslint-disable no-async-promise-executor */

'use strict';

const debugLib = require('debug')('db-upgrade');
const logERR = require('debug')('ERROR:db-upgrade');
const logWARN = require('debug')('WARN:db-upgrade');
const logINFO = require('debug')('INFO:db-upgrade');

const exp = {};

module.exports = exp;

exp.upgrade = function() {
    new Promise(async function(fulfill, reject) {
        let s = false;
        try {
            logINFO('Starting database upgrade');
            //s = await require('./0001').upgrade();

            logINFO('Database upgrade completed');
            return fulfill(true);
        } catch (err) {
            return reject(err);
        }
    });
};
