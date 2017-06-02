function initProfile(){
    console.log("/profile - Initializing");
    $("#createTeamBtn").on("click",createNewTeam);

    loadCoachOfTeams();
    loadMemberOfTeams();

    console.log("/profile - Initializing completed");
}

function loadCoachOfTeams(){
    const site = location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: '');
    console.log("Loading coach teams");
    const t = $("#coachTeamsList");
    t.empty();
    $.post( "/profile", {cmd: 'getCoachTeams'}, function(res) {
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
    console.log("Loading user's teams");
}

function createNewTeam(){
    const selTeamNameGrp = $("#newTeamName");
    const selTeamName = $("#newTeamName > input:first");
    var selStatus = $("#teamCreateStatus");
    if (selTeamName.val().trim() != '') {
        console.log("Posting request to create new team");
        $.post("/profile", {cmd: 'createTeam', name: selTeamName.val()}, function (res) {
            console.log("createTeam: Server returned",res);
            if (res.result == "ok") {
                console.log("Team created");
                selStatus.text('Tím vytvorený.');
                selStatus.css("display", "inline").fadeOut(2000);
                loadCoachOfTeams();
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
