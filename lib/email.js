"use strict";

const nodemailer = require('nodemailer');
const log = require('./logger');
const pug = require('pug');
const libFmt = require('./fmt');
const eachAsync = require('each-async');

const exp = {};
module.exports = exp;

const smtpConfig = {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: (process.env.SMTP_TLS == "yes"),
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PWD
        }
};

const emailConfig = {
    subjectPrefix: "[FLL Slovensko] "
};

if (process.env.ENV == 'dev')
    emailConfig.subjectPrefix = '[DEV TEAMS] ';

exp.sendSignupConfirmation = function(user,url){
    try {
        const template = pug.compileFile('views/emails/signup_confirm.pug');

        let toEml = [user.email];

        if (process.env.EMAIL_BCC_REGISTER)
            toEml.push(process.env.EMAIL_BCC_REGISTER);

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            subject: emailConfig.subjectPrefix+'Vytvorenie účtu',
            html: template({user: user, siteUrl:url}) // html body
        };

        exp.sendEmail(mailOptions, toEml, "account creation user="+user.username);

    } catch (err) {
        log.ERROR("Error sending confirmation. user="+user.username+" err="+err.message);
    }

};

exp.sendEventRegisterConfirmation = function(user, team, event, url){
    log.DEBUG('EMAIL registration confirmation '+event.name+' to '+user.email);
    try {
        const template = pug.compileFile('views/emails/event_team_register.pug');

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            subject: emailConfig.subjectPrefix+'Registrácia na turnaj',
            html: template({user: user, team:team, event:event, siteUrl:url}) // html body
        };

        let toEml = [user.email];

        if (process.env.EMAIL_BCC_REGISTER)
            toEml.push(process.env.EMAIL_BCC_REGISTER);

        // send registration to event managers too
        event.managers.forEach(m => toEml.push(m.email));

        exp.sendEmail(mailOptions, toEml, 'event registration team='+team.name);
    } catch (err) {
        log.ERROR("Error sending event registration. team="+team.name+"  event="+event.name+" err="+err.message);
    }

};

exp.sendInvoice = function(user, invoice, url){
    log.DEBUG('EMAIL invoice '+invoice.number);
    try {
        const template = pug.compileFile('views/invoice.pug');

        let toEml = [];

        if (invoice.issuingContact && invoice.issuingContact.email)
            toEml.push(invoice.issuingContact.email);
        else
            log.WARN("No email for invoice issuing contact specified. invoice="+invoice.number);

        if (invoice.billContact && invoice.billContact.email)
            toEml.push(invoice.billContact.email);
        else
            log.WARN("No email for invoice billing contact specified. invoice="+invoice.number);

        if (process.env.EMAIL_BCC_INVOICE)
            toEml.push(process.env.EMAIL_BCC_INVOICE);

        if (user.email)
            toEml.push(user.email);

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            subject: emailConfig.subjectPrefix+'Faktura',
            html: template({user: user, inv:invoice, siteUrl:url, fmt:libFmt}) // html body
        };

        exp.sendEmail(mailOptions, toEml, "invoice "+invoice.number);
    } catch (err) {
        log.ERROR("Error sending invoice "+invoice.number+" to "+user.email+" err="+err.message);
    }

};

exp.sendEmail = function(mailOpts, toList, debugPrefix){
    const transporter = nodemailer.createTransport(smtpConfig);
    log.INFO("EMAIL: subject="+mailOpts.subject+" to="+toList.toString());

    for (let eml of toList){
        (function(opts) {
            transporter.sendMail(opts, function (error, info) {
                if (error) {
                    log.WARN('EMAIL FAILED ' + debugPrefix + ': to=' + opts.to + ' err=' + error.message);
                } else
                    log.INFO('EMAIL SENT ' + debugPrefix + ': to=' + opts.to + ' id=' + info.messageId + ' response=' + info.response);
            });
        })(Object.assign({},mailOpts,{to:eml}));

    }
};
