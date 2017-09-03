'use strict';

function initAdmin(){
    console.log("/admin - Initializing");
    $("#newProgramBtn").on("click",createNewProgram);
    $("#newEventBtn").on("click",createNewEvent);
    $("#saveInvOrgDetails").on("click", function(event){
        saveIODetails();
    });

    $("#newInvOrgBtn").on("click",function(event){
        editInvoicingOrg();
    });

    loadPrograms();
    loadEvents();
    loadInvoicingOrgs();
    loadUsers();

    console.log("/admin - Initializing completed");
}

function editInvoicingOrg(invOrgId){
    console.log(invOrgId);
    const dlgEdit = $('#invOrgDetails');
    // clear fields
    try {
        $('#frmIODetails')[0].reset();
    } catch (err) {
        console.log(err);
    }

    if (invOrgId)
        loadAddressDetails(invOrgId,function(){
            dlgEdit.modal("show");
        });
    else
        dlgEdit.modal("show");

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
    const selEvIO = $('#eventInvOrg');
    if (selEvName.val().trim() != '') {
        console.log("Posting request to create new event");
        $.post("/event", {cmd: 'createEvent', name: selEvName.val(), programId:selEvProg.val(), invOrgId:selEvIO.val()}, function (res) {
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
        console.log("loadProgs: Server returned",res);
        if (res.result === 'ok'){
            // sort results by program name
            res.list.sort(function(a,b) {return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);} );
            // clear page elements containing programs
            selProg.empty();
            selEvProg.empty();
            if (res.list.length > 0) {
                console.log("Found ",res.list.length,"records");
                res.list.forEach(function(item) {
                    let c = $('<a href="/program/'+item._id+'" class="list-group-item" >').append(item.name);
                    //let c = $('<li class="list-group-item" value="'+item._id+'"">').append(item.name);
                    selProg.append(c);
                    c = $('<option value="'+item._id+'"">').append(item.name);
                    selEvProg.append(c);
                });
            } else {
                t.text('Žiadne programy');
            }
        } else {
            console.log("loadProgs: Server returned ERROR");
        }

    });

}

function loadEvents(){
    const selEv = $('#allEvents');
    console.log('Loading events');
    $.get( "/event?cmd=getList", function(res) {
        console.log("loadEvents: Server returned",res);
        if (res.result === 'ok'){
            // sort events by name
            res.list.sort(function(a,b) {return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);} );
            selEv.empty();
            if (res.list.length > 0) {
                console.log("Found ",res.list.length,"records");
                res.list.forEach(function(item) {
                    let c = $('<a class="list-group-item" href="/event/'+item._id+'"">').append(item.name);
                    selEv.append(c);
                });
            } else {
                t.text('Žiadne turnaje');
            }
        } else {
            console.log("loadEvents: Server returned ERROR");
        }

    });

}

function loadInvoicingOrgs(){
    const selIO = $('#allInvoicingOrgs');
    const selEvIO = $('#eventInvOrg');
    console.log('Loading invoicing orgs');
    $.get( "/invorg?cmd=getList", function(res) {
        console.log("loadInvOrgs: Server returned",res);
        if (res.result === 'ok'){
            // sort results by program name
            res.list.sort(function(a,b) {return (a.org.name > b.org.name) ? 1 : ((b.org.name > a.org.name) ? -1 : 0);} );
            // clear page elements containing programs
            selIO.empty();
            selEvIO.empty();
            if (res.list.length > 0) {
                console.log("Found ",res.list.length,"records");
                res.list.forEach(function(item) {
                    let c = $('<a href="/invorg/'+item._id+'" class="list-group-item" >').append(item.org.name+", "+item.adr.city);
                    selIO.append(c);
                    c = $('<option value="'+item._id+'"">').append(item.org.name+", "+item.adr.city);
                    selEvIO.append(c);

                });
            } else {
                selIO.text('Žiadne');
            }
        } else {
            console.log("loadInvOrgs: Server returned ERROR");
        }

    });

}

function saveIODetails(orgId){
    var succ = false;
    var selStatus;
    var selDialog;
    console.log("Saving invoicing org details");

    const details = {};

    selStatus = $("#saveInvOrgStatus");
    selDialog = $("#invOrgDetails");

    details.orgName = $("#billOrg").val();
    details.addr1 = $("#billAdr1").val();
    details.addr2 = $("#billAdr2").val();
    details.city = $("#billCity").val();
    details.postCode = $("#billPostCode").val();
    details.compNo = $("#billCompNo").val();
    details.taxNo = $("#billTaxNo").val();
    details.conName = $("#billContactName").val();
    details.conPhone = $("#billContactPhone").val();
    details.conEmail = $("#billContactEmail").val();

    details.VATNo = $("#billVATNo").val();
    details.invNumPrefix = $("#invNumPrefix").val();
    details.nextInvNumber = $("#nextInvNumber").val();
    details.ntInvNumPrefix = $("#ntInvNumPrefix").val();
    details.nextNTInvNumber = $("#nextNTInvNumber").val();
    details.dueDays = $("#dueDays").val();

    details.bankAccount = $("#bankAccount").val();
    details.bankSWIFT = $("#bankSWIFT").val();


    $.ajax({
        type:"POST",
        url:"/invorg",
        dataType: "json",
        data: {
            cmd: 'create',
            data: JSON.stringify(details)
        }

    })
        .done( function (res) {
            console.log("saveAdrDetails: Server returned",res);
            if (res.result == "ok") {
                console.log("Details saved");
                selStatus.text('Uložené');
                selStatus.css("display", "inline").fadeOut(2000);
                selDialog.modal("hide");
                loadInvoicingOrgs();
            } else {
                console.log("Error while saving details");
                selStatus.text('Nepodarilo sa uložiť.');
                selStatus.css("display", "inline").fadeOut(5000);
            }
        })
        .fail(function (err) {
            selStatus.text('Nepodarilo sa uložiť detaily.');
            selStatus.css("display", "inline").fadeOut(5000);
            console.log("Save failed",err);
        });

    return succ;
}

function loadAddressDetails(orgId, callback){
    console.log("Loading invoicing org address details");
    $.get("/invorg/"+orgId+"&cmd=getAdrDetails")
        .done(function (res) {
            console.log("loadAdrDetails: Server returned",res);
            if (res.result == "ok") {
                formatAddressDetails(res.details);
                callback(orgId);
            } else {
                console.log("Error while loading details");
            }
        })
        .fail(function (err) {
            console.log("Load failed",err);
        });
}

function formatAddressDetails(data) {

    if (!data.billingOrg) data.billingOrg = {};
    $("#invOrgId").val(data._id || '');

    $("#billOrg").val(data.billingOrg.name || '');
    $("#billCompNo").val(data.billingOrg.companyNo || '');
    $("#billTaxNo").val(data.billingOrg.taxNo || '');

    if (!data.billingAdr) data.billingAdr = {};
    $("#billAdr1").val(data.billingAdr.addrLine1 || '');
    $("#billAdr2").val(data.billingAdr.addrLine2 || '');
    $("#billCity").val(data.billingAdr.city || '');
    $("#billPostCode").val(data.billingAdr.postCode || '');

    if (!data.billingContact) data.billingContact = {};
    $("#billContactName").val(data.billingContact.name || '');
    $("#billContactPhone").val(data.billingContact.phone || '');
    $("#billContactEmail").val(data.billingContact.email || '');

}

function loadUsers(){
    const sel = $('#allUsers');
    console.log('Loading users');
    $.get( "/profile?cmd=getList", function(res) {
        console.log("loadUsers: Server returned",res);
        if (res.result === 'ok'){
            // sort results by username
            res.list.sort(function(a,b) {return (a.username > b.username) ? 1 : ((b.username > a.username) ? -1 : 0);} );
            // clear page elements containing programs
            sel.empty();

            if (res.list.length > 0) {
                console.log("Found ",res.list.length,"records");
                //style="padding:3pt;width:100%;margin:2pt"
                res.list.forEach(function(item) {
                    let c = $('<div class="well well-sm container-fluid">')
                        .append($('<a href="/profile/'+item._id+'" >')
                            .append(item.username+", "+item.fullName+", "+item.email))
                        .append($('<button id="MKA'+item._id+'" class="btn btn-default btnMakeAdmin" style="float:right">')
                            .append("Urob admin"))
                        .append($('<button id="SSU'+item._id+'" class="btn btn-default btnSuspend" style="float:right">')
                            .append("Zakáž"));

                    sel.append(c);

                });
                $(".btnMakeAdmin").on("click",function(event){
                    makeAdmin(this.id.substr(3));
                });
            } else {
                sel.text('Žiadne');
            }
        } else {
            console.log("loadUsers: Server returned ERROR");
        }

    });

}

function makeAdmin(userId){
    console.log("Making user admin",userId);
    $.post("/profile/"+userId,
        {
            cmd: 'makeAdmin'
        },
        function (res) {
            console.log("makeAdmin: Server returned",res);
            if (res.result == "ok") {
                console.log("User made admin");
                loadUsers();
            } else {
                console.log("Error while making user admin");
            }
        }
    )
        .fail(function (err) {
            console.log("Making user admin failed",err);
        });
}
