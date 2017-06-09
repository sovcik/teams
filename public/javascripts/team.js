'use strict';

function initTeam(){
    const teamId = urlGetParam('id');
    console.log("/team - Initializing");
    $("#createTeamMemberBtn").on("click", function(){
        createNewTeamMember(teamId);
    });

    $("#saveBillingDetails").on("click", function(){
        saveAddressDetails('billing',teamId);
    });

    $("#saveShippingDetails").on("click", function(){
        saveAddressDetails('shipping',teamId);
    });

    $("#btnRegister").on("click", function(){
        registerForEvent(teamId);
    });


    loadTeamCoaches(teamId);
    loadTeamMembers(teamId);
    loadAddressDetails(teamId);
    loadAvailableEvents(teamId);

    console.log("/team - Initializing completed");
}

function loadTeamCoaches(teamId){
    const site = location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: '');
    console.log("Loading team coaches");
    const t = $("#coachList");
    t.empty();
    $.get( "/team?id="+teamId+"&cmd=getTeamCoaches", function(res) {
        console.log("Server returned coaches",res);
        if (res.result === 'ok'){
            console.log("List of",res.list.length,"records");
            t.empty();
            if (res.list.length > 0) {
                console.log("Found ",res.list.length,"records");
                res.list.forEach(function(item) {
                    var c = $('<a href="'+site+'/profile?id='+item.id+'" class="btn btn-success btn-member" role="button">')
                        .append(item.fullName);

                    t.append(c);

                });
            } else {
                t.text('Žiadni tréneri');
            }
        } else {
            console.log("Server returned ERROR");
        }

    });

}

function loadTeamMembers(teamId){
    const site = location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: '');
    console.log("Loading team members");
    const t = $("#memberList");
    t.empty();
    $.get( "/team?id="+teamId+"&cmd=getTeamMembers", function(res) {
        console.log("Server returned members",res);
        if (res.result === 'ok'){
            console.log("List of",res.list.length,"records");
            t.empty();
            if (res.list.length > 0) {
                res.list.forEach(function(item) {

                    let btnRemove = $('<button type="button" class="btn btn-link btn-xs">');
                    btnRemove.memberId = item.id;
                    btnRemove.on("click",function(){removeMember(item.id, teamId);});
                    btnRemove.append($('<span class="glyphicon glyphicon-remove">'));

                    let btnEdit = $('<button type="button" class="btn btn-link btn-xs">');
                    btnEdit.memberId = item.id;
                    btnEdit.on("click",function(){editMember(item.id);});
                    btnEdit.append($('<span class="glyphicon glyphicon-pencil">'));

                    let c = $('<div class="panel panel-default card">')
                            .append($('<div class="panel-heading">')
                                .append(btnRemove)
                                .append(item.fullName)
                                //.append(btnEdit)
                            )
                            .append($('<div class="panel-body form-inline">')
                                .append($('<input class="form-control" type="date" readonly value="'+(item.dateOfBirth?item.dateOfBirth.substr(0,10):null)+'">'))
                                .append($('<input class="form-control" type="string" readonly value="'+(item.email?item.email:'')+'">'))
                            );

                    t.append(c);

                });
            } else {
                t.text('Žiadni členovia tímu');
            }
        } else {
            console.log("Server returned ERROR");
        }

    })
        .fail(function(err){
            console.log("getTeamMembers FAILED",err);
            t.text('Chyba pri komunikácii so serverom');
        });

}

function createNewTeamMember(teamId){

    const selDialog = $("#newMemberModal");
    const selNameGrp = $("#newMemberName");
    const selName = $("#newMemberName > input:first");

    const selEmailGrp = $("#newMemberEmail");
    const selEmail = $("#newMemberEmail > input:first");

    const selDOBGrp = $("#newMemberDOB");
    const selDOB = $("#newMemberDOB > input:first");

    var selStatus = $("#createStatus");

    if (selName.val().trim() != '') {
        console.log("Posting request to create new member");
        $.post("/team",
            {
                cmd: 'createTeamMember',
                name: selName.val(),
                email: selEmail.val(),
                dob: selDOB.val(),
                teamId: teamId
            },
            function (res) {
                console.log("createTeamMember: Server returned",res);
                if (res.result == "ok") {
                    console.log("Member created");
                    selStatus.text('Člen tímu vytvorený.');
                    selStatus.css("display", "inline").fadeOut(2000);
                    selName.val('');
                    selEmail.val('');
                    selDOB.val('');
                    selDialog.modal("hide");
                    loadTeamMembers(teamId);
                } else {
                    console.log("Error while creating team-member");
                    selStatus.text('Nepodarilo sa vytvoriť člena tímu.');
                    selStatus.css("display", "inline").fadeOut(5000);
                }
            }
        )
        .fail(function (err) {
            selStatus.text('Nepodarilo sa vytvoriť nového člena.');
            console.log("Creation failed",err);
        });
    } else {
        selStatus.text('Člen tímu musí mať meno.');
        selStatus.css("display", "inline").fadeOut(5000);
    }
}

function removeMember(id, teamId){
    console.log("Removing member",id);
    $.post("/team",
        {
            cmd: 'removeTeamMember',
            memberId: id,
            teamId: teamId
        },
        function (res) {
            console.log("removeTeamMember: Server returned",res);
            if (res.result == "ok") {
                console.log("Member removed");
                loadTeamMembers(teamId);
            } else {
                console.log("Error while creating team");
            }
        }
    )
    .fail(function (err) {
        console.log("Member removal failed",err);
    });
}

function editMember(id){
    console.log("Editing ",id);
}

function saveAddressDetails(detType, teamId){
    var succ = false;
    var selStatus;
    var selDialog;
    console.log("Saving address details", detType);

    const details = {};

    if (detType === 'billing'){
        selStatus = $("#saveBillingStatus");
        selDialog = $("#billingAddress");

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
    } else {
        selStatus = $("#saveShippingStatus");
        selDialog = $("#shippingAddress");

        details.orgName = $("#shipOrg").val();
        details.addr1 = $("#shipAdr1").val();
        details.addr2 = $("#shipAdr2").val();
        details.city = $("#shipCity").val();
        details.postCode = $("#shipPostCode").val();
        details.conName = $("#shipContactName").val();
        details.conPhone = $("#shipContactPhone").val();
        details.conEmail = $("#shipContactEmail").val();
    }

    console.log("Posting request to save address details");

    $.ajax({
            type:"POST",
            url:"/team",
            dataType: "json",
            data: {
                cmd: 'saveAdrDetails',
                teamId: teamId,
                type: detType,
                data: JSON.stringify(details)
            }

        })
        .done( function (res) {
            console.log("saveAdrDetails: Server returned",res);
            if (res.result == "ok") {
                console.log("Details saved");
                selStatus.text('Uložené');
                selStatus.css("display", "inline").fadeOut(2000);
                loadAddressDetails(teamId);
                selDialog.modal("hide");
            } else {
                console.log("Error while saving details");
                selStatus.text('Nepodarilo sa uložiť.');
                selStatus.css("display", "inline").fadeOut(2000);
            }
        })
        .fail(function (err) {
            selStatus.text('Nepodarilo sa uložiť detaily.');
            selStatus.css("display", "inline").fadeOut(2000);
            console.log("Save failed",err);
        });

    return succ;
}

function loadAddressDetails(teamId){
    console.log("Loading team address details");
    $.get("/team?id="+teamId+"&cmd=getAdrDetails")
        .done(function (res) {
            console.log("loadAdrDetails: Server returned",res);
            if (res.result == "ok") {
                formatAddressDetails(res.details);
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

    if (!data.shippingOrg) data.shippingOrg = {};
    $("#shipOrg").val(data.shippingOrg.name || '');

    if (!data.shippingAdr) data.shippingAdr = {};
    $("#shipAdr1").val(data.shippingAdr.addrLine1 || '');
    $("#shipAdr2").val(data.shippingAdr.addrLine2 || '');
    $("#shipCity").val(data.shippingAdr.city || '');
    $("#shipPostCode").val(data.shippingAdr.postCode || '');

    if (!data.shippingContact) data.shippingContact = {};
    $("#shipContactName").val(data.shippingContact.name || '');
    $("#shipContactPhone").val(data.shippingContact.phone || '');
    $("#shipContactEmail").val(data.shippingContact.email || '');

}

function loadAvailableEvents(teamId){
    const sel = $('#availEvents');
    console.log('Loading events');
    $.get( "/event?cmd=getAvailTeamEvents&teamId="+teamId, function(res) {
        console.log("Server returned events",res);
        console.log("List of",res.list.length,"records");
        if (res.result === 'ok'){
            sel.empty();
            if (res.list.length > 0) {
                console.log("Found ",res.list.length,"records");
                res.list.forEach(function(item) {
                    var c = $('<option value="'+item.id+'"">').append(item.name);
                    sel.append(c);
                });
            } else {
                sel.text('Žiadne');
            }
        } else {
            console.log("Server returned ERROR");
        }

    });

}

function loadTeamData(teamId){
    $.get( "/team?cmd=getData&teamId="+teamId, function(res) {
        console.log('Server returned team data',res);
        if (res.result === 'ok'){

        } else {
            console.log('Server returned error');
        }
    });
}

function registerForEvent(teamId){
    console.log('Registering for event');
    const eventId = $('#availEvents').val();
    $.post("/event",
        {
            cmd: 'registerTeam',
            eventId: eventId,
            teamId: teamId
        },
        function (res) {
            console.log("registerTeam for event: Server returned",res);
            if (res.result == "ok") {
                console.log("team registered");
                location.reload(true);
            } else {
                console.log("Error while creating team");
            }
        }
    )
        .fail(function (err) {
            console.log("Member removal failed",err);
        });

}