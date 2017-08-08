"use strict";

const mongoose = require('mongoose');
const Promise = mongoose.Promise = require('bluebird');

const bcrypt = require('bcrypt');
const log = require('./logger');
const email = require('./email');

const exp = {};

module.exports = exp;

const User = mongoose.models.User;

exp.setPassword = function(userId, profileId, newPwd, siteUrl){
    return new Promise(
        async function(fulfill, reject) {

            console.log("setPwd  profileId=", profileId);

            try {
                // create new password
                let s = await bcrypt.genSalt(5);
                let h = await bcrypt.hash(newPwd, s);

                let user = await User.findByIdAndUpdate(profileId, { $set: { salt: s, passwordHash:h}}, { new: true });
                if (!user) throw new Error("Failed changing password");

                log.INFO("Password changed for " + user.username +" by " + userId);
                email.sendPasswordChangedNotification(user, siteUrl);
                fulfill(user);
            } catch (err) {
                loq.WARN(err.message);
                reject(err);
            }
        }
    )
};
