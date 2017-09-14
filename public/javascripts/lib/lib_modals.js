"use strict";

const libModals = {};

libModals.fields = [];

libModals.selectUserDialog = function (title, fnValidate, onSuccess, onError){

    $("#selectUserDlg").remove();
    
    $("#modalDlgs").append(
        $("<div id='selectUserDlg' class='modal fade' role='dialog' >")
            .append($("<div class='modal-dialog'>")
                .append($("<div class='modal-content'>")
                    .append($("<div class='modal-header'>")
                        .append($("<button type='button' class='close' data-dismiss='modal'>").append("&times;"))
                        .append("<h4 class='modal-title'>").append(title)
                    )
                    .append($("<div class='modal-body'>")
                        .append($("<label>").append("Účet používateľa"))
                        .append($("<input id='usrname' type='text' placeholder='zadaj účet používateľa' class='form-control'>"))
                    )
                    .append($("<div class='modal-footer'>")
                        .append($("<button id='btnUserEntered' type='button' class='btn btn-default'>").append("OK"))
                    )
                )
            )
    );

    $("#btnUserEntered").on("click",function(ev){
        console.log("User entered");
        fnValidate(
            ev,
            $("#usrname").val(),
            function(result){
                $("#selectUserDlg").modal("hide");
                if (onSuccess)
                    onSuccess(result);
            },
            onError
        );
    });

    console.log("Opening select user dialog");
    $("#selectUserDlg").modal("show");

};

libModals.editValue = function (title, label, placeholder, valType, oldValue, fnValidate, onSuccess, onError){

    $("#editValueDlg").remove();

    $("#modalDlgs").append(
        $("<div id='editValueDlg' class='modal fade' role='dialog' >")
            .append($("<div class='modal-dialog'>")
                .append($("<div class='modal-content'>")
                    .append($("<div class='modal-header'>")
                        .append($("<button type='button' class='close' data-dismiss='modal'>").append("&times;"))
                        .append("<h4 class='modal-title'>").append(title)
                    )
                    .append($("<div class='modal-body'>")
                        .append($("<label>").append(label))
                        .append($("<input id='newValue' type='"+valType+"' placeholder='"+placeholder+"' class='form-control'>"))
                    )
                    .append($("<div class='modal-footer'>")
                        .append($("<button id='btnValueEntered' type='button' class='btn btn-default'>").append("OK"))
                    )
                )
            )
    );

    $("#btnValueEntered").on("click",function(ev){
        console.log("Value entered");
        fnValidate(
            ev,
            $("#newValue").val(),
            function(result){
                $("#editValueDlg").modal("hide");

                if (onSuccess)
                    onSuccess(result);
            },
            onError
        );
    });

    console.log("Opening edit value dialog");
    $("#editValueDlg").modal("show");

};

libModals.mfdUpdateFields = function(fields){
    for (let i = 0; i < fields.length; i++){
        let f = fields[i];
        if (f.value)
            switch (f.type){
                case 'checkbox':
                    document.getElementById("MFDF" + f.id).checked = f.value;
                    break;
                case 'button':
                    break;
                default:
                    document.getElementById("MFDF" + f.id).value = f.value;

            }
    }
};

libModals.multiFieldDialog = function (title, subtitle, fields, fnvalidate, cb){

    function showErrFields(flds){
        for (let i = 0; i < flds.length; i++)
            document.getElementById("MFDG" + flds[i].field).classList.add("has-error");
    }

    if (typeof cb !== "function") cb = libCommon.noop();

    // if no second-level validation provided
    if (typeof fnvalidate !== "function")
        fnvalidate = function(flds,cb2){
            if (typeof cb2 !== "function") cb2 = libCommon.noop();
            cb2(flds);
        };

    $("#multiFieldDlg").remove();

    let flds = $("<div class='modal-body'>");

    for(let i = 0; i < fields.length; i++){
        let f = fields[i];
        let gr = $("<div id='MFDG"+f.id+"'>");
        switch (f.type){
            case "button":
                gr
                    .append($('<button id="MFDF'+f.id+'" class="btn btn-info" type="button" onclick="'+f.onclick+'">')
                        .append(f.label)
                    );
                break;
            case "checkbox":
            case "option":
                gr
                    .append($("<div class='"+f.type+"'>")
                        .append($("<label>")
                            .append($("<input id='MFDF"+f.id
                                +"' type='"+f.type+"' "
                                +(f.value?("value='"+f.value+"'"):" ")
                                +" name='"+f.name+"'>"))
                            .append(f.label)
                        )
                    );
                break;
            default:
                gr
                    .append($("<div class='form-group'>")
                        .append($("<label for='MFDF"+f.id+"'>").append(f.label))
                        .append($("<input id='MFDF"+f.id
                            +"' type='"+f.type+"' "
                            +(f.placeholder?("placeholder='"+f.placeholder+"'"):" ")
                            +(f.value?("value='"+f.value+"'"):" ")
                            +" class='form-control' name='"+f.name+"'>")
                        )
                    );

        }
        flds.append(gr);
    }

    $("#modalDlgs").append(
        $("<div id='multiFieldDlg' class='modal fade' role='dialog' >")
            .append($("<div class='modal-dialog'>")
                .append($("<div class='modal-content'>")
                    .append($("<div class='modal-header'>")
                        .append($("<button type='button' class='close' data-dismiss='modal'>").append("&times;"))
                        .append($("<h4 class='modal-title'>").append(title))
                        .append($("<p>").append(subtitle))
                    )
                    .append(flds)
                    .append($("<div class='modal-footer'>")
                        .append($("<button id='MFDbtnOK' type='button' class='btn btn-default'>").append("OK"))
                    )
                )
            )
    );

    $("#MFDbtnOK").on("click",function(ev){
        console.log("MFD OK clicked");

        for(let i = 0;i<fields.length;i++) {
            switch (fields[i].type) {
                case "button":
                    break;
                case "checkbox":
                    fields[i].value = document.getElementById("MFDF" + fields[i].id).checked;
                    break;
                default:
                    fields[i].value = document.getElementById("MFDF" + fields[i].id).value;
            }
        }

        for (let i = 0;i<fields.length;i++)
            document.getElementById("MFDG" + fields[i].id).classList.remove("has-error");

        console.log(fields);

        libForms.validate(
            fields,
            function(result, err){
                if (!err)
                    // second level validation can validate e.g. against database
                    fnvalidate(result,function(res2,err2){
                        if (!err2)
                            $("#multiFieldDlg").modal("hide");
                        else
                            showErrFields(err2.errors);
                        cb(res2, err2);
                    });

                else {
                    showErrFields(err.errors);
                    cb(result, err);
                }
            }
        );
    });

    console.log("Opening multi-field dialog");
    $("#multiFieldDlg").modal("show");

};