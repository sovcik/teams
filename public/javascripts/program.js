"use strict";

var viewProgram = {};

viewProgram.init = function (rId, u){
    viewProgram.user = JSON.parse(u);
    var resId = rId; //getResourceId(location.href);
    console.log(viewProgram.user,rId);
    viewProgram.loadManagers(resId);
    viewProgram.loadEvents(resId);
    viewProgram.loadTeams(resId);
    $("#exportData").on(
        "click",
        function(){
            // get JSON data
            libProgram.exportData(resId, function(d){
                // convert to CSV
                var data = libCommon.Prog2CSV(d.data,'\t',viewProgram.user.locales, viewProgram.user.permissions.isAdmin?1:0);
                // save to file
                var encodedUri = encodeURI("data:text/csv;charset=utf-8,"+data);
                var link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", "program_export_utf8.csv");
                document.body.appendChild(link);

                link.click();

            });
        }
    );

    $("#addManager").on(
        "click",
        function(ev) {
            libModals.editValue(
                "Pridaj manažéra",
                "Používateľ",
                "prihlasovacie meno používateľa",
                "text",
                "",
                function (browserEvent, username, onSuccess, onError) {
                    if (typeof onSuccess !== "function")
                        onSuccess = function (u) {
                            return true;
                        };
                    if (typeof onError !== "function")
                        onError = function (msg) {
                            console.log("ERROR: ", msg);
                        };

                    libProgram.addManager(resId, username, function (res, err) {
                        if (err)
                            return onError(err.message);
                        onSuccess(res);
                    });
                },
                function (res) {
                    console.log("new program manager added");
                    viewProgram.loadManagers(resId);
                },
                function (msg) {
                    alert("Chyba pri pridávaní manažéra programu.\n\n"+msg);
                }
            )
        }

    );

};

viewProgram.loadManagers = function (progId){
    var site = location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: '');
    console.log("Loading program managers");
    var t = $("#pmsList");
    t.empty();
    $.get( "/program/"+progId+"?cmd=getManagers", function(res) {
        console.log("Server returned managers",res);
        if (res.result === 'ok'){
            t.empty();
            if (res.list.length > 0) {
                console.log("Found ",res.list.length,"records");
                res.list.forEach(function(item) {
                    if (item.fullName) {
                        var c = $('<a href="' + site + '/profile/' + item._id + '" class="btn btn-success btn-member" role="button">')
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

viewProgram.loadEvents = function (progId){
    var selEv = $('#eventList');
    console.log('Loading events');
    $.get( libCommon.getNoCache("/event?cmd=getList&program="+progId), function(res) {
        console.log("loadProgEvents: Server returned",res);
        if (res.result === 'ok'){
            // sort events by name
            res.list.sort(function(a,b) {return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);} );
            selEv.empty();
            if (res.list.length > 0) {
                console.log("Found ",res.list.length,"records");
                res.list.forEach(function(item) {
                    var c = $('<a class="list-group-item" href="/event/'+item._id+'"">').append(item.name);
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

viewProgram.loadTeams = function (progId){
    var selEv = $('#teamList');
    console.log('Loading teams');
    $.get( libCommon.getNoCache("/team?cmd=getList&programId="+progId), function(res) {
        console.log("loadTeams: Server returned",res);
        if (res.result === 'ok'){
            // sort events by name
            res.list.sort(function(a,b) {return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);} );
            selEv.empty();
            if (res.list.length > 0) {
                console.log("Found ",res.list.length,"records");
                var i=1;
                res.list.forEach(function(item) {
                    var c = $('<a class="list-group-item" href="/team/'+item._id+'"">').append((i++)+'. '+item.name+', '+item.foundingOrg.name+', '+item.foundingAdr.city);
                    selEv.append(c);
                });
            } else {
                t.text('Žiadne tímy');
            }
        } else {
            console.log("loadTeams: Server returned ERROR");
        }

    });

};