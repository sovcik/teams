const nodemailer = require('nodemailer');
const log = require('./logger');
const pug = require('pug');

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

exp.sendSignupConfirmation = function(user){
    log.DEBUG('EMAIL signup confirmation to '+user.email);
    try {
        template = pug.compileFile('views/emails/signup_confirm.pug');
        const transporter = nodemailer.createTransport(smtpConfig);

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: user.email,
            bcc: process.env.EMAIL_BCC_REGISTER,
            subject: '[FLL Slovensko] Vytvorenie účtu',
            //text: 'Vytvorili ste ucet '+user.username,
            html: template({user: user}) // html body
        };


        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                log.ERROR("FAILED sending signup confirmation to " + mailOptions.to);
                log.ERROR(error);
                return;
            }
            log.INFO('Signup confirmation sent to ' + mailOptions.to + ' id=' + info.messageId + ' response=' + info.response);

        });
    } catch (err) {
        log.ERROR("Error sending confirmation.");
        log.ERROR(err);
    }

};

exp.sendEventRegisterConfirmation = function(user, team, event, url){
    log.DEBUG('EMAIL registration confirmation '+event.name+' to '+user.email);
    try {
        template = pug.compileFile('views/emails/event_team_register.pug');
        const transporter = nodemailer.createTransport(smtpConfig);

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: user.email,
            bcc: process.env.EMAIL_BCC_REGISTER,
            subject: '[FLL Slovensko] Registrácia na turnaj',
            //text: 'Vytvorili ste ucet '+user.username,
            html: template({user: user, team:team, event:event, siteUrl:url}) // html body
        };


        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                log.ERROR("FAILED sending event register confirmation to " + mailOptions.to);
                log.ERROR(error);
                return;
            }
            log.INFO('Event register confirmation sent to ' + mailOptions.to + ' id=' + info.messageId + ' response=' + info.response);

        });
    } catch (err) {
        log.ERROR("Error sending confirmation.");
        log.ERROR(err);
    }

};

exp.sendInvoice = function(user, invoice, url){
    log.DEBUG('EMAIL invoice '+invoice.number);
    console.log("INVOICE***",invoice);
    try {
        template = pug.compileFile('views/invoice.pug');
        const transporter = nodemailer.createTransport(smtpConfig);

        let toAddr = "";

        if (invoice.issuingContact && invoice.issuingContact.email)
            toAddr += invoice.issuingContact.email;
        else
            log.WARN("No email for invoice issuing contact specified");

        if (invoice.billContact && invoice.billContact.email)
            toAddr += ", " + invoice.billContact.email;
        else
            log.WARN("No email for invoice billing contact specified");

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: toAddr,
            bcc: process.env.EMAIL_BCC_INVOICE + user.email?', '+user.email:'',
            subject: '[FLL Slovensko] Faktura',
            //text: 'Vytvorili ste ucet '+user.username,
            html: template({user: user, inv:invoice, siteUrl:url}) // html body
        };


        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                log.ERROR("FAILED sending invoice "+invoice.number+" to " + mailOptions.to);
                log.ERROR(error);
                return;
            }
            log.INFO('Invoice '+invoice.number+' sent to ' + mailOptions.to + ' id=' + info.messageId + ' response=' + info.response);

        });
    } catch (err) {
        log.ERROR("Error sending invoice "+invoice.number+" to "+user.email);
        log.ERROR(err);
    }

};
