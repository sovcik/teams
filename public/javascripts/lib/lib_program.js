"use strict";

var libProgram = {};

libProgram.exportData = function (progId,cb){
    console.log('Exporting program data');
    $.get( "/program/"+progId+"?cmd=export", function(res) {
        console.log("exportProg: Server returned",res);
        if (res.result === 'ok'){
            return cb(res);
        } else {
            console.log("exportProg: Server returned ERROR");
            return cb(null);
        }

    });

};

libProgram.addManager = function(progId, username, callback){

    if (typeof callback !== "function")
        callback = function(res,err){return;};

    console.log('Adding manager: user='+username+' event='+progId);
    $.post("/program/"+progId,
        {
            cmd: 'addManager',
            username: username
        },
        function (res) {
            console.log("addManager: Server returned",res);
            if (res.result == "ok") {
                console.log("manager added to program=", res.program._id);
                callback(res);
            } else {
                console.log("Error adding manager to program.",res);
                callback(res, res.error);
            }
        }
    )
        .fail(function (err) {
            console.log("Error adding manager to program err=",err);
            callback(null, err);
        });

};

