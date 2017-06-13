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
    try {
        template = pug.compileFile('views/emails/signup_confirm.pug');
        const transporter = nodemailer.createTransport(smtpConfig);

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: user.email,
            bcc: 'registracia@fll.sk',
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
    try {
        template = pug.compileFile('views/emails/event_team_register.pug');
        const transporter = nodemailer.createTransport(smtpConfig);

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: user.email,
            bcc: 'registracia@fll.sk',
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
