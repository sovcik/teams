'use strict';

const mongoose = require('mongoose');
const Promise = (mongoose.Promise = require('bluebird'));

const bcrypt = require('bcryptjs');
const log = require('./logger');
const email = require('./email');

const exp = {};

module.exports = exp;

const User = mongoose.models.User;

exp.setPassword = function(userId, profileId, newPwd, siteUrl) {
    return new Promise(async function(fulfill, reject) {
        console.log('setPwd  profileId=', profileId);

        try {
            // create new password
            let s = await bcrypt.genSalt(5);
            let h = await bcrypt.hash(newPwd, s);

            let user = await User.findByIdAndUpdate(
                profileId,
                { $set: { salt: s, passwordHash: h } },
                { new: true }
            );
            if (!user) throw new Error('Failed changing password');

            log.INFO('Password changed for ' + user.username + ' by ' + userId);
            email.sendPasswordChangedNotification(user, siteUrl);
            fulfill(user);
        } catch (err) {
            log.WARN(err.message);
            reject(err);
        }
    });
};

exp.saveFields = function(userId, profileId, doc, siteUrl) {
    return new Promise(async function(fulfill, reject) {
        log.DEBUG('saveFields  profileId=' + profileId);

        try {
            let userOld = await User.findById(profileId);
            if (!userOld) throw new Error('User not found id=' + profileId);

            let user = await User.findByIdAndUpdate(profileId, { $set: doc }, { new: true });
            if (!user) throw new Error('Failed saving user fields');

            log.INFO('User fields saved for ' + user.username + ' by ' + userId);
            email.sendProfileChangedNotification(userOld, user, siteUrl);
            fulfill(user);
        } catch (err) {
            log.WARN(err.message);
            reject(err);
        }
    });
};
