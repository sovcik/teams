function initProfile(){
    console.log("/profile - Initializing");
    $("#createTeamBtn").on("click",createNewTeam);

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
