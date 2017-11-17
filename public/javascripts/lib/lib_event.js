"use strict";

var libEvent = {};

libEvent.exportData = function (eventId,cb){
    console.log('Exporting event data');
    $.get( "/event/"+eventId+"?cmd=export", function(res) {
        console.log("exportEvent: Server returned",res);
        if (res.result === 'ok'){
            return cb(res);
        } else {
            console.log("exportEvent: Server returned ERROR");
            return cb(null);
        }

    });

};

libEvent.addOrganizer = function(eventId, username, callback){

    if (typeof callback !== "function")
        callback = function(res,err){return;};

    console.log('Adding organizer: user='+username+' event='+eventId);
    $.post("/event/"+eventId,
        {
            cmd: 'addOrganizer',
            username: username
        },
        function (res) {
            console.log("addOrganizer: Server returned",res);
            if (res.result == "ok") {
                console.log("event organizer added to event=", res.event._id);
                callback(res);
            } else {
                console.log("Error adding organizer to event.",res);
                callback(res, res.error);
            }
        }
    )
        .fail(function (err) {
            console.log("Error adding organizer to event err=",err);
            callback(null, err);
        });

};

libEvent.setDate = function(eventId, newDate, callback){

    if (typeof callback !== "function")
        callback = function(res,err){return;};

    console.log('Setting event date: date='+newDate+' event='+eventId);
    $.post("/event/"+eventId,
        {
            cmd: 'setDate',
            newStartDate: newDate
        },
        function (res) {
            console.log("setDate: Server returned",res);
            if (res.result == "ok") {
                console.log("date set for event=", res.event._id);
                callback(res);
            } else {
                console.log("Error setting date for event.",res);
                callback(res, res.error);
            }
        }
    )
        .fail(function (err) {
            console.log("Error setting date for event err=",err);
            callback(null, err);
        });

};
