const mongoose = require('mongoose');
const Promise = mongoose.Promise = require('bluebird');
const bcrypt = require('bcryptjs');
const eachAsync = require('each-async');
const db = require('./common');
const moment = require('moment');

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

exp.testSeed = function() {
    return new Promise(async function (fulfill, reject) {
        try {
            await createAdmin('admin', 'admin');
            if (process.env.ENV != 'dev') {
                console.log("Not DEV environment - skipping seed");
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
            await exp.testSeedTeamEvents(data);
            console.log('==== TESTING');
            let myId = '00000000010000000002000' + '0';
            let teamId = '00000000010000000002000' + '0';
            let coachId = '00000000010000000002000' + '1';

            console.log("===== TEAM DETAILS START");
            let t = await dbTeam.getTeamDetails(myId, teamId);
            console.log("===== TEAM DETAILS RESULT");
            console.log(t);

            console.log("===== TEAM COACHES START");
            let tc = await dbTeam.getTeamCoaches(myId, teamId);
            console.log("===== TEAM COACHES RESULT");
            console.log(tc);

            console.log("===== TEAM MEMBERS START");
            let tm = await dbTeam.getTeamMembers(myId, teamId);
            console.log("===== TEAM MEMBERS RESULT");
            console.log(tm);
            return fulfill(true);
        } catch (err) {
            console.log("SEED error "+err.message);
            return reject(err);
        }

    })

};

function createAdmin(login, password){
    return new Promise(async function (fulfill, reject) {
        console.log("Creating admin user");
        try {
            var u = await User.findOneActive({username: login});
            if (!u) {
                const s = await bcrypt.genSalt(1);
                const h = await bcrypt.hash(password, s);
                u = await User.create(
                    {
                        username: 'admin',
                        passwordHash: h,
                        salt: s,
                        fullName: 'System admin',
                        isAdmin: true,
                        isSuperAdmin: true,
                        email: "admin@admin.admin"
                    });
                console.log("Admin user created");
            } else {
                console.log("Admin user already exists")
            }
            return fulfill(u);
        } catch(err) {
            console.log("Error creating Admin. ",err);
            return reject(err);
        }
    })
}

exp.testSeedOneTime = function(data){
    return new Promise(function (fulfill, reject) {
        if (!data) data = {};
        console.log("Seeding oneTime");
        try {
            const e = new OneTime();

            e.save();
            return fulfill(true);
        } catch (err) {
            return reject(err);
        }
    });

};

exp.testSeedEnv = function(data){
    return new Promise(function (fulfill, reject) {
        if (!data) data = {};
        console.log("Seeding env");
        try {
            const e = new Env();

            e.save();
            return fulfill(true);
        } catch (err) {
            console.log("Error seeding ENV "+err.message);
            return reject(err);
        }
    });

};

exp.testSeedTeams = function(data){
    return new Promise(function (fulfill, reject) {
        if (!data) data = {};
        data.teams = [];
        console.log("Seeding teams");
        eachAsync(
            [
                Team.testData({},'1'),
                Team.testData({},'2'),
                Team.testData({},'3'),
                Team.testData({},'4'),
                Team.testData({},'5')
            ],
            async function (item, index, done) {
                try {
                    const team = await Team.create(Object.assign(item, {_id:'00000000010000000002000'+index}));
                    console.log("Team created: " + team.name + "===" + team.id);
                    data.teams.push({id: team.id, name: team.name});
                    return done();
                } catch (err) {
                    reject(err);
                }
            },
            function (err) {
                if (err) reject(err);
                console.log("Finished teams");
                fulfill(data);
            })
    });

};

exp.testSeedUsers = async function(data){
    return new Promise(function (fulfill, reject){
        if (!data) data = {};
        data.users = [];
        eachAsync(
            [
                ['user1','pwd1'],
                ['user2','pwd2'],
                ['user3','pwd3'],
                ['user4','pwd4'],
                ['user5','pwd5']
            ],
            async function (item, index, done) {
                try {
                    const s = await bcrypt.genSalt(1);
                    const h = await bcrypt.hash(item[1], s);
                    const user = await User.create(
                        {
                            _id: '00000000010000000002000' + index,
                            username: item[0],
                            passwordHash: h,
                            salt: s,
                            fullName: 'Full ' + item[0],
                            email: item[0] + '@email.huhu'
                        });
                    console.log("User created: username=", user.username, "email=",user.email, "id=",user.id);
                    data.users.push({id: user.id, username: user.username, email:user.email});
                } catch (err) {
                    console.log("Error creating users: "+err.message);
                }
                return done();
            },
            function (err) {
                if (err) reject(err);
                console.log("Finished users");
                fulfill(data);
            })

    })
};

exp.testSeedTeamsCoaches = async function(data) {
    return new Promise(function (fulfill, reject) {
        if (!data) data = {};
        console.log("Assigning coaches");
        eachAsync(
            data.teams,
            async function (item, index, done) {
                const ut = await TeamUser.create(
                    {
                        teamId: item.id,
                        userId: data.users[index%data.users.length].id,
                        role: 'coach'
                    }
                );
                console.log("Coach for team",item.name,' is ',data.users[index%data.users.length].username);
                return done();
            },
            function (err){
                if (err) reject(err);
                console.log("Finished coaches");
                fulfill(data)
            }
        )

    });
};

exp.testSeedMembers = async function(data){
    return new Promise(
        function (fulfill, reject) {
            console.log('Seeding members');
            if (!data) data = {};
            eachAsync(
                data.teams,
                async function (item, index, done) {
                    for (let u of [1, 2, 3, 4, 5, 6]) {
                        let uId = '2'+index+'000000010000000002000' + u;
                        let uName = 'user' + u + '-' + index;
                        console.log("Creating member uid=",uId,"username=",uName);
                        const user = await User.create(
                            {
                                _id: uId,
                                fullName: 'Full '+uName,
                                username: uName,
                                email:"user"+u+index+"@test.test",
                                dateOfBirth: new Date(2000,u, index%20)
                            });
                        await TeamUser.create(
                            {
                                userId: uId,
                                teamId: item.id,
                                role: 'member'
                            }
                        );
                        console.log('Member ', uName, ' team ', item.name);

                    }

                    console.log("Members assigned to team: ", item.name);
                    return done();
                },
                function (err) {
                    if (err) reject(err);
                    console.log("Finished assigning team members");
                    fulfill(data);
                }
            )

        }
    )
};

exp.testSeedPrograms = function(data){
    return new Promise(
        async function (fulfill, reject) {
            console.log('Seeding programs');
            if (!data) data = {};
            data.programs = [];
            console.log(data);
            eachAsync(
                [
                    {id: '000000000000000000000011', name:'FLL 2017/2018 Slovensko', user:'user1', startDate:new Date(2017,3,10), endDate:new Date(2018,2,20), message:" Message 11"},
                    {id: '000000000000000000000012', name:'FLL 2018/2019 Slovensko', user:'user1', startDate:new Date(2018,3,9), endDate:new Date(2019,2,20), message:" Message 12"},
                    {id: '000000000000000000000021', name:'Zenit 2018', user:'user2', startDate:new Date(2018,0,1), endDate:new Date(2018,11,31), message:" Message 21"},
                    {id: '000000000000000000000022', name:'Zenit 2019', user:'user2', startDate:new Date(2019,0,1), endDate:new Date(2019,11,31), message:" Message 22"}
                ],
                async function (item, index, done) {
                    const u = await User.findOneActive({username:item.user});
                    const prog = await Program.create(
                        {
                            _id: item.id,
                            name: item.name,
                            managers: [u.id],
                            startDate: item.startDate,
                            endDate: item.endDate,
                            message: item.message
                        }
                    );
                    console.log('Program', prog.name, ' id ', prog._id);
                    item.id = prog.id;
                    data.programs.push({id: prog.id, name: prog.name});
                    return done();
                },
                function (err) {
                    if (err) reject(err);
                    console.log("Finished creating programs");
                    fulfill(data);
                }
            )

        }
    )
};

exp.testSeedEvents = function(data){
    return new Promise(
        async function (fulfill, reject) {
            console.log('Seeding program events');
            console.log(data);
            if (!data.programs)
                reject ("Error: Seed programs first");
            data.events = [];
            eachAsync(
                [
                    {progid: '000000000000000000000011', io:'000000000000000000000001', name:'FLL BA 2017', mgr:'user1', startDate:new Date(2017,11,5), regEndDate:new Date(2017,9,20)},
                    {progid: '000000000000000000000012', io:'000000000000000000000001', name:'FLL BA 2018', user:'user1', startDate:new Date(2018,11,1), regEndDate:new Date(2018,9,14)},
                    {progid: '000000000000000000000012', io:'000000000000000000000001', name:'FLL KE 2018', user:'user2', startDate:new Date(2019,0,11), regEndDate:new Date(2018,9,14)},
                    {progid: '000000000000000000000021', io:'000000000000000000000002', name:'Zenit 2018 BA', user:'user3', startDate:new Date(2018,9,20), regEndDate:new Date(2018,8,30)},
                    {progid: '000000000000000000000022', io:'000000000000000000000002', name:'Zenit 2019 BA', user:'user3', startDate:new Date(2019,9,21), regEndDate:new Date(2019,8,30)}
                ],
                async function (item, index, done) {

                    try {
                        const e = await Event.create({
                            _id: "00000000000000000000000" + (index+1),
                            name: item.name,
                            startDate: item.startDate,
                            regEndDate: item.regEndDate,
                            programId: item.progid,
                            invoicingOrg: item.io
                        });
                        console.log('Event', e.name, ' id ', e.id);
                        data.events.push({id: e.id, name: e.name, programId: e.programId, startDate:e.startDate, regEndDate:e.regEndDate});
                        return done();
                    } catch (err) {
                        console.log("Error=",err);
                        reject(err);
                    }

                },
                function (err) {
                    if (err) reject(err);
                    console.log("Finished creating events");
                    fulfill(data);
                }
            )

        }
    )
};

exp.testSeedTeamEvents = function(data){
    return new Promise(
        async function (fulfill, reject) {
            console.log('Seeding team events');
            console.log(data);
            data.teamEvents = [];
            eachAsync(
                data.events,
                async function (item, index, done) {
                    let dt = {
                        registeredOn: new Date(),
                        programId: item.programId,
                        eventId: item.id,
                        eventDate: item.startDate,
                        teamId: data.teams[index%data.teams.length].id,
                        teamNumber: "TeamNum"+index
                    };
                    const e = await TeamEvent.create(dt);
                    console.log('TeamEvent', e.teamNumber, ' id ', e.id);
                    data.teamEvents.push({id: e.id, teamId: e.teamId, teamNumber:e.teamNumber, eventId:e.eventId});
                    return done();
                },
                function (err) {
                    if (err) reject(err);
                    console.log("Finished creating team registration for events");
                    fulfill(data);
                }
            )

        }
    )
};

exp.testSeedInvoices = function(data){
    return new Promise(
        async function (fulfill, reject) {
            console.log('Seeding invoices');
            console.log(data);
            data.invoices = [];
            eachAsync(
                data.teams,
                async function (item, index, done) {
                    let uId = '00000000010000000002000' + (index + 1);
                    const e = await Invoice.create({
                        _id : uId,
                        number: "FA "+index+" "+item.name,
                        type: index%2?"I":"P",
                        team: item.id,
                        invoicingOrg: data.invoicingOrgs[0].id
                    });
                    Invoice.testData(e,index);
                    if (index%4){
                        e.dueOn.setDate(e.dueOn.getDate()-20);
                    }

                    e.updateTotal();
                    e.issuedOn.setDate(e.issuedOn.getDate()-index%3);
                    e.save();
                    console.log('Invoice', e.number, ' id ', e.id);
                    data.invoices.push({id: e.id, number: e.number, team: e.team});
                    return done();
                },
                function (err) {
                    if (err) reject(err);
                    console.log("Finished seeding invoices");
                    fulfill(data);
                }
            )

        }
    )
};

exp.testSeedInvoicingOrgs = function(data){
    return new Promise(
        async function (fulfill, reject) {
            console.log('Seeding invocing orgs');
            console.log(data);
            data.invoicingOrgs = [];
            const dt = [
                {
                    _id: '000000000000000000000001',
                    org: {
                        name: "FLL Slovensko"
                    },
                    nextInvNumber: 5,
                    nextNTInvNumber: 1011,
                    nextCEInvNumber: 900,
                    invNumPrefix: "FA",
                    ntInvNumPrefix: "PF",
                    crInvNumPrefix: "DP",
                    dueDays:21

                },
                {
                    _id: '000000000000000000000002',
                    org: {
                        name: "Zenit"
                    },
                    nextInvNumber: 100,
                    nextNTInvNumber: 902,
                    nextCEInvNumber: 1222,
                    invNumPrefix: "VF",
                    ntInvNumPrefix: "ZF",
                    crInvNumPrefix: "CR",
                    dueDays:14

                }
            ];
            eachAsync(
                dt,
                async function (item, index, done) {
                    try {
                        const io = await InvoicingOrg.create(item);
                        InvoicingOrg.testData(io, index);
                        io.save();
                        console.log('InvoicingOrg', io.org.name, ' id ', io.id);
                        data.invoicingOrgs.push({id: io.id, name: io.org.name});
                        return done();
                    } catch (err) {
                        console.log("Error=",err);
                        reject (err);
                    }
                },
                function (err) {
                    if (err) reject(err);
                    console.log("Finished seeding invoicing orgs");
                    fulfill(data);
                }
            )

        }
    )
};
