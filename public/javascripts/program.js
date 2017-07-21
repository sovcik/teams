"use strict";

const viewProgram = {};

viewProgram.init = function (){
    viewProgram.loadManagers();
    viewProgram.loadEvents();
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

viewProgram.loadEvents = function loadEvents(){
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
