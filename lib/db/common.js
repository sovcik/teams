"use strict";

const log = require('../logger');
const mongoose = require('mongoose');
const Promise = mongoose.Promise = require('bluebird');
const eachAsync = require('each-async');


const exp = module.exports = {};

const url = exp.url = "mongodb://"+process.env.DB_USER+":"+process.env.DB_PWD+"@"+process.env.DB_SERVER+"/"+process.env.DB_DATABASE;

exp.init = function(){
    return new Promise(async function (fulfill, reject) {
        try {
            console.log("Connecting to "+process.env.DB_SERVER+"/"+process.env.DB_DATABASE);
            mongoose.connection.on('error', function(err){
                console.error.bind(console, 'connection error:');
                log.FATAL("Database connection failed.");
                log.ERROR(err);
            });

            mongoose.connection.once('open', function() {
                console.log("Connected successfully to database @"+process.env.DB_SERVER+"/"+process.env.DB_DATABASE);
                log.INFO("Connected successfully to database @"+process.env.DB_SERVER+"/"+process.env.DB_DATABASE);
            });

            mongoose.connect(url);

            exp.conn = mongoose.connection;

            return fulfill(true);
        } catch (err) {
            return reject(err);
        }

    });
};

exp.deleteAll = async function(){
    return new Promise(function (fulfill, reject){
        const Env = mongoose.models.Env;
        const User = mongoose.models.User;
        const Program = mongoose.models.Program;
        const Event = mongoose.models.Event;
        const Team = mongoose.models.Team;
        const TeamUser = mongoose.models.TeamUser;
        const TeamEvent = mongoose.models.TeamEvent;
        const Invoice = mongoose.models.Invoice;
        const InvoicingOrg = mongoose.models.InvoicingOrg;
        const OneTime = mongoose.models.OneTime;

        eachAsync([
                [TeamUser,'TeamUser'],
                [Team,'Team'],
                [User,'User'],
                [Event,'Event'],
                [Program,'Program'],
                [TeamEvent,'TeamEvent'],
                [Invoice,'Invoice'],
                [InvoicingOrg,'InvoicingOrg'],
                [Env,'Env'],
                [OneTime,'OneTime']
            ],
            function (item, index, done) {
                console.log("Removing "+item[1]);
                if (item[0].collection.drop())
                    done();
                else
                    reject(new Error("Failed to drop collection "+item[0]));

            },
            fulfill
        );

    })

};



