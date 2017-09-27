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

libProgram.JSON2CSV = function(data,sep,locales) {
    var str = '';

    // header
    var header =
        'program'+sep+
        'event.name'+sep+
        'event.start'+sep+
        'team.num'+sep+
        'team.name'+sep+
        'team.registeredOn'+sep+
        'coach.name'+sep+
        'coach.email'+sep+
        'team.org.name'+sep+
        'team.org.address'+sep+
        'team.org.city'+sep+
        'team.org.postCode'+sep+
        'member.01.fullName'+sep+
        'member.01.dob'+sep+
        'member.02.fullName'+sep+
        'member.02.dob'+sep+
        'member.03.fullName'+sep+
        'member.03.dob'+sep+
        'member.04.fullName'+sep+
        'member.04.dob'+sep+
        'member.05.fullName'+sep+
        'member.05.dob'+sep+
        'member.06.fullName'+sep+
        'member.06.dob'+sep+
        'member.07.fullName'+sep+
        'member.07.dob'+sep+
        'member.08.fullName'+sep+
        'member.08.dob'+sep+
        'member.09.fullName'+sep+
        'member.09.dob'+sep+
        'member.10.fullName'+sep+
        'member.10.dob';

    str += header + '\r\n';

    // data
    for (var i = 0; i < data.program.teams.length; i++) {
        var line = '';
        var t = data.program.teams[i];

        line += data.program.name;
        line += sep + t.event.eventId.name;
        line += sep + (new Date(t.event.eventId.startDate)).toLocaleDateString(locales);
        line += sep + t.event.teamNumber;
        line += sep + t.name;
        line += sep + (new Date(t.event.registeredOn)).toLocaleDateString(locales);

        line += sep + t.coaches[0].fullName;
        line += sep + t.coaches[0].email;

        if (t.foundingOrg)
            line += sep + t.foundingOrg.name;
        else
            line += sep + '';

        if (t.foundingAdr) {
            line += sep + t.foundingAdr.addrLine1
                + (t.foundingAdr.addrLine2 ? ", " + t.foundingAdr.addrLine2 : "")
                + (t.foundingAdr.addrLine3 ? ", " + t.foundingAdr.addrLine3 : "");
            line += sep + t.foundingAdr.city;
            line += sep + t.foundingAdr.postCode;
        } else {
            line += sep + sep + sep;
        }

        for (var j = 0; j < 10; j++) {
            if (j < t.members.length)
                line += sep + t.members[j].fullName + sep + t.members[j].dateOfBirth;
            else
                line += sep + ' ' + sep + ' ';
        }

        str += line + '\r\n';
    }

    return str;
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