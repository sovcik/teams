'use strict';

var libEvent = {};

libEvent.exportData = function (eventId, cb) {
    console.log('Exporting event data');
    $.get('/event/' + eventId + '?cmd=export', function (res) {
        console.log('exportEvent: Server returned', res);
        if (res.result === 'ok') {
            return cb(res);
        } else {
            console.log('exportEvent: Server returned ERROR');
            return cb(null);
        }
    });
};

libEvent.deregisterTeam = function (eventId, username, teamId, callback) {
    if (typeof callback !== 'function')
        callback = function (res, err) {
            return;
        };

    console.log('Deregistering team: user=' + username + ' event=' + eventId + ' team=' + teamId);
    $.post(
        '/event/' + eventId,
        {
            cmd: 'deregisterTeam',
            eventId: eventId,
            teamId: teamId,
        },
        function (res) {
            console.log('Deregister: Server returned', res);
            if (res.result == 'ok') {
                console.log('team deregistered from event');
                callback(res);
            } else {
                console.log('Error deregistering team from.', res);
                callback(res, res.error);
            }
        }
    ).fail(function (err) {
        console.log('Error deregistreing team from event err=', err);
        callback(null, err);
    });
};

libEvent.addRole = function (eventId, username, role, callback) {
    if (typeof callback !== 'function')
        callback = function (res, err) {
            return;
        };

    console.log('Adding role: user=', username, 'role=', role, 'event=', eventId);
    $.post(
        '/event/' + eventId,
        {
            cmd: 'addRole',
            username: username,
            role: role,
        },
        function (res) {
            console.log('addRole: Server returned', res);
            if (res.result == 'ok') {
                console.log('event role added to event=', res.event._id);
                callback(res);
            } else {
                console.log('Error adding role to event.', res);
                callback(res, res.error);
            }
        }
    ).fail(function (err) {
        console.log('Error adding role to event err=', err);
        callback(null, err);
    });
};

libEvent.setDate = function (eventId, newDate, callback) {
    if (typeof callback !== 'function')
        callback = function (res, err) {
            return;
        };

    console.log('Setting event date: date=' + newDate + ' event=' + eventId);
    $.post(
        '/event/' + eventId,
        {
            cmd: 'setDate',
            newStartDate: newDate,
        },
        function (res) {
            console.log('setDate: Server returned', res);
            if (res.result == 'ok') {
                console.log('date set for event=', res.event._id);
                callback(res);
            } else {
                console.log('Error setting date for event.', res);
                callback(res, res.error);
            }
        }
    ).fail(function (err) {
        console.log('Error setting date for event err=', err);
        callback(null, err);
    });
};
