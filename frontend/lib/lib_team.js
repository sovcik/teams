"use strict";

var libTeam = {};

libTeam.addCoach = function(teamId, username, callback){

    if (typeof callback !== "function")
        callback = function(res,err){return;};

    console.log('Adding coach: user='+username+' team='+teamId);
    $.post("/team/"+teamId,
        {
            cmd: 'addCoach',
            username: username
        },
        function (res) {
            console.log("addCoach: Server returned",res);
            if (res.result == "ok") {
                console.log("coach added to team=", res.teamuser._id);
                callback(res);
            } else {
                console.log("Error adding coach to team.",res);
                callback(res, res.error);
            }
        }
    )
        .fail(function (err) {
            console.log("Error adding coach to team err=",err);
            callback(null, err);
        });

};