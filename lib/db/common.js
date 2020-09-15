/* eslint-disable no-unused-vars */
/* eslint-disable no-async-promise-executor */
'use strict';

const mongoose = require('mongoose');
const Promise = (mongoose.Promise = require('bluebird'));
const eachAsync = require('each-async');

const debugLib = require('debug')('lib-db-common');
const logERR = require('debug')('ERROR:lib-db-common');
const logWARN = require('debug')('WARN:lib-db-common');
const logINFO = require('debug')('INFO:lib-db-common');

const exp = (module.exports = {});

exp.url = process.env.DB_URL.replace(
    '$DB_USER',
    process.env.DB_USER ? process.env.DB_USER : ''
).replace(
    ':$DB_PWD@',
    process.env.DB_PWD ? ':' + process.env.DB_PWD + '@' : process.env.DB_USER ? '@' : ''
);

exp.init = function () {
    return new Promise(async function (fulfill, reject) {
        const debug = debugLib.extend('init');
        try {
            mongoose.set('useCreateIndex', true);
            mongoose.connection.on('error', function (err) {
                console.error.bind(console, 'connection error:');
                logERR('Database connection failed. err=%s', err.message);
            });

            mongoose.connection.once('open', function () {
                debug('Connected successfully to database %s', process.env.DB_URL);
            });

            debug('Connecting to %s', exp.url);
            mongoose.connect(exp.url, { useNewUrlParser: true, useUnifiedTopology: true });

            exp.conn = mongoose.connection;

            return fulfill(true);
        } catch (err) {
            return reject(err);
        }
    });
};

exp.deleteAll = async function () {
    return new Promise(function (fulfill, reject) {
        const debug = debugLib.extend('deleteAll');
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

        eachAsync(
            [
                [TeamUser, 'TeamUser'],
                [Team, 'Team'],
                [User, 'User'],
                [Event, 'Event'],
                [Program, 'Program'],
                [TeamEvent, 'TeamEvent'],
                [Invoice, 'Invoice'],
                [InvoicingOrg, 'InvoicingOrg'],
                [Env, 'Env'],
                [OneTime, 'OneTime'],
            ],
            async function (item, index, done) {
                debug('Removing %s', item[1]);
                try {
                    await item[0].deleteMany({}, async function (err) {
                        await item[0].collection.drop(function (err) {
                            done();
                        });
                    });
                } catch (err) {
                    debug('Failed to drop %s', item[1]);
                    done();
                }
            },
            fulfill
        );
    });
};
