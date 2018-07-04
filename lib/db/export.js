"use strict";

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

exp.exportProgramData = function(progId, eventId, privateData) {
    return new Promise(async function (fulfill, reject) {
        var data = {};
        try {
            log.INFO("Export: program id="+progId+"  eventId="+eventId+"  privateData="+privateData);

            let p = await Program.findById(progId,{name:1, managers:1},{lean:true});
            if (!p)
                throw new Error("Program not found id="+progId);

            let teq = {programId:p._id};

            if (eventId) {
                let e = await Event.findById(eventId, {name: 1, managers: 1}, {lean: true});
                if (!e)
                    throw new Error("Event not found id="+eventId);
                teq = {programId:p._id, eventId:e._id};
            }

            data.program = p;
            data.program.teams = [];

            let teList = await TeamEvent.find(teq,{},{lean:true});

            eachAsync(
                teList,
                async function(te, idx, next){

                    let selectTeamFields = {name:1, "foundingOrg.name":1, foundingAdr:1};
                    if (privateData)
                        selectTeamFields = {name:1, foundingOrg:1, foundingAdr:1, foundingContact:1, shippingOrg:1, shippingAdr:1, shippingContact:1};
                    
                    var t = await Team.findById(te.teamId, selectTeamFields, {lean:true});

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

                        let selectUserFields = {fullName:1};
                        if (privateData)
                            selectUserFields = {fullName:1,email:1,dateOfBirth:1};

                        t = await User.populate(t,{path:"coaches members", select:selectUserFields});
                        t.memberCount = t.members.length;

                        t.members = [];  // do not export member data for now

                        data.program.teams.push(t);

                        next();
                    } else {
                        log.ERROR("Failed to fetch team: id="+te.teamId+" referenced in TeamEvent "+te.id);
                    }
                },
                function (err) {
                    if (err) {
                        console.log("Error processing program events err=",err);
                        reject(err);
                    }
                    console.log("Finished processing program events");
                    return fulfill(data);
                }
            );

        } catch (err) {
            console.log(err);
            return reject(err);
        }

    })

};