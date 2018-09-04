"use strict";

var libModals = {};

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
    for (var i = 0; i < fields.length; i++){
        var f = fields[i];
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
        if (!flds)
            return;
        for (var i = 0; i < flds.length; i++)
            document.getElementById("MFDG" + flds[i].field).classList.add("has-error");
    }

    // if no callback has been specified, then define empty one
    if (typeof cb !== "function") cb = libCommon.noop();

    // if no second-level validation provided
    if (typeof fnvalidate !== "function")
        fnvalidate = function(flds,cb2){
            if (typeof cb2 !== "function") cb2 = libCommon.noop();
            cb2(flds);
        };

    // remove any previously created dialog
    $("#multiFieldDlg").remove();

    var flds = $("<div class='modal-body'>");

    // construct HTML representation for each field
    for(var i = 0; i < fields.length; i++){
        var f = fields[i];
        var gr = $("<div id='MFDG"+f.id+"'>");
        switch (f.type){
            case "button":
                gr
                    .append($('<button id="MFDF'+f.id+'" class="btn btn-info" type="button">')
                        .append(f.label)
                    );
                break;
            case "checkbox":
            case "option":
                gr
                    .append($("<div class='"+f.type+"'>")
                        .append($("<label>")
                            .append($("<select id='MFDF"+f.id+"'"
                                +(f.value?(" value='"+f.value+"'"):"")
                                +" name='"+f.name+"'>"))
                            .append(f.label)
                        )
                    );
                break;
            case "select":
                gr
                    .append($("<div class='form-group'>")
                        .append($("<label for='MFDF"+f.id+"'>").append(f.label))
                        .append($("<select id='MFDF"+f.id+"'"
                            +" class='form-control' name='"+f.name+"'>")
                        )
                    );
                break;
            case "date":
                gr
                    .append($("<div class='form-group'>")
                            .append($("<label for='MFDF"+f.id+"'>").append(f.label))
                            .append($("<input id='MFDF"+f.id+"'"
                                +" type='text' "
                                +(f.value?("value='"+f.value+"'"):" ")
                                +(f.dateFormat?("placeholder='"+f.dateFormat+"'"):" ")
                                +" class='form-control MFDFdatepckr' name='"+f.name+"'>")
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

    // add form to DOM - document is expected to have modalDlgs element
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

    // set default values
    for(var i = 0;i<fields.length;i++) {
        if (fields[i].value)
            switch (fields[i].type) {
                case "button":
                    break;
                case "checkbox":
                    document.getElementById("MFDF" + fields[i].id).checked = fields[i].value;
                    break;
                default:
                    document.getElementById("MFDF" + fields[i].id).value = fields[i].value;
            }
    }

    // configure onChange/onClick for fields
    for (var i = 0;i<fields.length;i++) {
        if (fields[i].onchange) {
            // set onChange if provided
            document.getElementById("MFDF" + fields[i].id).addEventListener("change", fields[i].onchange);

            // this is special handling for select which have less than 2 options
            // in such case onChange will be never triggered and so it is necessary to trigger it manually
            // via onClick - this is done in order to support chained dopdown boxes
            if (fields[i].type === 'select') {
                (function (idx) {
                    document.getElementById("MFDF" + fields[idx].id).addEventListener("click", function () {
                        var s = document.getElementById("MFDF" + fields[idx].id);
                        if (s.length < 2) {
                            if ("createEvent" in document) {
                                var evt = document.createEvent("HTMLEvents");
                                evt.initEvent("change", false, true);
                                s.dispatchEvent(evt);
                            }
                            else
                                s.fireEvent("onchange");
                            //alert("short");
                        }
                    });
                })(i);
            }
        }
        if (fields[i].onclick) {
            // set onClick if provided
            document.getElementById("MFDF" + fields[i].id).addEventListener("click", fields[i].onclick);
        }
    }

    // perform field initialization - if provided
    // fields will be initialized sequentially so field initialized later can use value of field initialized earlier
    forEach(fields, function(item, index, arr) {
        if (item.init) {
            console.log("Initializing ", "MFDF" + item.id);
            item.init("MFDF" + item.id, this.async());
        }

    });

    // set submit handling
    $("#MFDbtnOK").on("click",function(ev){
        console.log("MFD OK clicked");
        console.log("Fields=",fields);

        // clear valiedation error flag - just in case
        for (var i = 0;i<fields.length;i++)
            document.getElementById("MFDG" + fields[i].id).classList.remove("has-error");

        // read values into the fields array
        for(var i = 0;i<fields.length;i++) {

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

        // run validation
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

    // add lookup method to fields array
    fields.findById = function(findValue){return this.find(function(f){return f.id == findValue})};

    console.log("Opening multi-field dialog");
    $("#multiFieldDlg").modal("show");

};