/* eslint-disable no-unused-vars */
/* eslint-disable no-async-promise-executor */

'use strict';

const mongoose = require('mongoose');

const debugLib = require('debug')('db-up-0001');
const logERR = require('debug')('ERROR:db-up-0001');
const logWARN = require('debug')('WARN:db-up-0001');
const logINFO = require('debug')('INFO:db-up-0001');

const exp = {};

module.exports = exp;

const Env = mongoose.models.Env;
const Team = mongoose.models.Team;
const TeamEvent = mongoose.models.TeamEvent;
const DBREV = 0;

exp.upgrade = function() {
    new Promise(async function(fulfill, reject) {
        const debug = debugLib.extend('upgrade');
        debug('Upgrading to Rev.%s', DBREV);
        // if database revision is greater or equal
        // than the one we are upgrading to
        // then we have nothing to do
        const ee = Env.findOne();
        if (ee && ee.dbrev >= DBREV) {
            debug('Nothing to do. Already rev.%s', ee.dbrev);
            return fulfill(true);
        }

        try {
            // write event ids directly to team
            const ev = await TeamEvent.find();
            for (let e in ev) {
                let t = await Team.FindOne({ _id: e.teamId });
                t.event = e.eventId;
                t.save();
            }

            // remove collections obsolete from previous release
            // -- none --

            // upgrade collections

            // update database revision
            ee.dbrev = DBREV;
            await ee.save();
        } catch (err) {
            logERR('Error while upgrading DB to rev.%s', DBREV);
            return reject(err);
        }

        return fulfill(true);
    });
};
