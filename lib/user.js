/* eslint-disable no-unused-vars */
/* eslint-disable no-async-promise-executor */

'use strict';

const mongoose = require('mongoose');
const Promise = (mongoose.Promise = require('bluebird'));

const bcrypt = require('bcryptjs');
const email = require('./email');

const debugLib = require('debug')('lib-user');
const logERR = require('debug')('ERROR:lib-user');
const logWARN = require('debug')('WARN:lib-user');
const logINFO = require('debug')('INFO:lib-user');

const exp = {};

module.exports = exp;

const User = mongoose.models.User;

exp.setPassword = function(userId, profileId, newPwd, siteUrl) {
    return new Promise(async function(fulfill, reject) {
        const debug = debugLib.extend('setPwd');
        debug('setPwd  profileId=%s', profileId);

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

            logINFO('Password changed for %s by %s', user.username, userId);
            email.sendPasswordChangedNotification(user, siteUrl);
            fulfill(user);
        } catch (err) {
            logWARN('%s', err.message);
            reject(err);
        }
    });
};

exp.saveFields = function(userId, profileId, doc, siteUrl) {
    return new Promise(async function(fulfill, reject) {
        const debug = debugLib.extend('saveFields');
        debug('saveFields  profileId=%s', profileId);

        try {
            let userOld = await User.findById(profileId);
            if (!userOld) throw new Error('User not found id=' + profileId);

            let user = await User.findByIdAndUpdate(profileId, { $set: doc }, { new: true });
            if (!user) throw new Error('Failed saving user fields');

            logINFO('User fields saved for %s by %s', user.username, userId);
            email.sendProfileChangedNotification(userOld, user, siteUrl);
            fulfill(user);
        } catch (err) {
            logWARN('%s', err.message);
            reject(err);
        }
    });
};
