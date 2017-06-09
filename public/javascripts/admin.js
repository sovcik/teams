'use strict';

function initAdmin(){
    console.log("/admin - Initializing");
    $("#newProgramBtn").on("click",createNewProgram);
    $("#newEventBtn").on("click",createNewEvent);

    loadPrograms();
    loadEvents();

    console.log("/admin - Initializing completed");
}

function createNewProgram(){
    const selProgName = $('#newProgramName');
    var selStatus = $("#teamCreateStatus");
    if (selProgName.val().trim() != '') {
        console.log("Posting request to create new program");
        $.post("/program", {cmd: 'createProgram', name: selProgName.val()}, function (res) {
            console.log("createProgram: Server returned",res);
            if (res.result == "ok") {
                console.log("Program created");
                loadPrograms();
                selProgName.val('');
            } else {
                console.log("Error while creating program");
            }
        })
            .fail(function () {
                selStatus.text('Nepodarilo sa vytvoriť program.');
                console.log("Creation failed");
            });
    } else {
        selStatus.text('Program musí mať meno.');
        selStatus.css("display", "inline").fadeOut(2000);
    }
}

function createNewEvent(){
    const selEvName = $('#newEventName');
    const selStatus = $("#teamCreateStatus");
    const selEvProg = $('#eventProgram');
    if (selEvName.val().trim() != '') {
        console.log("Posting request to create new event");
        $.post("/event", {cmd: 'createEvent', name: selEvName.val(), programId:selEvProg.val()}, function (res) {
            console.log("createEvent: Server returned",res);
            if (res.result == "ok") {
                console.log("Event created");
                loadEvents();
                selEvName.val('');
            } else {
                console.log("Error while creating event");
            }
        })
            .fail(function () {
                selStatus.text('Nepodarilo sa vytvoriť turnaj.');
                console.log("Creation failed");
            });
    } else {
        selStatus.text('Turnaj musí mať meno.');
        selStatus.css("display", "inline").fadeOut(2000);
    }
}

function loadPrograms(){
    const selProg = $('#allPrograms');
    const selEvProg = $('#eventProgram');
    console.log('Loading programs');
    $.get( "/program?cmd=getList", function(res) {
        console.log("Server returned",res);
        console.log("List of",res.list.length,"records");
        if (res.result === 'ok'){
            selProg.empty();
            selEvProg.empty();
            if (res.list.length > 0) {
                console.log("Found ",res.list.length,"records");
                res.list.forEach(function(item) {
                    let c = $('<li class="list-group-item" value="'+item.id+'"">').append(item.name);
                    selProg.append(c);
                    c = $('<option value="'+item.id+'"">').append(item.name);
                    selEvProg.append(c);
                });
            } else {
                t.text('Žiadne programy');
            }
        } else {
            console.log("Server returned ERROR");
        }

    });

}

function loadEvents(){
    const selEv = $('#allEvents');
    console.log('Loading events');
    $.get( "/event?cmd=getList", function(res) {
        console.log("Server returned",res);
        console.log("List of",res.list.length,"records");
        if (res.result === 'ok'){
            selEv.empty();
            if (res.list.length > 0) {
                console.log("Found ",res.list.length,"records");
                res.list.forEach(function(item) {
                    let c = $('<li class="list-group-item" value="'+item.id+'"">').append(item.name);
                    selEv.append(c);
                });
            } else {
                t.text('Žiadne turnaje');
            }
        } else {
            console.log("Server returned ERROR");
        }

    });

}
