'use strict';

function initTeam(){
    console.log("/team - Initializing");
    $("#createTeamMemberBtn").on("click",createNewTeamMember);

    loadTeamCoaches();
    loadTeamMembers();

    console.log("/team - Initializing completed");
}

function loadTeamCoaches(){
    const site = location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: '');
    const teamId = urlGetParam('id');
    console.log("Loading team coaches");
    const t = $("#coachList");
    t.empty();
    $.post( "/team", {cmd: 'getTeamCoaches', id:teamId}, function(res) {
        console.log("Server returned",res);
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

function loadTeamMembers(){
    const site = location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: '');
    const teamId = urlGetParam('id');
    console.log("Loading team members");
    const t = $("#memberList");
    t.empty();
    $.post( "/team", {cmd: 'getTeamMembers', id:teamId}, function(res) {
        console.log("Server returned",res);
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

    });

}

function createNewTeamMember(){
    const teamId = urlGetParam('id');

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
                    loadTeamMembers();
                } else {
                    console.log("Error while creating team");
                    selStatus.text('Nepodarilo sa vytvoriť tím.');
                    selStatus.css("display", "inline").fadeOut(2000);
                }
            }
        )
        .fail(function () {
            selStatus.text('Nepodarilo sa vytvoriť nového člena.');
            console.log("Creation failed");
        });
    } else {
        selStatus.text('Člen tímu musí mať meno.');
        selStatus.css("display", "inline").fadeOut(2000);
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
                loadTeamMembers();
            } else {
                console.log("Error while creating team");
            }
        }
    )
    .fail(function () {
        console.log("Member removal failed");
    });
}

function editMember(id){
    console.log("Editing ",id);
}