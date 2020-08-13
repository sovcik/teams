/* eslint-disable no-unused-vars */
/* eslint-disable no-async-promise-executor */

const mongoose = require('mongoose');
const Promise = (mongoose.Promise = require('bluebird'));
const bcrypt = require('bcryptjs');
const eachAsync = require('each-async');
const db = require('./common');

const debugLib = require('debug')('db-seed');
const logERR = require('debug')('ERROR:db-seed');
const logWARN = require('debug')('WARN:db-seed');
const logINFO = require('debug')('INFO:db-seed');

const User = mongoose.models.User;
const Team = mongoose.models.Team;
const TeamUser = mongoose.models.TeamUser;
const TeamEvent = mongoose.models.TeamEvent;
const Program = mongoose.models.Program;
const Event = mongoose.models.Event;
const Env = mongoose.models.Env;
const Invoice = mongoose.models.Invoice;
const InvoicingOrg = mongoose.models.InvoicingOrg;
const OneTime = mongoose.models.OneTime;

const dbUser = require('./User');
const dbTeam = require('./Team');

const exp = {};

module.exports = exp;

exp.testSeed = function () {
    return new Promise(async function (fulfill, reject) {
        const debug = debugLib.extend('testSeed');
        try {
            await createAdmin('admin', 'admin');
            if (process.env.ENV != 'dev') {
                debug('Not DEV environment - skipping seed');
                return fulfill(true);
            }
            const data = {};
            await db.deleteAll();
            await createAdmin('admin', 'admin');
            await exp.testSeedEnv(data);
            await exp.testSeedUsers(data);
            await exp.testSeedPrograms(data);
            await exp.testSeedInvoicingOrgs(data);
            await exp.testSeedEvents(data);
            await exp.testSeedTeams(data);
            await exp.testSeedTeamsCoaches(data);
            await exp.testSeedMembers(data);
            await exp.testSeedInvoices(data);
            await exp.testSeedInvoiceTemplates(data);
            await exp.testSeedTeamEvents(data);
            debug('==== TESTING');
            let myId = '00000000010000000002000' + '0';
            let teamId = '00000000010000000002000' + '0';
            let coachId = '00000000010000000002000' + '1';

            debug('===== TEAM DETAILS START');
            let t = await dbTeam.getTeamDetails(myId, teamId);
            debug('===== TEAM DETAILS RESULT');
            debug('%O', t);

            debug('===== TEAM COACHES START');
            let tc = await dbTeam.getTeamCoaches(myId, teamId);
            debug('===== TEAM COACHES RESULT');
            debug('%O', tc);

            debug('===== TEAM MEMBERS START');
            let tm = await dbTeam.getTeamMembers(myId, teamId);
            debug('===== TEAM MEMBERS RESULT');
            debug('%O', tm);
            return fulfill(true);
        } catch (err) {
            logERR('SEED error err=%s', err.message);
            return reject(err);
        }
    });
};

function createAdmin(login, password) {
    return new Promise(async function (fulfill, reject) {
        const debug = debugLib.extend('createAdmin');
        debug('Creating admin user');
        try {
            var u = await User.findOneActive({ username: login });
            if (!u) {
                const s = await bcrypt.genSalt(1);
                const h = await bcrypt.hash(password, s);
                u = await User.create({
                    username: 'admin',
                    passwordHash: h,
                    salt: s,
                    fullName: 'System admin',
                    isAdmin: true,
                    isSuperAdmin: true,
                    email: 'admin@admin.admin',
                });
                debug('Admin user created');
            } else {
                debug('Admin user already exists');
            }
            return fulfill(u);
        } catch (err) {
            logERR('Error creating Admin. %s', err.message);
            return reject(err);
        }
    });
}

exp.testSeedOneTime = function (data) {
    return new Promise(function (fulfill, reject) {
        const debug = debugLib.extend('testSeedOneTime');
        if (!data) data = {};
        debug('Seeding oneTime');
        try {
            const e = new OneTime();

            e.save();
            return fulfill(true);
        } catch (err) {
            return reject(err);
        }
    });
};

exp.testSeedEnv = function (data) {
    return new Promise(function (fulfill, reject) {
        const debug = debugLib.extend('testSeedEnv');
        if (!data) data = {};
        debug('Seeding env');
        try {
            const e = new Env();

            e.save();
            return fulfill(true);
        } catch (err) {
            logERR('Error seeding ENV err=%s', err.message);
            return reject(err);
        }
    });
};

exp.testSeedTeams = function (data) {
    return new Promise(function (fulfill, reject) {
        const debug = debugLib.extend('testSeedTeams');
        if (!data) data = {};
        data.teams = [];
        debug('Seeding teams');
        eachAsync(
            [
                Team.testData({}, '1'),
                Team.testData({}, '2'),
                Team.testData({}, '3'),
                Team.testData({}, '4'),
                Team.testData({}, '5'),
            ],
            async function (item, index, done) {
                try {
                    const team = await Team.create(
                        Object.assign(item, { _id: '00000000010000000002000' + index })
                    );
                    debug('Team created: %s id=%s ', team.name, team.id);
                    data.teams.push({ id: team.id, name: team.name });
                    return done();
                } catch (err) {
                    reject(err);
                }
            },
            function (err) {
                if (err) reject(err);
                debug('Finished teams');
                fulfill(data);
            }
        );
    });
};

exp.testSeedUsers = async function (data) {
    return new Promise(function (fulfill, reject) {
        const debug = debugLib.extend('testSeedUsers');
        if (!data) data = {};
        data.users = [];
        eachAsync(
            [
                ['user1', 'pwd1'],
                ['user2', 'pwd2'],
                ['user3', 'pwd3'],
                ['user4', 'pwd4'],
                ['user5', 'pwd5'],
            ],
            async function (item, index, done) {
                try {
                    const s = await bcrypt.genSalt(1);
                    const h = await bcrypt.hash(item[1], s);
                    const user = await User.create({
                        _id: '00000000010000000002000' + index,
                        username: item[0],
                        passwordHash: h,
                        salt: s,
                        fullName: 'Full ' + item[0],
                        email: item[0] + '@email.huhu',
                    });
                    debug(
                        'User created: username=%s email=%s id=%s',
                        user.username,
                        user.email,
                        user.id
                    );
                    data.users.push({ id: user.id, username: user.username, email: user.email });
                } catch (err) {
                    logERR('Error creating users: %s', err.message);
                }
                return done();
            },
            function (err) {
                if (err) reject(err);
                debug('Finished users');
                fulfill(data);
            }
        );
    });
};

exp.testSeedTeamsCoaches = async function (data) {
    return new Promise(function (fulfill, reject) {
        const debug = debugLib.extend('testSeedTeamsCoaches');
        if (!data) data = {};
        debug('Assigning coaches');
        eachAsync(
            data.teams,
            async function (item, index, done) {
                const ut = await TeamUser.create({
                    teamId: item.id,
                    userId: data.users[index % data.users.length].id,
                    role: 'coach',
                });
                debug(
                    'Coach for team %s is %s',
                    item.name,
                    data.users[index % data.users.length].username
                );
                return done();
            },
            function (err) {
                if (err) reject(err);
                debug('Finished coaches');
                fulfill(data);
            }
        );
    });
};

exp.testSeedMembers = async function (data) {
    return new Promise(function (fulfill, reject) {
        const debug = debugLib.extend('testSeedMembers');
        debug('Seeding members');
        if (!data) data = {};
        eachAsync(
            data.teams,
            async function (item, index, done) {
                for (let u of [1, 2, 3, 4, 5, 6]) {
                    let uId = '2' + index + '000000010000000002000' + u;
                    let uName = 'user' + u + '-' + index;
                    debug('Creating member uid=%s username=%s', uId, uName);
                    const user = await User.create({
                        _id: uId,
                        fullName: 'Full ' + uName,
                        username: uName,
                        email: 'user' + u + index + '@test.test',
                        dateOfBirth: new Date(2000, u, index % 20),
                    });
                    await TeamUser.create({
                        userId: uId,
                        teamId: item.id,
                        role: 'member',
                    });
                    debug('Member %s team %s', uName, item.name);
                }

                debug('Members assigned to team: %s', item.name);
                return done();
            },
            function (err) {
                if (err) reject(err);
                debug('Finished assigning team members');
                fulfill(data);
            }
        );
    });
};

exp.testSeedPrograms = function (data) {
    return new Promise(async function (fulfill, reject) {
        const debug = debugLib.extend('testSeedPrograms');
        debug('Seeding programs');
        if (!data) data = {};
        data.programs = [];
        debug('%O', data);
        let y = new Date().getFullYear();
        eachAsync(
            [
                {
                    id: '000000000000000000000011',
                    name: 'FLL ' + (y - 1) + '/' + y + ' Slovensko',
                    user: 'user1',
                    startDate: new Date(y - 1, 3, 10),
                    endDate: new Date(y, 2, 20),
                    message: ' Message 11',
                },
                {
                    id: '000000000000000000000012',
                    name: 'FLL ' + y + '/' + (y + 1) + ' Slovensko',
                    user: 'user1',
                    startDate: new Date(y, 3, 9),
                    endDate: new Date(y + 1, 2, 20),
                    message: ' Message 12',
                },
                {
                    id: '000000000000000000000021',
                    name: 'Zenit 2018',
                    user: 'user2',
                    startDate: new Date(2018, 0, 1),
                    endDate: new Date(2018, 11, 31),
                    message: ' Message 21',
                },
                {
                    id: '000000000000000000000022',
                    name: 'Zenit 2019',
                    user: 'user2',
                    startDate: new Date(2019, 0, 1),
                    endDate: new Date(2019, 11, 31),
                    message: ' Message 22',
                },
            ],
            async function (item, index, done) {
                const u = await User.findOneActive({ username: item.user });
                const prog = await Program.create({
                    _id: item.id,
                    name: item.name,
                    managers: [u.id],
                    startDate: item.startDate,
                    endDate: item.endDate,
                    message: item.message,
                });
                debug('Program %s id=%s', prog.name, prog._id);
                item.id = prog.id;
                data.programs.push({ id: prog.id, name: prog.name });
                return done();
            },
            function (err) {
                if (err) reject(err);
                debug('Finished creating programs');
                fulfill(data);
            }
        );
    });
};

exp.testSeedEvents = function (data) {
    return new Promise(async function (fulfill, reject) {
        const debug = debugLib.extend('testSeedEvents');
        debug('Seeding program events');
        debug('%O', data);
        if (!data.programs) reject('Error: Seed programs first');
        data.events = [];
        let y = new Date().getFullYear();
        eachAsync(
            [
                {
                    progid: '000000000000000000000011',
                    io: '000000000000000000000001',
                    name: 'FLL BA ' + y,
                    mgr: 'user1',
                    startDate: new Date(y, 11, 5),
                    regEndDate: new Date(y, 9, 20),
                },
                {
                    progid: '000000000000000000000012',
                    io: '000000000000000000000001',
                    name: 'FLL BA ' + (y - 1),
                    user: 'user1',
                    startDate: new Date(y - 1, 11, 1),
                    regEndDate: new Date(y - 1, 9, 14),
                },
                {
                    progid: '000000000000000000000012',
                    io: '000000000000000000000001',
                    name: 'FLL KE ' + y,
                    user: 'user2',
                    startDate: new Date(y, 0, 11),
                    regEndDate: new Date(y, 9, 14),
                },
                {
                    progid: '000000000000000000000021',
                    io: '000000000000000000000002',
                    name: 'Zenit ' + (y - 1) + ' BA',
                    user: 'user3',
                    startDate: new Date(y - 1, 9, 20),
                    regEndDate: new Date(y - 1, 8, 30),
                },
                {
                    progid: '000000000000000000000022',
                    io: '000000000000000000000002',
                    name: 'Zenit ' + y + ' BA',
                    user: 'user3',
                    startDate: new Date(y, 9, 21),
                    regEndDate: new Date(y, 8, 30),
                },
            ],
            async function (item, index, done) {
                try {
                    const e = await Event.create({
                        _id: '00000000000000000000000' + (index + 1),
                        name: item.name,
                        startDate: item.startDate,
                        regEndDate: item.regEndDate,
                        programId: item.progid,
                        invoicingOrg: item.io,
                    });
                    debug('Event %s id=%s', e.name, e.id);
                    data.events.push({
                        id: e.id,
                        name: e.name,
                        programId: e.programId,
                        startDate: e.startDate,
                        regEndDate: e.regEndDate,
                    });
                    return done();
                } catch (err) {
                    logERR('Error seeding events err=%s', err.message);
                    reject(err);
                }
            },
            function (err) {
                if (err) reject(err);
                debug('Finished creating events');
                fulfill(data);
            }
        );
    });
};

exp.testSeedTeamEvents = function (data) {
    return new Promise(async function (fulfill, reject) {
        const debug = debugLib.extend('testSeedTeamEvents');
        debug('Seeding team events');
        debug('%O', data);
        data.teamEvents = [];
        eachAsync(
            data.events,
            async function (item, index, done) {
                let dt = {
                    registeredOn: item.startDate,
                    programId: item.programId,
                    eventId: item.id,
                    eventDate: item.regEndDate,
                    teamId: data.teams[index % data.teams.length].id,
                    teamNumber: 'TeamNum' + index,
                };
                const e = await TeamEvent.create(dt);
                debug('TeamEvent %s id=%s', e.teamNumber, e.id);
                data.teamEvents.push({
                    id: e.id,
                    teamId: e.teamId,
                    teamNumber: e.teamNumber,
                    eventId: e.eventId,
                });
                return done();
            },
            function (err) {
                if (err) reject(err);
                debug('Finished creating team registration for events');
                fulfill(data);
            }
        );
    });
};

exp.testSeedInvoices = function (data) {
    return new Promise(async function (fulfill, reject) {
        const debug = debugLib.extend('testSeedInvoices');
        debug('Seeding invoices');
        debug('%O', data);
        data.invoices = [];
        eachAsync(
            data.teams,
            async function (item, index, done) {
                let uId = '00000000010000000002000' + (index + 1);
                const e = await Invoice.create({
                    _id: uId,
                    number: 'FA ' + index + ' ' + item.name,
                    type: index % 2 ? 'I' : 'P',
                    team: item.id,
                    invoicingOrg: data.invoicingOrgs[0].id,
                });
                Invoice.testData(e, index);
                if (index % 4) {
                    e.dueOn.setDate(e.dueOn.getDate() - 20);
                }

                e.updateTotal();
                e.issuedOn.setDate(e.issuedOn.getDate() - (index % 3));
                e.save();
                debug('Invoice %s id=%s', e.number, e.id);
                data.invoices.push({ id: e.id, number: e.number, team: e.team });
                return done();
            },
            function (err) {
                if (err) reject(err);
                debug('Finished seeding invoices');
                fulfill(data);
            }
        );
    });
};

exp.testSeedInvoiceTemplates = function (data) {
    return new Promise(async function (fulfill, reject) {
        const debug = debugLib.extend('testSeedInvTempls');
        debug('Seeding invoice templates');
        debug('%o', data);
        if (!data.invoices) data.invoices = [];
        eachAsync(
            data.invoicingOrgs,
            async function (item, index, done) {
                let uId = '00000000010000000003000' + (index + 1);
                let inv = await Invoice({ _id: uId });
                inv.type = 'T'; // creating new invoice template
                inv.number = 'Template ' + index;
                inv.isDraft = false;
                inv.invoicingOrg = item.id;
                inv.team = '000000000000000000000000'; // dummy team id

                inv.items = [];
                inv.items.push({
                    itemNo: 1,
                    text: 'Template line 1' + index,
                    unit: 'pcs',
                    qty: 1,
                    unitPrice: 1.0,
                    total: 1.0,
                });
                inv.items.push({
                    itemNo: 2,
                    text: 'Template line 2' + index,
                    unit: 'pcs',
                    qty: 2,
                    unitPrice: 2.0,
                    total: 2.0,
                });

                inv.currency = '€';
                inv.total = 0;
                inv.items.forEach((i) => (inv.total += i.total));

                inv.total = inv.total.toFixed(2);

                debug('ITEM=%s', item);

                inv = await inv.save();

                inv.updateTotal();
                inv.save();
                debug('Invoice template %s id=%s', inv.number, inv.id);
                data.invoices.push({ id: inv.id, number: inv.number, team: inv.team });
                return done();
            },
            function (err) {
                if (err) reject(err);
                debug('Finished seeding invoices');
                fulfill(data);
            }
        );
    });
};

exp.testSeedInvoicingOrgs = function (data) {
    return new Promise(async function (fulfill, reject) {
        const debug = debugLib.extend('testSeedInvOrgs');
        debug('Seeding invocing orgs');
        debug('%o', data);
        data.invoicingOrgs = [];

        const dt = [
            {
                _id: '000000000000000000000001',
                org: {
                    name: 'FLL Slovensko',
                },
                nextInvNumber: 5,
                nextNTInvNumber: 1011,
                nextCEInvNumber: 900,
                invNumPrefix: 'FA',
                ntInvNumPrefix: 'PF',
                crInvNumPrefix: 'DP',
                dueDays: 21,
                mgr: 'user1',
            },
            {
                _id: '000000000000000000000002',
                org: {
                    name: 'Zenit',
                },
                nextInvNumber: 100,
                nextNTInvNumber: 902,
                nextCEInvNumber: 1222,
                invNumPrefix: 'VF',
                ntInvNumPrefix: 'ZF',
                crInvNumPrefix: 'CR',
                dueDays: 14,
                mgr: 'user2',
            },
        ];
        eachAsync(
            dt,
            async function (item, index, done) {
                try {
                    const u = await User.findOneActive({ username: item.mgr });
                    const io = await InvoicingOrg.create(item);
                    InvoicingOrg.testData(io, index);
                    io.org.name = item.org.name;
                    io.managers.push(u.id);
                    io.save();
                    debug('InvoicingOrg %s id=%s', io.org.name, io.id);
                    data.invoicingOrgs.push({ id: io.id, name: io.org.name });
                    return done();
                } catch (err) {
                    logERR('Error seeding IOrgs err=%s', err.message);
                    reject(err);
                }
            },
            function (err) {
                if (err) reject(err);
                debug('Finished seeding invoicing orgs');
                fulfill(data);
            }
        );
    });
};
