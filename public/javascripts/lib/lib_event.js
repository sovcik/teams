"use strict";

const libEvent = {};

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
