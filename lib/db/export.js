const mongoose = require('mongoose');
const Promise = mongoose.Promise = require('bluebird');
const eachAsync = require('each-async');
const log = require('../logger');

const User = mongoose.models.User;
const Team = mongoose.models.Team;
const TeamUser = mongoose.models.TeamUser;
const TeamEvent = mongoose.models.TeamEvent;
const Program = mongoose.models.Program;
const Event = mongoose.models.Event;

const exp = {};

module.exports = exp;

exp.exportProgramData = function(progId) {
    return new Promise(async function (fulfill, reject) {
        var data = {};
        try {
            log.INFO("Export: program id="+progId);

            let p = await Program.findById(progId,{name:1, managers:1},{lean:true});
            if (!p)
                throw new Error("Program not found id="+progId);

            data.program = p;
            data.program.teams = [];

            let teList = await TeamEvent.find({programId:data.program._id},{},{lean:true});

            eachAsync(
                teList,
                async function(te, idx, next){
                    "use strict";

                    var t = await Team.findById(te.teamId,{name:1, billingOrg:1, billingAdr:1, billingContact:1, shippingOrg:1, shippingAdr:1, shippingContact:1},{lean:true});

                    if (t) {
                        te = await Event.populate(te,{path:"eventId",select:{name:1,startDate:1,endDate:1}});
                        t.event = te;

                        t.coaches = [];
                        t.members = [];

                        let mList = await TeamUser.find({teamId:t._id});

                        for (let m of mList)
                            if (m.role === 'coach')
                                t.coaches.push(m.userId);
                            else
                                t.members.push(m.userId);

                        t = await User.populate(t,{path:"coaches members", select:{fullName:1,email:1,dateOfBirth:1}});

                        data.program.teams.push(t);

                        next();
                    } else {
                        log.ERROR("Failed to fetch team: id="+te.teamId+" referenced in TeamEvent "+te.id);
                    }
                },
                function (err) {
                    if (err) reject(err);
                    console.log("Finished processing program events");
                    return fulfill(data);
                }
            );

        } catch (err) {
            return reject(err);
        }

    })

};