"use strict";

const libModals = {};

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