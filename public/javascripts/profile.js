"use strict";

const viewProfile = {};

viewProfile.init = function(){
    console.log("/profile - Initializing");
    $(".createTeamBtn").on("click",function(ev){ viewProfile.createNewTeam(this.id.substr(3)); });
    $(".changePwdBtn").on("click",function(ev){ viewProfile.changePassword(this.id.substr(3)); } );

    viewProfile.loadCoachOfTeams();
    viewProfile.loadMemberOfTeams();
    viewProfile.loadPrograms();
    viewProfile.loadMyPrograms();

    console.log("/profile - Initializing completed");
};

viewProfile.loadCoachOfTeams = function(){
    const site = location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: '');
    const coachId = getResourceId(location.href);
    console.log("Loading coach teams. Coach = ",coachId);
    const t = $("#coachTeamsList");
    t.empty();
    $.get( "/profile/"+coachId+"?cmd=getCoachTeams", function(res) {
        console.log("Server returned teams",res);
        console.log("List of",res.list.length,"records");
        if (res.result === 'ok'){
            t.empty();
            if (res.list.length > 0) {
                console.log("Found ",res.list.length,"records");
                res.list.forEach(function(item) {
                    var c = $('<a href="'+site+'/team/'+item.id+'" class="btn btn-success btn-member" role="button">')
                            .append(item.name);

                    t.append(c);

                });
            } else {
                t.text('Žiadne tímy');
            }
        } else {
            console.log("Server returned ERROR");
        }

    });

};

viewProfile.loadMemberOfTeams = function(){
    const site = location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: '');
    console.log("Loading user's teams is not implemented yet");
};

viewProfile.loadPrograms = function (){
    const selProg = $('#newTeamProgram');
    console.log('Loading programs');
    $.get( "/program?cmd=getList", function(res) {
        console.log("Server returned available programs",res);
        console.log("List of",res.list.length,"records");
        if (res.result === 'ok'){
            // sort programs by name
            res.list.sort(function(a,b) {return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);} );
            selProg.empty();
            if (res.list.length > 0) {
                console.log("Found ",res.list.length,"records");
                res.list.forEach(function(item) {
                    var c = $('<option value="'+item.id+'"">').append(item.name);
                    selProg.append(c);
                });
            } else {
                t.text('Žiadne programy');
            }
        } else {
            console.log("Server returned ERROR");
        }

    });

};

viewProfile.loadMyPrograms = function (){
    const profileId = getResourceId(location.href);
    const selProg = $("#myPrograms");
    if (null === document.getElementById('myPrograms')) // profile is not of program manager
        return;
    console.log('Loading programs profile manages');
    $.get( "/program?cmd=getList&pm="+profileId, function(res) {
        console.log("Server returned my programs",res);
        console.log("List of",res.list.length,"records");
        if (res.result === 'ok'){
            // sort programs by name
            res.list.sort(function(a,b) {return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);} );
            selProg.empty();
            if (res.list.length > 0) {
                console.log("Found ",res.list.length,"records");
                res.list.forEach(function(item) {
                    let c = $('<a href="/program/'+item.id+'" class="list-group-item" >').append(item.name);
                    selProg.append(c);
                });
            } else {
                t.text('Žiadne programy');
            }
        } else {
            console.log("Server returned ERROR");
        }

    });

};

viewProfile.createNewTeam = function(coachId){
    //const coachId = getResourceId(location.href);
    const selTeamNameGrp = $("#newTeamName");
    const selTeamName = $("#newTeamName > input:first");
    const selProg = $('#newTeamProgram');
    var selStatus = $("#teamCreateStatus");
    if (selTeamName.val().trim() != '') {
        console.log("Posting request to create new team");
        $.post("/team/", {cmd: 'create', name: selTeamName.val(), programId:selProg.val(), coach:coachId}, function (res) {
            console.log("createTeam: Server returned",res);
            if (res.result == "ok") {
                console.log("Team created");
                selStatus.text('Tím vytvorený.');
                selStatus.css("display", "inline").fadeOut(2000);
                if (null === document.getElementById('coachTeamsList')) {
                    window.location.reload(true);
                } else
                    viewProfile.loadCoachOfTeams(coachId);
                selTeamName.val('');
            } else {
                console.log("Error while creating team");
                selStatus.text('Nepodarilo sa vytvoriť tím.');
                selTeamNameGrp.addClass("has-error");
                selTeamNameGrp.find("span").addClass("glyphicon-warning-sign");
            }
        })
            .fail(function () {
                selStatus.text('Nepodarilo sa vytvoriť tím.');
                console.log("Creation failed");
            });
    } else {
        selStatus.text('Tím musí mať meno.');
        selStatus.css("display", "inline").fadeOut(2000);
    }
};

viewProfile.changePassword = function (userId){
    const selDialog = $('#changePasswordModal');
    const selOldPwd = $('#oldPwd');
    const selNewPwd = $('#newPwd');
    const selNewPwdConf = $('#newPwdConf');
    var selStatus = $("#pwdChangeStatus");
    if (!validatePassword(selNewPwd.val())) {
        alert("Nové heslo musí obsahovať aspoň jedno číslo, malé písmeno a musí mať aspoň 6 znakov.");
        return;
    }
    if (selNewPwd.val() != selNewPwdConf.val()){
        alert("Nové heslá musia byť rovnaké.");
        return;
    }

    console.log("Posting request to change password");
    $.post("/profile/"+userId, {cmd: 'changePassword', oldPwd: selOldPwd.val(), newPwd:selNewPwd.val()}, function (res) {
        console.log("changePassword: Server returned",res);
        if (res.result == "ok") {
            console.log("Password changed");
            selStatus.text('Heslo zmenené.');
            selStatus.css("display", "inline").fadeOut(2000);
            selNewPwd.val('');
            selNewPwdConf.val('');
            selDialog.modal("hide");
        } else {
            console.log("Error while changing password");
            selStatus.text('Nepodarilo sa zmeniť heslo.');
            selStatus.css("display", "inline").fadeOut(10000);
        }
    })
        .fail(function () {
            selStatus.text('Nepodarilo sa zmeniť heslo.');
            selStatus.css("display", "inline").fadeOut(10000);
            console.log("Password change failed");
        });
};
