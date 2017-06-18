function initProfile(){
    console.log("/profile - Initializing");
    $("#createTeamBtn").on("click",createNewTeam);
    $("#changePwdBtn").on("click",changePassword);

    loadCoachOfTeams();
    loadMemberOfTeams();
    loadPrograms();

    console.log("/profile - Initializing completed");
}

function loadCoachOfTeams(){
    const site = location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: '');
    const coachId = urlGetParam('id');
    console.log("Loading coach teams. Coach = ",coachId);
    const t = $("#coachTeamsList");
    t.empty();
    $.get( "/profile?id="+coachId+"&cmd=getCoachTeams", function(res) {
        console.log("Server returned",res);
        console.log("List of",res.list.length,"records");
        if (res.result === 'ok'){
            t.empty();
            if (res.list.length > 0) {
                console.log("Found ",res.list.length,"records");
                res.list.forEach(function(item) {
                    var c = $('<a href="'+site+'/team/?id='+item.id+'" class="btn btn-success btn-member" role="button">')
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

}

function loadMemberOfTeams(){
    const site = location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: '');
    console.log("Loading user's teams is not implemented yet");
}

function loadPrograms(){
    const selProg = $('#newTeamProgram');
    console.log('Loading programs');
    $.get( "/program?cmd=getList", function(res) {
        console.log("Server returned",res);
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

}

function createNewTeam(){
    const coachId = urlGetParam('id');
    const selTeamNameGrp = $("#newTeamName");
    const selTeamName = $("#newTeamName > input:first");
    const selProg = $('#newTeamProgram');
    var selStatus = $("#teamCreateStatus");
    if (selTeamName.val().trim() != '') {
        console.log("Posting request to create new team");
        $.post("/profile", {cmd: 'createTeam', name: selTeamName.val(), coachId:coachId, programId:selProg.val()}, function (res) {
            console.log("createTeam: Server returned",res);
            if (res.result == "ok") {
                console.log("Team created");
                selStatus.text('Tím vytvorený.');
                selStatus.css("display", "inline").fadeOut(2000);
                loadCoachOfTeams(coachId);
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
}

function changePassword(){
    const selDialog = $('#changePasswordModal');
    const userId = urlGetParam('id');
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

    console.log("Posting request to create new team");
    $.post("/profile", {cmd: 'changePassword', userId:userId, oldPwd: selOldPwd.val(), newPwd:selNewPwd.val()}, function (res) {
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
}
