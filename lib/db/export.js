const mongoose = require('mongoose');
const Promise = mongoose.Promise = require('bluebird');
const eachAsync = require('each-async');
const db = require('./common');
const log = require('../logger');

const User = mongoose.models.User;
const Team = mongoose.models.Team;
const TeamUser = mongoose.models.TeamUser;
const TeamEvent = mongoose.models.TeamEvent;
const Program = mongoose.models.Program;
const Event = mongoose.models.Event;
const Env = mongoose.models.Env;
const Invoice = mongoose.models.Invoice;
const InvoicingOrg = mongoose.models.InvoicingOrg;

const dbUser = require('./User');
const dbTeam = require('./Team');

const exp = {};

module.exports = exp;

exp.exportProgramData = function(progId) {
    return new Promise(async function (fulfill, reject) {
        const data = {};
        try {
            let p = await Program.findById(progId);
            if (!p)
                throw new Error("Program not found id="+progId);

            data.program = p;
            data.program.teams = [];

            let teList = await TeamEvent.find({programId:data.program.id});

            eachAsync(
                teList,
                async function(te, idx1, done1){
                    "use strict";
                    let team = await Team.findById(te.teamId);
                    if (team) {
                        let t = JSON.parse(JSON.stringify(team));
                        t.event = te;
                        t.coaches = [];
                        t.members = [];

                        let mList = await TeamUser.find({teamId:team.id});
                        console.log("MLIST",mList);
                        eachAsync(
                            mList,
                            async function(m, idx2, done2){
                                let u = await User.findById(m.userId);
                                console.log("USER",u);
                                if (!u)
                                    log.ERROR("Failed to fetch user: id="+m.userId+" referenced in Team "+team.id);
                                else
                                if (u.role === 'coach')
                                    t.coaches.push(u);
                                else
                                    t.members.push(u);
                                done2();
                            },
                            function (err) {
                                if (err) reject(err);
                                console.log("Finished processing team members");
                            }
                        );
                        data.program.teams.push(t);
                        console.log("TTTT",t)
                    } else {
                        log.ERROR("Failed to fetch team: id="+te.teamId+" referenced in TeamEvent "+te.id);
                    }
                    done1();
                },
                function (err) {
                    if (err) reject(err);
                    console.log("Finished processing program events");
                }
            );

            return fulfill(data);
        } catch (err) {
            return reject(err);
        }

    })

};