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

exp.sendSignupConfirmation = function(user,url){
    try {
        const template = pug.compileFile('views/emails/signup_confirm.pug');

        let emls = [user.email];

        if (process.env.EMAIL_BCC_REGISTER)
            emls.push(process.env.EMAIL_BCC_REGISTER);

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            subject: '[FLL Slovensko] Vytvorenie účtu',
            html: template({user: user, siteUrl:url}) // html body
        };

        exp.sendEmail(mailOptions, emls, "account creation user="+user.username);

    } catch (err) {
        log.ERROR("Error sending confirmation. user="+user.username);
        log.ERROR(err);
    }

};

exp.sendEventRegisterConfirmation = function(user, team, event, url){
    log.DEBUG('EMAIL registration confirmation '+event.name+' to '+user.email);
    try {
        const template = pug.compileFile('views/emails/event_team_register.pug');

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            subject: '[FLL Slovensko] Registrácia na turnaj',
            html: template({user: user, team:team, event:event, siteUrl:url}) // html body
        };

        let emls = [user.email];

        if (process.env.EMAIL_BCC_REGISTER)
            emls.push(process.env.EMAIL_BCC_REGISTER);

        // send registration to event managers too
        event.managers.forEach(m => emls.push(m.email));

        exp.sendEmail(mailOptions, emls, 'event registration team='+team.name);
    } catch (err) {
        log.ERROR("Error sending event registration. team="+team.name+"  event="+event.name);
        log.ERROR(err);
    }

};

exp.sendInvoice = function(user, invoice, url){
    log.DEBUG('EMAIL invoice '+invoice.number);
    console.log("INVOICE***",invoice);
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
            subject: '[FLL Slovensko] Faktura',
            html: template({user: user, inv:invoice, siteUrl:url, fmt:libFmt}) // html body
        };

        exp.sendEmail(mailOptions, toList, "invoice "+invoice.number);
    } catch (err) {
        log.ERROR("Error sending invoice "+invoice.number+" to "+user.email);
        log.ERROR(err);
    }

};

exp.sendEmail = function(mailOpts, toList, debugPrefix){
    const transporter = nodemailer.createTransport(smtpConfig);

    eachAsync(
        toList,
        function(eml, idx, done){
            log.DEBUG('EMAIL '+debugPrefix+' to '+eml);
            mailOpts.to = eml;
            transporter.sendMail(mailOpts, (error, info) => {
                if (error) {
                    log.WARN('FAILED sending '+debugPrefix+' to ' + mailOpts.to);
                    log.WARN(error);
                    return;
                }
                log.INFO('Sent '+debugPrefix+' to ' + mailOpts.to + ' id=' + info.messageId + ' response=' + info.response);
                done();
            });

        },
        function(err){
            if (err)
                log.ERROR("Error emailing "+debugPrefix);
            else
                log.INFO("Sending "+debugPrefix+" completed");
        }
    )

};