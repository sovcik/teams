"use strict";

const log = require('../../logger');

const exp = {};

module.exports = exp;

const Env = mongoose.models.Env;
const DBREV = 0;

exp.upgrade = function(){
    new Promise(async function (fulfill, reject) {
            console.log("Upgrading to Rev."+DBREV);
            // if database revision is greater or equal
            // than the one we are upgrading to
            // then we have nothing to do
            const ee = Env.findOne();
            if (ee && ee.dbrev >= DBREV){
                log.INFO("Nothing to do. Already rev."+ee.dbrev);
                return fulfill(true);
            }

            try {
                // write event ids directly to team
                const ev = await TeamEvent.find();
                for (let e in ev) {
                    let t = await Team.FindOne({_id:e.teamId});
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
                log.FATAL("Error while upgrading DB to rev."+DBREV);
                return reject(err);
            }

            return fulfill(true);

    });
};