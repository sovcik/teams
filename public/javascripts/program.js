"use strict";

const viewProgram = {};

viewProgram.init = function (){
    viewProgram.loadManagers();
    viewProgram.loadEvents();
    $("#exportData").on("click",viewProgram.exportData);
};

viewProgram.loadManagers = function (){
    const progId = getResourceId(location.href);
    const site = location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: '');
    console.log("Loading program managers");
    const t = $("#pmsList");
    t.empty();
    $.get( "/program/"+progId+"?cmd=getManagers", function(res) {
        console.log("Server returned managers",res);
        if (res.result === 'ok'){
            console.log("List of",res.list.length,"records");
            t.empty();
            if (res.list.length > 0) {
                console.log("Found ",res.list.length,"records");
                res.list.forEach(function(item) {
                    if (item.fullName) {
                        var c = $('<a href="' + site + '/profile/' + item.id + '" class="btn btn-success btn-member" role="button">')
                            .append(item.fullName);

                        t.append(c);
                    }

                });
            } else {
                t.text('Žiadni manažéri');
            }
        } else {
            console.log("Server returned ERROR");
        }

    });

};

viewProgram.loadEvents = function (){
    const selEv = $('#eventList');
    const progId = getResourceId(location.href);
    console.log('Loading events');
    $.get( "/event?cmd=getList&program="+progId, function(res) {
        console.log("loadProgEvents: Server returned",res);
        console.log("List of",res.list.length,"records");
        if (res.result === 'ok'){
            // sort events by name
            res.list.sort(function(a,b) {return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);} );
            selEv.empty();
            if (res.list.length > 0) {
                console.log("Found ",res.list.length,"records");
                res.list.forEach(function(item) {
                    let c = $('<a class="list-group-item" href="/event/'+item.id+'"">').append(item.name);
                    selEv.append(c);
                });
            } else {
                t.text('Žiadne turnaje');
            }
        } else {
            console.log("loadEvents: Server returned ERROR");
        }

    });

};

viewProgram.exportData = function (){
    const progId = getResourceId(location.href);
    console.log('Exporting program data');
    $.get( "/program/"+progId+"?cmd=export", function(res) {
        console.log("exportProg: Server returned",res);
        if (res.result === 'ok'){
            viewProgram.JSON2CSV(res.data,'\t');
        } else {
            console.log("exportProg: Server returned ERROR");
        }

    });

};

viewProgram.JSON2CSV = function(data,sep) {
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
    for (let i = 0; i < data.program.teams.length; i++) {
        var line = '';
        let t = data.program.teams[i];

        line += data.program.name;
        line += sep + t.event.eventId.name;
        line += sep + t.event.eventId.startDate;
        line += sep + t.event.teamNumber;
        line += sep + t.name;
        line += sep + t.event.registeredOn;

        line += sep + t.coaches[0].fullName;
        line += sep + t.coaches[0].email;

        if (t.billingOrg)
            line += sep + t.billingOrg.name;
        else
            line += sep + '';

        if (t.billingAdr) {
            line += sep + t.billingAdr.addrLine1
                + (t.billingAdr.addrLine2 ? ", " + t.billingAdr.addrLine2 : "")
                + (t.billingAdr.addrLine3 ? ", " + t.billingAdr.addrLine3 : "");
            line += sep + t.billingAdr.city;
            line += sep + t.billingAdr.postCode;
        } else {
            line += sep + sep + sep;
        }

        for (let j = 0; j < 10; j++) {
            if (j < t.members.length)
                line += sep + t.members[j].fullName + sep + t.members[j].dateOfBirth;
            else
                line += sep + ' ' + sep + ' ';
        }

        str += line + '\r\n';
    }

    // save to file
    var encodedUri = encodeURI("data:text/csv;charset=utf-8,"+str);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "program_export.csv");
    document.body.appendChild(link);

    link.click();
};
