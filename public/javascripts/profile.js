"use strict";

const viewProfile = {};

viewProfile.init = function(){
    console.log("/profile - Initializing");
    const profileId = getResourceId(location.href);
    $(".createTeamBtn").on("click",function(ev){ viewProfile.createNewTeam(this.id.substr(3)); });
    $(".changePwdBtn").on("click",function(ev){ viewProfile.changePassword(this.id.substr(3)); } );

    $("#btnEditProfile").on("click", function(event){
        const fields = [
            {id:"username", label:"Prihlasovacie meno", type:"text", required:1},
            {id:"fullName", label:"Celé meno", type:"text", required:1},
            {id:"email", label:"e-mail", type:"email", required:1},
            {id:"phone",  label:"Telefón", type:"text", placeholder:"telefónne číslo"}
        ];

        viewProfile.loadProfileFields(profileId,fields,function(res,err) {

            libModals.multiFieldDialog(
                "Profil užívateľa",
                "",
                res,
                function (flds,cb) {
                    viewProfile.saveProfileFields(flds, profileId, cb)
                },
                function cb(res, err) {
                    if (err) {
                        console.log("CB-ERROR", err);
                        alert(err.message);
                    }
                    location.reload(true);
                }
            );
        });
    });

    viewProfile.loadCoachOfTeams();
    viewProfile.loadMemberOfTeams();
    viewProfile.loadPrograms();
    viewProfile.loadMyPrograms();

    console.log("/profile - Initializing completed");
};

viewProfile.saveProfileFields = function (fields, profileId, cb){
    console.log("Saving profile fields");
    if (typeof cb !== "function") cb = libCommon.noop();

    let doc = {};
    for (let f of fields){
        doc[f.id] = f.value;
    }
    console.log("Posting request to save profile fields");

    $.ajax({
        type:"POST",
        url:"/profile/"+profileId,
        dataType: "json",
        data: {
            cmd: 'saveFields',
            data: JSON.stringify(doc)
        }

    })
        .done( function (res) {
            console.log("saveProfileFields: Server returned",res);
            if (res.result == "ok") {
                console.log("Fields saved");
                cb(res);
            } else {
                console.log("Error while saving fields");
                cb(res,{message:"Zadané údaje sa nepodarilo uložiť.\n"+res.error.message});
            }
        })
        .fail(function (err) {
            console.log("Save failed",err);
            cb(null,{message:"Zadané údaje sa nepodarilo uložiť.\n"+err.message});

        });

};

viewProfile.loadProfileFields = function (profileId,fields,cb){
    console.log("Loading profile fields");
    $.get("/profile/"+profileId+"?cmd=getFields")
        .done(function (res) {
            console.log("loadProfileFields: Server returned",res);
            if (res.result == "ok") {
                for (let i=0; i<fields.length; i++){
                    let v = libCommon.objPathGet(res.fields,fields[i].id);
                    if (v)
                        fields[i].value = v;
                }

                cb(fields);
            } else {
                console.log("Error while loading fields");
            }
        })
        .fail(function (err) {
            console.log("Load failed",err);
        });
};


viewProfile.loadCoachOfTeams = function(){
    const site = location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: '');
    const coachId = getResourceId(location.href);
    console.log("Loading coach teams. Coach = ",coachId);
    const t = $("#coachTeamsList");
    t.empty();
    $.get( "/profile/"+coachId+"?cmd=getCoachTeams", function(res) {
        console.log("Server returned teams",res);
        if (res.result === 'ok'){
            t.empty();
            if (res.list.length > 0) {
                console.log("Found ",res.list.length,"records");
                res.list.forEach(function(item) {
                    var c = $('<a href="'+site+'/team/'+item._id+'" class="btn btn-success btn-member" role="button">')
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
        if (res.result === 'ok'){
            // sort programs by name
            res.list.sort(function(a,b) {return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);} );
            selProg.empty();
            if (res.list.length > 0) {
                console.log("Found ",res.list.length,"records");
                res.list.forEach(function(item) {
                    var c = $('<option value="'+item._id+'"">').append(item.name);
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
        if (res.result === 'ok'){
            // sort programs by name
            res.list.sort(function(a,b) {return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);} );
            selProg.empty();
            if (res.list.length > 0) {
                console.log("Found ",res.list.length,"records");
                res.list.forEach(function(item) {
                    let c = $('<a href="/program/'+item._id+'" class="list-group-item" >').append(item.name);
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
