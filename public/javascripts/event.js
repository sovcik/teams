"use strict";

function initEvent(){
    const evId = getResourceId(location.href);
    loadRegisteredTeams(evId);
    $("#btnSaveTeamNumber").on("click", function(ev){
        const teamEventId = $("#teamEventId").val();
        const teamNum = $("#teamnumber").val();
        if (saveTeamNumber(teamEventId, teamNum)) {
            $("#editTeamNumber").modal("hide");
        } else {

        }
    });

}

function loadRegisteredTeams(eventId){
    const sel = $('#allTeams');
    console.log('Loading registered teams');
    $.get( "/event/"+eventId+"?cmd=getTeams", function(res) {
        console.log("loadTeams: Server returned",res);
        console.log("List of",res.list.length,"records");
        if (res.result === 'ok'){
            // sort results
            res.list.sort(function(a,b) {return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);} );

            sel.empty();

            if (res.list.length > 0) {
                console.log("Found ",res.list.length,"records");
                res.list.forEach(function(item) {
                    let c = $('<div class="well well-sm container-fluid">')
                        .append($('<a href="/team/'+item.id+'" >')
                            .append(item.name+", "+item.billingAdr.city+", "+item.billingOrg.name))
                        .append(res.isAdmin||res.isEventOrganizer?$('<button id="ETN'+item.id+'" class="btn btn-default btnEditTeamNumber" style="float:right">')
                            .append("Vytvor proformu"):'')
                        .append(res.isAdmin||res.isEventOrganizer?$('<button id="CNI'+item.id+'" class="btn btn-default btnCreateNTInvoice" style="float:right">')
                            .append("Vytvor proformu"):'')
                        .append(res.isAdmin||res.isEventOrganizer?$('<button id="CTI'+item.id+'" class="btn btn-default btnCreateTaxInvoice" style="float:right">')
                            .append("Vytvor faktúru"):'');

                    sel.append(c);

                });
                $(".btnCreateNTInvoice").on("click",function(event){
                    createInvoice(this.id.substr(3),eventId,"P",function(res,err){
                        if (err)
                            alert("Chyba pri vytváraní zálohovej faktúry.",err);
                        else
                            alert("Zálohová Faktúra bola vytvorená. Nájdete ju na stránke tímu.");
                    });
                });
                $(".btnCreateTaxInvoice").on("click",function(event){
                    createInvoice(this.id.substr(3),eventId,"I",function(res,err){
                        if (err)
                            alert("Chyba pri vytváraní zálohovej faktúry.",err);
                        else
                            alert("Zálohová Faktúra bola vytvorená. Nájdete ju na stránke tímu.");
                    });
                });
                $(".btnEditTeamNumber").on("click",function(event){
                    $("#teamEventId").val(res.teamEvent);
                    $("#editTeamNumber").modal();
                });


            } else {
                sel.text('Žiadne');
            }
        } else {
            console.log("loadTeams: Server returned ERROR");
        }

    });

}

function saveTeamNumber(teamId, eventId, callback){
    // open modal dialog


}