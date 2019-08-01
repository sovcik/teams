'use strict';

var viewTeam = {};

viewTeam.init = function(teamId, u){
    console.log("/team - Initializing");
    var user = JSON.parse(u);
    moment.locale(user.locales.substr(0,2));
    console.log("locales=",user.locales);

    viewTeam.user = user;

    $(document).ready(function() {

        var list10 = function(){
            var a = [];
            for(var i=0;i<11;i++){
                a.push({"value":i, "text":i.toString()});
            }
            console.log(a);
            return a;
        };

        if (viewTeam.user.permissions.isAdmin || viewTeam.user.permissions.isCoach) {
            $.fn.editable.defaults.mode = 'popup';
            $('#teamName').editable();
            $('#girlCount').editable({source:list10});
            $('#boyCount').editable({source:list10});
        }
    });

    $("#createMember").on("click", function(){
        var fields = [
            {id:"fullName", label:"Meno a priezvisko", type:"text", required:1},
            {id:"dateOfBirth", label:"Dátum narodenia", type:"date", locales:viewTeam.user.locales, dateFormat:viewTeam.user.dateFormat},
            {id:"email", label:"e-mail", type:"email"}
        ];
        libModals.multiFieldDialog(
            "Člen tímu",
            "Zadajte údaje člena tímu",
            fields,
            function (flds, cb) {
                viewTeam.createNewTeamMember(teamId,fields,cb);
            },
            function cb(res, err) {
                if (err) {
                    console.log("CB-ERROR", err);
                    alert("Nepodarilo sa pridať člena tímu.\n\n"+err.message);
                } else {
                    console.log("CB-OK Member created");
                    alert("Člen tímu bol vytvorený.");
                    viewTeam.loadMembers(teamId);
                }
                console.log("CB-DONE");
            }
        );

    });

    $("#btnRegister").on("click", function(){
        viewTeam.registerForEvent(teamId);
    });

    $("#btnRemoveTeam").on("click", function(){
        viewTeam.removeTeam(teamId);
    });

    $("#btnRestoreTeam").on("click", function(){
        viewTeam.restoreTeam(teamId);
    });


    $("#btnFounderDetails").on("click", function(event){
        var fields = [
            {id:"btnCpyFromBill", label:"Kopíruj údaje z fakturačných", type:"button", onclick:function(){viewTeam.cpyAdr('B','F',teamId)}},
            {id:"foundingOrg.name", label:"Názov", type:"text", placeholder:"názov organizácie", required:1},
            {id:"foundingAdr.addrLine1", label:"Adresa - riadok 1", type:"text", placeholder:"adresa riadok 1", required:1},
            {id:"foundingAdr.addrLine2", label:"Adresa - riadok 2", type:"text", placeholder:"adresa riadok 2"},
            {id:"foundingAdr.city",  label:"Mesto", type:"text", placeholder:"mesto", required:1},
            {id:"foundingAdr.postCode", label:"PSČ", type:"text", placeholder:"poštové smerové číslo", required:1},
            {id:"foundingOrg.companyNo", label:"IČO", type:"text"},
            {id:"foundingOrg.taxNo", label:"DIČ", type:"text"},
            {id:"foundingOrg.VATNo", label:"IČ DPH", type:"text"}
        ];

        libModals.fields = fields;

        viewTeam.loadAddressDetails2(teamId,fields,function(res,err) {

            libModals.multiFieldDialog(
                "Zriaďovateľ tímu",
                "Organizácia, ktorá je zriaďovateľom tímu (škola, CVČ, ...)",
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
        var fields = [
            {id:"btnCpyFromFnd", label:"Kopíruj údaje zo zriaďovateľa", type:"button", onclick:function(){viewTeam.cpyAdr('F','B',teamId)}},
            {id:"billingOrg.name", label:"Názov", type:"text", placeholder:"názov organizácie", required:1},
            {id:"billingAdr.addrLine1", label:"Adresa - riadok 1", type:"text", placeholder:"adresa riadok 1", required:1},
            {id:"billingAdr.addrLine2", label:"Adresa - riadok 2", type:"text", placeholder:"adresa riadok 2"},
            {id:"billingAdr.city",  label:"Mesto", type:"text", placeholder:"mesto", required:1},
            {id:"billingAdr.postCode", label:"PSČ", type:"text", placeholder:"poštové smerové číslo", required:1},
            {id:"billingOrg.companyNo", label:"IČO", type:"text"},
            {id:"billingOrg.taxNo", label:"DIČ", type:"text"},
            {id:"billingOrg.VATNo", label:"IČ DPH", type:"text"}
        ];

        libModals.fields = fields;

        viewTeam.loadAddressDetails2(teamId,fields,function(res,err) {

            libModals.multiFieldDialog(
                "Fakturačné údaje",
                "Tieto údaje sa použijú na vystavenie faktúr.",
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

        var fields = [
            {id:"btnCpyFromFnd", label:"Kopíruj údaje zo zriaďovateľa", type:"button", onclick:function(){viewTeam.cpyAdr('F','S',teamId)}},
            {id:"shippingOrg.name", label:"Názov", type:"text", placeholder:"názov organizácie", required:1},
            {id:"shippingAdr.addrLine1", label:"Adresa - riadok 1", type:"text", placeholder:"adresa riadok 1", required:1},
            {id:"shippingAdr.addrLine2", label:"Adresa - riadok 2", type:"text", placeholder:"adresa riadok 2"},
            {id:"shippingAdr.city",  label:"Mesto", type:"text", placeholder:"mesto", required:1},
            {id:"shippingAdr.postCode", label:"PSČ", type:"text", placeholder:"poštové smerové číslo", required:1}
        ];

        libModals.fields = fields;

        viewTeam.loadAddressDetails2(teamId,fields,function(res,err) {

            libModals.multiFieldDialog(
                "Korešpondenčné údaje",
                "Tieto údaje sa použijú pri zasielaní dokumentov/balíkov bežnou poštou alebo kuriérom.",
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

    $("#btnRegister2").on("click", function(event){

        var fields = [
            {id:"availProgs", label:"Programy", type:"select",
                init:function(domid,cb){libCommon.loadList(domid,"/program?cmd=getList&active=1&teamId="+teamId, cb)},
                onchange:function(){libCommon.loadList("MFDFavailEvents","/event?cmd=getList&active=1&program="+$('#MFDFavailProgs').val())}
            },
            {id:"availEvents", label:"Turnaje", type:"select",
                init:function(domid,cb){
                    libCommon.loadList(domid,"/event?cmd=getList&active=1&program="+$('#MFDFavailProgs').val(), cb);
                }
            },
            {id:"acceptRules", label:"Súhlasím s podmienkami programu a turnaja", type:"checkbox", required:true}


        ];

        libModals.fields = fields;

        libModals.multiFieldDialog(
            "Registruj na turnaj",
            "",
            fields,
            function (flds, cb) {
                viewTeam.registerForEvent(teamId,flds.find(function(f){ return f.id === "availEvents"}).value, cb);
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

    $("#btnCreateInvoice").on("click", function(event){

        var fields = [
            {id:"invType", label:"Typ faktúry", type:"select",
                options:[
                    {value:"P",label:"Zálohová faktúra"},
                    {value:"I",label:"Daňová faktúra"},
                    {value:"C",label:"Dobropis"},
                ],
            },
            {id:"availInvOrgs", label:"Fakturujúca organizácia", type:"select",
                init:function(domid,cb){
                    libCommon.loadList(domid,"/invorg?cmd=getList&active=1", cb);
                }
            }
        ];

        libModals.fields = fields;

        libModals.multiFieldDialog(
            "Vytvor novú faktúru",
            "",
            fields,
            function (flds, cb) {
                viewTeam.createInvoice(
                    teamId,
                    flds.find(function(f){ return f.id === "invType"}).value,
                    flds.find(function(f){ return f.id === "availInvOrgs"}).value,
                    cb
                );
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


    viewTeam.loadCoaches(teamId);
    //viewTeam.loadMembers(teamId);
    viewTeam.loadInvoices(teamId);
    viewTeam.loadDocs(teamId);

    console.log("/team - Initializing completed");
};

viewTeam.cpyAdr = function(ff,ft,teamId){
    console.log("Copying team address details #2");
    $.get(libCommon.getNoCache("/team/"+teamId+"?cmd=getAdrDetails"))
        .done(function (res) {
            console.log("cpyAdr: Server returned",res);
            if (res.result == "ok") {
                var fo, fa, fc;
                switch (ff){
                    case 'F':
                        fo = res.details.foundingOrg;
                        fa = res.details.foundingAdr;
                        fc = res.details.foundingContact;
                        break;
                    case 'B':
                        fo = res.details.billingOrg;
                        fa = res.details.billingAdr;
                        fc = res.details.billingContact;
                        break;
                    case 'S':
                        fo = res.details.shippingOrg;
                        fa = res.details.shippingAdr;
                        fc = res.details.shippingContact;
                        break;
                }
                switch (ft){
                    case 'F':
                        res.details.foundingOrg = fo;
                        res.details.foundingAdr = fa;
                        res.details.foundingContact = fc;
                        break;
                    case 'B':
                        res.details.billingOrg = fo;
                        res.details.billingAdr = fa;
                        res.details.billingContact = fc;
                        break;
                    case 'S':
                        res.details.shippingOrg = fo;
                        res.details.shippingAdr = fa;
                        res.details.shippingContact = fc;
                        break;

                }

                var fields = libModals.fields;
                for (var i=0; i<fields.length; i++){
                    var v = libCommon.objPathGet(res.details,fields[i].id);
                    if (v)
                        fields[i].value = v;
                }

                libModals.mfdUpdateFields(fields);

            } else {
                console.log("Error while copying details");
            }
        })
        .fail(function (err) {
            console.log("Copy failed",err);
        });
};

viewTeam.removeTeam = function (teamId) {
    var cfm = window.confirm("Kliknite OK ak naozaj chcete zrušiť tento tím.");
    if (cfm) {
        console.log("Posting request to remove team=",teamId);
        $.post("/team/",
            {
                cmd: 'remove',
                teamId: teamId
            },
            function (res) {
                console.log("removeTeam: Server returned",res);
                if (res.result == "ok") {
                    console.log("Team Removed");
                    location.reload();
                } else {
                    console.log("Error while removing team");
                    alert('Nepodarilo sa zrušiť tím.\n\n'+res.error.message);
                }
            }
        )
            .fail(function (err) {
                console.log("Error while removing team");
                alert('Nepodarilo sa zrušiť tím.\n\n'+err.message);
            });
    }
};

viewTeam.restoreTeam = function (teamId) {
    var cfm = window.confirm("Kliknite OK ak naozaj chcete obnoviť tento tím.");
    if (cfm) {
        console.log("Posting request to restore team=",teamId);
        $.post("/team/",
            {
                cmd: 'restore',
                teamId: teamId
            },
            function (res) {
                console.log("restoreTeam: Server returned",res);
                if (res.result == "ok") {
                    console.log("Team Restored");
                    location.reload();
                } else {
                    console.log("Error while restoring team");
                    alert('Nepodarilo sa obnoviť tím.\n\n'+res.error.message);
                }
            }
        )
            .fail(function (err) {
                console.log("Error while restoring team");
                alert('Nepodarilo sa obnoviť tím.\n\n'+err.message);
            });
    }
};

viewTeam.removeCoach = function (teamId, userId) {
    var cfm = window.confirm("Kliknite OK ak naozaj chcete odstrániť tohto trénera z tímu.");
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
    var site = location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: '');
    console.log("Loading team coaches");
    var t = $("#coachList");
    t.empty();
    $.get( libCommon.getNoCache("/team/"+teamId+"?cmd=getTeamCoaches"), function(res) {
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
                        var g = $('<div class="btn-group coach">');
                        var c = $('<a href="' + site + '/profile/' + item._id + '" class="btn btn-success btn-member" role="button">')
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
    var site = location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: '');
    console.log("Loading team members");
    var t = $("#memberList");
    t.empty();
    $.get( libCommon.getNoCache("/team/"+teamId+"?cmd=getTeamMembers"), function(res) {
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
                        var btnRemove = $('<button type="button" class="btn btn-link btn-xs">');
                        btnRemove.memberId = item._id;
                        btnRemove.on("click", function () {
                            viewTeam.removeMember(item._id, teamId);
                        });
                        btnRemove.append($('<span class="glyphicon glyphicon-remove">'));

                        var btnEdit = $('<button type="button" class="btn btn-link btn-xs">');
                        btnEdit.memberId = item._id;
                        btnEdit.on("click", function () {
                            viewTeam.editMember(item._id);
                        });
                        btnEdit.append($('<span class="glyphicon glyphicon-pencil">'));

                        var c = $('<div class="panel panel-default card">')
                            .append($('<div class="panel-heading">')
                                    .append(btnRemove)
                                    .append(item.fullName)
                                //.append(btnEdit)
                            )
                            .append($('<div class="panel-body form-inline">')
                                .append($('<input class="form-control" type="string" readonly value="'
                                    + (item.dateOfBirth?moment(item.dateOfBirth).format("L"):"xxx")
                                    + '">'))
                                .append($('<input class="form-control" type="string" readonly value="'
                                    + (item.email ? item.email : '')
                                    + '">'))
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

viewTeam.createNewTeamMember = function (teamId, fields, cb){

    console.log("Creating new team member");
    if (typeof cb !== "function") cb = libCommon.noop();

    console.log("Posting request to create new member");
    var dob = fields[1].dateValue;
    $.post("/team/"+teamId,
        {
            cmd: 'createTeamMember',
            name: fields[0].value,
            email: fields[2].value,
            dob: dob.getFullYear()+"-"+(dob.getMonth()+1)+"-"+(dob.getDate()<10?"0":"")+dob.getDate()
        },
        function (res) {
            console.log("createTeamMember: Server returned",res);
            if (res.result == "ok") {
                cb(res);
            } else {
                console.log("Error while creating team-member");
                cb(res,res.error);
            }
        }
    )
    .fail(function (err) {
        console.log("Creation failed",err);
        cb(res,err);

    });
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

    var doc = {};
    for (var i = 0; i<fields.length; i++){
        doc[fields[i].id] = fields[i].value;
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
    $.get(libCommon.getNoCache("/team/"+teamId+"?cmd=getAdrDetails"))
        .done(function (res) {
            console.log("loadAdrDetails: Server returned",res);
            if (res.result == "ok") {
                for (var i=0; i<fields.length; i++){
                    var v = libCommon.objPathGet(res.details,fields[i].id);
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

viewTeam.loadTeamData = function (teamId){
    $.get( libCommon.getNoCache("/team/"+teamId+"?cmd=getData"), function(res) {
        console.log('Server returned team data',res);
        if (res.result === 'ok'){

        } else {
            console.log('Server returned team data - error');
        }
    });
};

viewTeam.registerForEvent = function (teamId, eventId, cb){
    console.log('Registering team=', teamId, "for event=", eventId);
    var createInvoice = "yes";

    if (viewTeam.user.permissions.isAdmin && !confirm('Automaticky vytvoriť faktúru?')) {
        createInvoice = "no";
    }

    $.post("/event/"+eventId,
        {
            cmd: 'registerTeam',
            teamId: teamId,
            createInvoice: createInvoice
        },
        function (res) {
            console.log("registerTeam for event: Server returned",res);
            if (res.result == "ok") {
                console.log("team registered");
                if (res.messages){
                    res.messages.forEach(function(m,i){alert(m.message)})
                }
                location.reload(true);
            } else {
                console.log("Error while registering for event");
                alert("Registrácia tímu nebola úspešná.\nSkontrolujte, či ste zadali všetky potrebné údaje o zriaďovateľovi\n a vyplnili fakturačnú a korešpondenčnú adresu.\n\n"+res.error.message);
            }
            cb(res);
        }
    )
        .fail(function (err) {
            console.log("Registration for event failed",err);
            cb(null, err);
        });

};


viewTeam.loadInvoices = function(teamId){
    console.log('Loading invoices');
    var sel = $("#invoices");
    var selu = $("#invoices-unpaid");
    $.get( libCommon.getNoCache("/invoice?cmd=getList&teamId="+teamId), function(res) {
        console.log("Server returned invoices",res);
        if (res.result === 'ok'){
            // sort invoices by date
            res.list.sort(function(a,b) {return (a.issuedOn > b.issuedOn) ? 1 : ((b.issuedOn > a.issuedOn) ? -1 : 0);} );
            sel.empty();
            selu.empty();
            if (res.list.length > 0) {
                console.log("Found ",res.list.length,"records");
                sel.append($('<label class="form-label" >').append('Ostatné Faktúry'));
                selu.append($('<label class="form-label" >').append('Nezaplatené Faktúry'));

                res.list.forEach(function (item) {

                    var c = $('<li class="list-group-item">')
                        .append($('<h5 class="list-group-item-heading">')
                            .append($('<a  href="/invoice/' + item._id + '">')
                                .append((item.isDraft?"Návrh ":""))
                                .append((item.type == "P" ? "Zálohová " : item.type == "C" ? "Dobropis " : "") + item.number)
                            )
                        );

                    if (!item.isDraft)
                        c.append($('<p class="list-group-item-text">')
                            .append("Vystavená " + moment(item.issuedOn).format("L"))
                            .append(item.paidOn ? ("  Zaplatená "+moment(item.paidOn).format("L")) : ("  Splatná " + (item.dueOn ? moment(item.dueOn).format("L"):'')) )
                        );

                    if (item.type == "P" && !item.taxInvoice && !item.isDraft)
                        c
                            .append($('<button id="CIN'+item._id+'" class="btn btn-default createTaxInvoice">')
                                .append('Vytvor faktúru')
                            );

                    if (!item.paidOn) {
                        selu.append(c);
                    } else {
                        sel.append(c);
                    }
                });

                libInvoice.initInvoiceButtons(
                    function(){ viewTeam.loadInvoices(teamId);}
                );

            } else {
                sel.text('Žiadne');
            }
        } else {
            console.log("Server returned ERROR");
        }

    });

};

viewTeam.createInvoice = function (teamId, invType, invOrgId, cb){

    console.log("Creating new invoice", "type=",invType, "io=",invOrgId);
    if (typeof cb !== "function") cb = libCommon.noop();

    console.log("Posting request to create new invoice");

    $.post("/invoice/",
        {
            cmd: 'create',
            teamId: teamId,
            type: invType,
            invOrgId: invOrgId
        },
        function (res) {
            console.log("createInvoice: Server returned",res);
            if (res.result == "ok") {
                cb(res);
                location.reload(true);
            } else {
                console.log("Error while creating invoice");
                cb(res,res.error);
            }
        }
    )
        .fail(function (err) {
            console.log("Invoice creation failed",err);
            cb(res,err);

        });
};

viewTeam.loadDocs = function (teamId){
    var sel = $('#docList');
    console.log('Loading documents');
    $.get( libCommon.getNoCache("/docs?cmd=getListTeam&teamId="+teamId), function(res) {
        console.log("loadDocs: Server returned",res);
        if (res.result === 'ok'){
            // sort by name
            res.list.sort(function(a,b) {return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);} );
            sel.empty();
            if (res.list.length > 0) {
                console.log("Found ",res.list.length,"records");
                var i=1;
                res.list.forEach(function(item) {
                    if (item.name.length>0) {
                        var c = $('<a class="list-group-item" href="/docs?cmd=download&doc=' + item.key + '"">').append((i++) + '. ' + item.name + ' [' + Math.round(item.size / 1024) + ' kiB]');
                        sel.append(c);
                    }
                });
            } else {
                sel.text('Žiadne dokumenty, alebo nie ste registrovaní na žiadny turnaj.');
            }
        } else {
            console.log("loadDocs: Server returned ERROR");
        }

    });

};