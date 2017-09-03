'use strict';

const viewTeam = {};

viewTeam.init = function(){
    const teamId = getResourceId(location.href);
    console.log("/team - Initializing");
    $("#createTeamMemberBtn").on("click", function(){
        viewTeam.createNewTeamMember(teamId);
    });

    $("#btnRegister").on("click", function(){
        viewTeam.registerForEvent(teamId);
    });

    $("#btnFounderDetails").on("click", function(event){
        const fields = [
                {id:"foundingOrg.name", label:"Názov", type:"text", placeholder:"názov organizácie", required:1},
                {id:"foundingAdr.addrLine1", label:"Adresa - riadok 1", type:"text", placeholder:"adresa riadok 1", required:1},
                {id:"foundingAdr.addrLine2", label:"Adresa - riadok 2", type:"text", placeholder:"adresa riadok 2"},
                {id:"foundingAdr.city",  label:"Mesto", type:"text", placeholder:"mesto", required:1},
                {id:"foundingAdr.postCode", label:"PSČ", type:"text", placeholder:"poštové smerové číslo", required:1},
                {id:"foundingOrg.companyNo", label:"IČO", type:"text"},
                {id:"foundingOrg.taxNo", label:"DIČ", type:"text"},
                {id:"foundingContact.name", label:"Kontaktná osoba", type:"text"},
                {id:"foundingContact.phone", label:"Telefón", type:"text"},
                {id:"foundingContact.email", label:"E-mail", type:"email"}
            ];

        viewTeam.loadAddressDetails2(teamId,fields,function(res,err) {

            libModals.multiFieldDialog(
                "Zriaďovateľ",
                "Organizácia, ktorá je zriaďovateľom tímu",
                res,
                function (flds, cb) {
                    viewTeam.saveAddressDetails2("founding", flds, teamId, cb)
                },
                function cb(res, err) {
                    if (err) {
                        console.log("CB-ERROR", err);
                        alert(err.message);
                    }
                    console.log("CB-DONE");
                }
            );
        });
    });

    $("#btnBillingDetails").on("click", function(event){
        const fields = [
            {id:"billingOrg.name", label:"Názov", type:"text", placeholder:"názov organizácie", required:1},
            {id:"billingAdr.addrLine1", label:"Adresa - riadok 1", type:"text", placeholder:"adresa riadok 1", required:1},
            {id:"billingAdr.addrLine2", label:"Adresa - riadok 2", type:"text", placeholder:"adresa riadok 2"},
            {id:"billingAdr.city",  label:"Mesto", type:"text", placeholder:"mesto", required:1},
            {id:"billingAdr.postCode", label:"PSČ", type:"text", placeholder:"poštové smerové číslo", required:1},
            {id:"billingOrg.companyNo", label:"IČO", type:"text"},
            {id:"billingOrg.taxNo", label:"DIČ", type:"text"},
            {id:"billingContact.name", label:"Kontaktná osoba", type:"text"},
            {id:"billingContact.phone", label:"Telefón", type:"text"},
            {id:"billingContact.email", label:"E-mail", type:"email"}
        ];

        viewTeam.loadAddressDetails2(teamId,fields,function(res,err) {

            libModals.multiFieldDialog(
                "Fakturačné údaje",
                "Tieto údaje sa použijú na vystavenie faktúr. Osoba tu uvedená bude kontaktovaná v prípade otázok týkajúcich sa faktúr.",
                res,
                function (flds, cb) {
                    viewTeam.saveAddressDetails2("billing", flds, teamId, cb)
                },
                function cb(res, err) {
                    if (err) {
                        console.log("CB-ERROR", err);
                        alert(err.message);
                    }
                    console.log("CB-DONE");
                }
            );
        });
    });

    $("#btnShippingDetails").on("click", function(event){
        const fields = [
            {id:"shippingOrg.name", label:"Názov", type:"text", placeholder:"názov organizácie", required:1},
            {id:"shippingAdr.addrLine1", label:"Adresa - riadok 1", type:"text", placeholder:"adresa riadok 1", required:1},
            {id:"shippingAdr.addrLine2", label:"Adresa - riadok 2", type:"text", placeholder:"adresa riadok 2"},
            {id:"shippingAdr.city",  label:"Mesto", type:"text", placeholder:"mesto", required:1},
            {id:"shippingAdr.postCode", label:"PSČ", type:"text", placeholder:"poštové smerové číslo", required:1},
            {id:"shippingContact.name", label:"Kontaktná osoba", type:"text"},
            {id:"shippingContact.phone", label:"Telefón", type:"text"},
            {id:"shippingContact.email", label:"E-mail", type:"email"}
        ];

        viewTeam.loadAddressDetails2(teamId,fields,function(res,err) {

            libModals.multiFieldDialog(
                "Korešpondenčné údaje",
                "Tieto údaje sa použijú pri zasielaní dokumentov/balíkov bežnou poštou alebo kuriérom. Osoba tu uvedená bude kontaktovaná v prípade otázok týkajúcich sa zásielky.",
                res,
                function (flds, cb) {
                    viewTeam.saveAddressDetails2("shipping", flds, teamId, cb)
                },
                function cb(res, err) {
                    if (err) {
                        console.log("CB-ERROR", err);
                        alert(err.message);
                    }
                    console.log("CB-DONE");
                }
            );
        });
    });

    $("#btnAddCoach").on(
        "click",
        function(ev) {
            libModals.selectUserDialog(
                "Pridaj trénera",
                function (browserEvent, username, onSuccess, onError) {
                    if (typeof onSuccess !== "function")
                        onSuccess = function (u) {
                            return true;
                        };
                    if (typeof onError !== "function")
                        onError = function (msg) {
                            console.log("ERROR: ", msg);
                        };

                    libTeam.addCoach(teamId, username, function (res, err) {
                        if (err) {
                            return onError(err.message);
                        }
                        onSuccess(res);
                    });
                },
                function (res) {
                    console.log("team coach added");
                    viewTeam.loadCoaches(teamId);
                },
                function (msg) {
                    alert("Chyba pri pridávaní trénera.\n\n"+msg);
                }
            )
        }

    );

    viewTeam.loadCoaches(teamId);
    viewTeam.loadMembers(teamId);
    viewTeam.loadAvailableEvents(teamId);
    viewTeam.loadInvoices(teamId);

    console.log("/team - Initializing completed");
};

viewTeam.removeCoach = function (teamId, userId) {
    let cfm = window.confirm("Kliknite OK ak naozaj chcete odstrániť tohto trénera z tímu.");
    if (cfm) {
        console.log("Posting request to remove coach team=",teamId,"caoch=",userId);
        $.post("/team/"+teamId,
            {
                cmd: 'removeCoach',
                coachId: userId
            },
            function (res) {
                console.log("removeCoach: Server returned",res);
                if (res.result == "ok") {
                    console.log("Coach Removed");
                    viewTeam.loadCoaches(teamId);
                } else {
                    console.log("Error while removing coach");
                    alert('Nepodarilo sa odstrániť trénera.\n\n'+res.error.message);
                }
            }
        )
            .fail(function (err) {
                console.log("Error while removing coach");
                alert('Nepodarilo sa odstrániť trénera.\n\n'+err.message);
            });
    }
};

viewTeam.loadCoaches = function (teamId){
    const site = location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: '');
    console.log("Loading team coaches");
    const t = $("#coachList");
    t.empty();
    $.get( "/team/"+teamId+"?cmd=getTeamCoaches", function(res) {
        console.log("Server returned coaches",res);
        $('#coachCount').val(' ');
        if (res.result === 'ok'){
            console.log("List of",res.list.length,"records");
            $('#coachCount').val(res.list.length);
            t.empty();
            if (res.list.length > 0) {
                console.log("Found ",res.list.length,"records");
                res.list.forEach(function(item) {
                    if (item.fullName) {
                        let g = $('<div class="btn-group coach">');
                        let c = $('<a href="' + site + '/profile/' + item._id + '" class="btn btn-success btn-member" role="button">')
                            .append(item.fullName);
                        g.append(c);
                        c = $('<button id="RMC' + item._id + '" class="btn btn-success coach-remove">')
                            .append($('<span  class="glyphicon glyphicon-remove">'));
                        g.append(c);

                        t.append(g);
                    }

                });
                $(".coach-remove").on("click", function(ev){
                    viewTeam.removeCoach(teamId, this.id.substr(3));
                })

            } else {
                t.text('Žiadni tréneri');
            }
        } else {
            console.log("Server returned ERROR");
        }

    });

};

viewTeam.loadMembers = function(teamId){
    const site = location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: '');
    console.log("Loading team members");
    const t = $("#memberList");
    t.empty();
    $.get( "/team/"+teamId+"?cmd=getTeamMembers", function(res) {
        console.log("Server returned members",res);
        $('#memberCount').val(' ');
        if (res.result === 'ok'){
            console.log("List of",res.list.length,"records");
            $('#memberCount').val(res.list.length);
            t.empty();
            if (res.list.length > 0) {
                res.list.forEach(function(item) {

                    // display member only if full name is defined
                    if (item.fullName) {
                        let btnRemove = $('<button type="button" class="btn btn-link btn-xs">');
                        btnRemove.memberId = item._id;
                        btnRemove.on("click", function () {
                            viewTeam.removeMember(item._id, teamId);
                        });
                        btnRemove.append($('<span class="glyphicon glyphicon-remove">'));

                        let btnEdit = $('<button type="button" class="btn btn-link btn-xs">');
                        btnEdit.memberId = item._id;
                        btnEdit.on("click", function () {
                            viewTeam.editMember(item._id);
                        });
                        btnEdit.append($('<span class="glyphicon glyphicon-pencil">'));

                        let c = $('<div class="panel panel-default card">')
                            .append($('<div class="panel-heading">')
                                    .append(btnRemove)
                                    .append(item.fullName)
                                //.append(btnEdit)
                            )
                            .append($('<div class="panel-body form-inline">')
                                .append($('<input class="form-control" type="date" readonly '+ (item.dateOfBirth ? 'value="'+item.dateOfBirth.substr(0, 10)+'"' : "")+ '>'))
                                .append($('<input class="form-control" type="string" readonly value="' + (item.email ? item.email : '') + '">'))
                            );

                        t.append(c);
                    }

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

};

viewTeam.createNewTeamMember = function (teamId){

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
        $.post("/team/"+teamId,
            {
                cmd: 'createTeamMember',
                name: selName.val(),
                email: selEmail.val(),
                dob: selDOB.val()
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
                    viewTeam.loadMembers(teamId);
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
};

viewTeam.removeMember = function (id, teamId){
    console.log("Removing member",id);
    $.post("/team/"+teamId,
        {
            cmd: 'removeTeamMember',
            memberId: id
        },
        function (res) {
            console.log("removeTeamMember: Server returned",res);
            if (res.result == "ok") {
                console.log("Member removed");
                viewTeam.loadMembers(teamId);
            } else {
                console.log("Error while creating team");
            }
        }
    )
    .fail(function (err) {
        console.log("Member removal failed",err);
    });
};

viewTeam.editMember = function (id){
    console.log("Editing ",id);
};

viewTeam.saveAddressDetails2 = function (detType, fields, teamId, cb){
    console.log("Saving address details #2", detType);
    if (typeof cb !== "function") cb = libCommon.noop();

    let doc = {};
    for (let f of fields){
        doc[f.id] = f.value;
    }
    console.log("Posting request to save address details");

    $.ajax({
        type:"POST",
        url:"/team/"+teamId,
        dataType: "json",
        data: {
            cmd: 'saveAdrDetails',
            type: detType,
            data: JSON.stringify(doc)
        }

    })
        .done( function (res) {
            console.log("saveAdrDetails: Server returned",res);
            if (res.result == "ok") {
                console.log("Details saved");
                cb(res);
            } else {
                console.log("Error while saving details");
                cb(res,{message:"Zadané údaje sa nepodarilo uložiť.\n"+res.error.message});
            }
        })
        .fail(function (err) {
            console.log("Save failed",err);
            cb(null,{message:"Zadané údaje sa nepodarilo uložiť.\n"+err.message});

        });

};

viewTeam.loadAddressDetails2 = function (teamId,fields,cb){
    console.log("Loading team address details #2");
    $.get("/team/"+teamId+"?cmd=getAdrDetails")
        .done(function (res) {
            console.log("loadAdrDetails: Server returned",res);
            if (res.result == "ok") {
                for (let i=0; i<fields.length; i++){
                    let v = libCommon.objPathGet(res.details,fields[i].id);
                    if (v)
                        fields[i].value = v;
                }

                cb(fields);
            } else {
                console.log("Error while loading details");
            }
        })
        .fail(function (err) {
            console.log("Load failed",err);
        });
};

viewTeam.loadAvailableEvents = function (teamId){
    const sel = $('#availEvents');
    console.log('Loading events');
    $.get( "/event?cmd=getAvailTeamEvents&teamId="+teamId, function(res) {
        console.log("Server returned events",res);
        if (res.result === 'ok'){
            // sort events by name
            res.list.sort(function(a,b) {return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);} );
            sel.empty();
            if (res.list.length > 0) {
                console.log("Found ",res.list.length,"records");
                res.list.forEach(function(item) {
                    var c = $('<option value="'+item._id+'"">').append(item.name);
                    sel.append(c);
                });
            } else {
                sel.text('Žiadne');
            }
        } else {
            console.log("Server returned ERROR");
        }

    });

};

viewTeam.loadTeamData = function (teamId){
    $.get( "/team/"+teamId+"?cmd=getData", function(res) {
        console.log('Server returned team data',res);
        if (res.result === 'ok'){

        } else {
            console.log('Server returned error');
        }
    });
};

viewTeam.registerForEvent = function (teamId){
    console.log('Registering for event');
    const eventId = $('#availEvents').val();
    $.post("/event/"+eventId,
        {
            cmd: 'registerTeam',
            teamId: teamId
        },
        function (res) {
            console.log("registerTeam for event: Server returned",res);
            if (res.result == "ok") {
                console.log("team registered");
                location.reload(true);
            } else {
                console.log("Error while registering for event");
                alert("Registrácia tímu nebola úspešná.\nSkontrolujte, či ste zadali všetky potrebné údaje o zriaďovateľovi\n a vyplnili fakturačnú a korešpondenčnú adresu.\n\n"+res.error.message);
            }
        }
    )
        .fail(function (err) {
            console.log("Registration for event failed",err);
        });

};


viewTeam.loadInvoices = function(teamId){
    console.log('Loading invoices');
    const sel = $("#invoices");
    $.get( "/invoice?cmd=getList&teamId="+teamId, function(res) {
        console.log("Server returned invoices",res);
        if (res.result === 'ok'){
            // sort invoices by issuing date
            res.list.sort(function(a,b) {return (a.issuedOn > b.issuedOn) ? 1 : ((b.issuedOn > a.issuedOn) ? -1 : 0);} );
            sel.empty();
            if (res.list.length > 0) {
                console.log("Found ",res.list.length,"records");

                sel.append($('<label class="form-label" >').append('Faktúry'));
                res.list.forEach(function (item) {
                    let iOn, dOn, pOn;
                    if (item.issuedOn)
                        try { iOn = new Date(item.issuedOn); } catch (err) { iOn = null; }
                    if (item.dueOn)
                        try { dOn = new Date(item.dueOn); } catch (err) { dOn = null; }
                    if (item.paidOn)
                        try { pOn = new Date(item.paidOn); } catch (err) { pOn = null; }

                    let c = $('<li class="list-group-item">')
                        .append($('<h5 class="list-group-item-heading">')
                            .append($('<a  href="/invoice/' + item._id + '">')
                                .append((item.type == "P" ? "Zálohová " : "") + item.number)
                            )
                        )
                        .append($('<p class="list-group-item-text">')
                            .append("Vystavená " + (item.issuedOn ? iOn.toLocaleDateString() : "-error-"))
                            .append("  Splatná " + (item.dueOn ? dOn.toLocaleDateString() : "-error-"))
                            .append((item.paidOn ? "  Zaplatená "+pOn.toLocaleDateString() : ''))
                        );

                    console.log("=== TAXINVOICE",item.taxInvoice);

                    if (item.type == "P" && !item.taxInvoice)
                        c
                            .append($('<a href="/invoice/' + item._id + '?cmd=reloadInvoiceData" class="btn btn-default">')
                                .append('Nahraj nové údaje')
                            )
                            .append($('<button id="CIN'+item._id+'" class="btn btn-default createTaxInvoice">')
                                .append('Vytvor faktúru')
                            );
                    /*
                    if (!item.paidOn)
                        c
                            .append($('<button id="PAY'+item._id+'" class="btn btn-default markAsPaid">')
                                .append('Zaplať')
                            );
                    */
                    sel.append(c);
                });

                libInvoice.initInvoiceButtons(
                    function(){ loadInvoices(teamId);}
                );

            } else {
                sel.text('Žiadne');
            }
        } else {
            console.log("Server returned ERROR");
        }

    });

};

