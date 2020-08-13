/* eslint-disable no-unused-vars */
/* eslint-disable no-async-promise-executor */

'use strict';

const nodemailer = require('nodemailer');
const pug = require('pug');
const libFmt = require('./fmt');

const debugLib = require('debug')('lib-email');
const logERR = require('debug')('ERROR:lib-email');
const logWARN = require('debug')('WARN:lib-email');
const logINFO = require('debug')('INFO:lib-email');

const exp = {};
module.exports = exp;

const smtpConfig = {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_TLS == 'yes',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PWD
    }
};

const emailConfig = {
    subjectPrefix: '[FLL Slovensko] '
};

if (process.env.ENV == 'dev') emailConfig.subjectPrefix = '[DEV TEAMS] ';

exp.sendProfileChangedNotification = function(userOld, user, url) {
    try {
        const template = pug.compileFile('views/emails/profileChng.pug');

        let toEml = new Set();
        toEml.add(user.email);
        toEml.add(userOld.email);

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            subject: emailConfig.subjectPrefix + 'Profil zmeneny [' + userOld.username + ']',
            html: template({ user: userOld, siteUrl: url, link: url + '/profile/' + userOld._id }) // html body
        };

        exp.sendEmail(mailOptions, toEml, 'profile changed for user=' + userOld.username);
    } catch (err) {
        logERR(
            'Error sending profile change notification. user=%s err=%s',
            userOld.username,
            err.message
        );
    }
};

exp.sendPwdResetCode = function(user, ot, url) {
    try {
        const template = pug.compileFile('views/emails/pwdResetCode.pug');

        let toEml = new Set();
        toEml.add(user.email);

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            subject: emailConfig.subjectPrefix + 'Reset hesla [' + user.username + ']',
            html: template({
                user: user,
                siteUrl: url,
                link: url + '/profile/' + user.id + '?cmd=resetPwd&otc=' + ot.id
            }) // html body
        };

        exp.sendEmail(mailOptions, toEml, 'password reset user=' + user.username);
    } catch (err) {
        logERR('Error sending password reset code. user=%s err=%s', user.username, err.message);
    }
};

exp.sendSignupConfirmation = function(user, url) {
    try {
        const template = pug.compileFile('views/emails/signup_confirm.pug');

        let toEml = new Set();
        toEml.add(user.email);

        if (process.env.EMAIL_BCC_REGISTER) toEml.add(process.env.EMAIL_BCC_REGISTER);

        const mailOptions = {
            replyTo: process.env.EMAIL_BCC_REGISTER,
            from: process.env.EMAIL_FROM,
            subject: emailConfig.subjectPrefix + 'Vytvorenie účtu [' + user.username + ']',
            html: template({ user: user, siteUrl: url }) // html body
        };

        exp.sendEmail(mailOptions, toEml, 'account creation user=' + user.username);
    } catch (err) {
        logERR('Error sending confirmation. user=%s err=%s', user.username, err.message);
    }
};

exp.sendPasswordChangedNotification = function(user, url) {
    try {
        const template = pug.compileFile('views/emails/pwdchanged_notify.pug');

        let toEml = new Set();
        toEml.add(user.email);

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            subject: emailConfig.subjectPrefix + 'Heslo zmenené [' + user.username + ']',
            html: template({ user: user, siteUrl: url }) // html body
        };

        exp.sendEmail(mailOptions, toEml, 'password changed user=' + user.username);
    } catch (err) {
        logERR('Error sending notification. user=%s err=%s', user.username, err.message);
    }
};

exp.sendEventRegisterConfirmation = function(user, team, event, url) {
    const debug = debugLib.extend('sendEvtRegConf');
    debug('EMAIL registration confirmation %s to %s', event.name, user.email);
    try {
        const template = pug.compileFile('views/emails/event_team_register.pug');

        const mailOptions = {
            replyTo: process.env.EMAIL_BCC_REGISTER,
            from: process.env.EMAIL_FROM,
            subject:
                emailConfig.subjectPrefix + 'Registrácia na turnaj pre tim [' + team.name + ']',
            html: template({ user: user, team: team, event: event, siteUrl: url }) // html body
        };

        let toEml = new Set();
        toEml.add(user.email);

        if (process.env.EMAIL_BCC_REGISTER) toEml.add(process.env.EMAIL_BCC_REGISTER);

        // send registration to event managers too
        event.managers.forEach(m => toEml.add(m.email));

        exp.sendEmail(mailOptions, toEml, 'event registration team=' + team.name);
    } catch (err) {
        logERR(
            'Error sending event registration. team=%s event name=%s err=%s',
            team.name,
            event.name,
            err.message
        );
    }
};

exp.sendInvoice = async function(user, invoice, url) {
    const debug = debugLib.extend('sendInvoice');
    debug('EMAIL invoice %s', invoice.number);
    try {
        if (!invoice.team.name)
            logWARN('sendInvoice: invoice.team is not populated. invoice=%s', invoice.number);

        const template = pug.compileFile('views/emails/invoice.pug');

        let toEml = new Set();

        if (invoice.issuingContact && invoice.issuingContact.email)
            toEml.add(invoice.issuingContact.email);
        else logWARN('No email for invoice issuing contact specified. invoice=%s', invoice.number);

        if (invoice.billContact && invoice.billContact.email) toEml.add(invoice.billContact.email);
        else logWARN('No email for invoice billing contact specified. invoice=%s', invoice.number);

        if (process.env.EMAIL_BCC_INVOICE) toEml.add(process.env.EMAIL_BCC_INVOICE);

        if (user.email) toEml.add(user.email);

        const mailOptions = {
            replyTo: process.env.EMAIL_REPLYTO_BILLING,
            from: process.env.EMAIL_FROM,
            subject: emailConfig.subjectPrefix + 'Faktura ' + invoice.number,
            html: template({ user: user, inv: invoice, siteUrl: url, fmt: libFmt }) // html body
        };

        exp.sendEmail(mailOptions, toEml, 'invoice ' + invoice.number);
    } catch (err) {
        logERR(
            'Error sending invoice %s to email %s err=%s',
            invoice.number,
            user.email,
            err.message
        );
    }
};

exp.sendInvoicePaid = function(user, invoice, url) {
    const debug = debugLib.extend('sendInvPaid');
    debug('EMAIL invoice paid %s', invoice.number);
    try {
        if (!invoice.team.name)
            logWARN('sendInvoicePaid: invoice.team is not populated. invoice=%s', invoice.number);

        //const template = pug.compileFile('views/emails/message.pug');
        const template = pug.compileFile('views/emails/invoice.pug');

        let toEml = new Set();

        if (invoice.issuingContact && invoice.issuingContact.email)
            toEml.add(invoice.issuingContact.email);
        else logWARN('No email for invoice issuing contact specified. invoice=%s', invoice.number);

        if (invoice.billContact && invoice.billContact.email) toEml.add(invoice.billContact.email);
        else logWARN('No email for invoice billing contact specified. invoice=%s', invoice.number);

        if (process.env.EMAIL_BCC_INVOICE) toEml.add(process.env.EMAIL_BCC_INVOICE);

        if (user.email) toEml.add(user.email);

        const mailOptions = {
            replyTo: process.env.EMAIL_REPLYTO_BILLING,
            from: process.env.EMAIL_FROM,
            subject: emailConfig.subjectPrefix + 'Potvrdenie úhrady faktúry ' + invoice.number,
            html: template({ user: user, inv: invoice, siteUrl: url, fmt: libFmt }) // html body
            //html: template({siteUrl:url, title:"Faktúra bola zaplatená. Ďakujeme.", message:"Úhrada faktúry "+invoice.number+ " bola zaznamená dňa "+libFmt.fmtDate(invoice.paidOn,user.locales)+". Ďakujeme."}) // html body
        };

        exp.sendEmail(mailOptions, toEml, 'payment confirmation ' + invoice.number);
    } catch (err) {
        logERR(
            'Error sending payment confirmation for invoice %s to emails %s err=%s',
            invoice.number,
            user.email,
            err.message
        );
    }
};

exp.sendMessage = function(user, replyTo, toEml, cSubject, title, msg, url) {
    const debug = debugLib.extend('sendMessage');
    debug('EMAIL message ');
    try {
        const template = pug.compileFile('views/emails/message.pug');

        if (user.email) toEml.add(user.email);

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            replyTo: replyTo,
            subject: emailConfig.subjectPrefix + cSubject,
            html: template({ user: user, title: title, message: msg, siteUrl: url, fmt: libFmt }) // html body
        };

        exp.sendEmail(mailOptions, toEml, 'message');
    } catch (err) {
        logERR('Error sending message to email %s err=%s', user.email, err.message);
    }
};

exp.sendEmail = function(mailOpts, toList, debugPrefix) {
    const debug = debugLib.extend('sendEmail');
    const transporter = nodemailer.createTransport(smtpConfig);
    var toListStr = '';
    toList.forEach(s => (toListStr += s + ', '));
    debug('EMAIL: subject=%s to=%s', mailOpts.subject, toListStr);

    for (let eml of toList) {
        (function(opts) {
            transporter.sendMail(opts, function(error, info) {
                if (error) {
                    logWARN('EMAIL FAILED %s to %s err=%s', debugPrefix, opts.to, error.message);
                } else logINFO('EMAIL SENT %s to %s id=%s response=%s', debugPrefix, opts.to, info.messageId, info.response);
            });
        })(Object.assign({}, mailOpts, { to: eml }));
    }
};
