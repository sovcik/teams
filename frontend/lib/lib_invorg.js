'use strict';

var libInvOrg = {};

libInvOrg.addManager = function (invOrgId, username, callback) {
    if (typeof callback !== 'function')
        callback = function (res, err) {
            return;
        };

    console.log('Adding manager: user=' + username + ' invOrg=' + invOrgId);
    $.post(
        '/invorg/' + invOrgId,
        {
            cmd: 'addManager',
            username: username,
        },
        function (res) {
            console.log('addManager: Server returned', res);
            if (res.result == 'ok') {
                console.log('manager added to invorg=', res.invorg._id);
                callback(res);
            } else {
                console.log('Error adding manager to invorg.', res);
                callback(res, res.error);
            }
        }
    ).fail(function (err) {
        console.log('Error adding manager to invorg err=', err);
        callback(null, err);
    });
};

libInvOrg.createInvTemplate = function (invOrgId, tname, callback) {
    if (typeof callback !== 'function')
        callback = function (res, err) {
            return;
        };

    console.log('Creating invoice template invOrg=' + invOrgId + ' name=' + tname);
    $.post(
        '/invorg/' + invOrgId,
        {
            cmd: 'createTemplate',
            tname: tname,
        },
        function (res) {
            console.log('createInvTemplate: Server returned', res);
            if (res.result == 'ok') {
                console.log('template created ', res.tmpl);
                callback(res);
            } else {
                console.log('Error creating invoice template', res);
                callback(res, res.error);
            }
        }
    ).fail(function (err) {
        console.log('Error creating invoice template err=', err);
        callback(null, err);
    });
};
