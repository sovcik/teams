"use strict";

var viewInvoice = {};

viewInvoice.init = function(invId, u) {
    console.log("Invoice initialized");
    var user = JSON.parse(u);

    $("#invPrint").on("click", function(e){
        console.log("click invoice print",invId);
        $("#invActions").dropdown("toggle");
        window.print();
        e.stopPropagation();
        e.preventDefault();
    } );

    $("#invPay").on("click", function(e){
        console.log("click invoice paid",invId);
        if (confirm("Naozaj chcete faktúru označiť ako zaplatenú?")) {
            $("#invActions").dropdown("toggle");
            libInvoice.markAsPaid(
                invId,
                function (res, err) {
                    if (err)
                        alert("Nepodarilo sa označiť faktúru ako zaplatenú");
                    else {
                        alert("Faktúru označená ako zaplatená");
                        location.reload();
                    }
                }
            );
        }
        e.stopPropagation();
        e.preventDefault();
    } );

    $("#invRemove").on("click", function(e){
        console.log("click invoice remove",invId);
        if (confirm('Naozaj chcete vymazať túto faktúru?')) {
            $("#invActions").dropdown("toggle");
            libInvoice.remove(
                invId,
                function (res, err) {
                    if (err)
                        alert("Nepodarilo sa vymazať faktúru.");
                    else {
                        alert("Faktúra vymazaná.");
                        window.history.back();
                    }
                }
            );
        }
        e.stopPropagation();
        e.preventDefault();

    });

    $("#invConfirm").on("click", function(e){
        console.log("click invoice confirm",invId);
        if (confirm('Naozaj chcete potvrdiť tento návrh faktúry?')) {
            $("#invActions").dropdown("toggle");
            libInvoice.confirm(
                invId,
                function (res, err) {
                    if (err)
                        alert("Nepodarilo sa potvrdiť faktúru.");
                    else {
                        alert("Faktúra potvrdená.");
                        location.reload();
                    }
                }
            );
        }
        e.stopPropagation();
        e.preventDefault();

    });

    $("#invNotifyOverdue").on("click", function(e){
        console.log("click invoice notify overdue",invId);
        if (confirm('Naozaj chcete poslať upomienku?')) {
            $("#invActions").dropdown("toggle");
            libInvoice.notifyOverdue(
                invId,
                function (res, err) {
                    if (err)
                        alert("Nepodarilo sa poslať upozornenie.");
                    else {
                        alert("Upozornenie poslané.");
                    }
                }
            );
        }
        e.stopPropagation();
        e.preventDefault();

    });

    $("#invAddItem").on("click", function(e){
        console.log("click invoice add item",invId);
        $("#invActions").dropdown("toggle");
        var fields = [
            {id:"id", label:"Číslo riadku", type:"number", required:1},
            {id:"text", label:"Popis položky", type:"text", placeholder:"položka", required:1},
            {id:"note", label:"Poznámka k položke", type:"text", placeholder:"", required:0},
            {id:"price", label:"Cena", type:"number", required:1},
            {id:"qty",  label:"Množstvo", type:"number", required:1},
            {id:"unit", label:"Jednotka", type:"text", placeholder:"-- ks --", required:0}
        ];

        libModals.multiFieldDialog(
            "Nový riadok faktúry",
            "",
            fields,
            function (flds, cb) {
                libInvoice.addItem(
                    invId,
                    function (res, err) {
                        if (err)
                            alert("Nepodarilo sa pridať riadok.");
                        else {
                            alert("Riadok pridaný.");
                            location.reload();
                        }
                    },
                    fields.find(function(f){return f.id == "text"}).value,
                    fields.find(function(f){return f.id == "price"}).value,
                    fields.find(function(f){return f.id == "id"}).value,
                    fields.find(function(f){return f.id == "qty"}).value,
                    fields.find(function(f){return f.id == "unit"}).value,
                    fields.find(function(f){return f.id == "note"}).value
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

        e.stopPropagation();
        e.preventDefault();

    });

    $("#invRenumber").on("click", function(e){
        var i = e.target.id.substr(3);
        console.log("click invoice renumber items",e,i);
        if (confirm('Naozaj chcete prečíslovať riadky dokladu?')) {
            libInvoice.renumberItems(
                invId,
                function (res, err) {
                    if (err)
                        alert("Nepodarilo sa prečíslovať riadky.");
                    else {
                        alert("Riadoky sú prečíslované.");
                        location.reload();
                    }
                },
                i
            );
        }
        e.stopPropagation();
        e.preventDefault();

    });

    $(".invRemoveItem").on("click", function(e){
        var i = e.target.id.substr(3);
        console.log("click invoice remove item",e,i);
        if (confirm('Naozaj chcete vymazať riadok '+i+'?')) {
            libInvoice.removeItem(
                invId,
                function (res, err) {
                    if (err)
                        alert("Nepodarilo sa vymazať riadok.");
                    else {
                        alert("Riadok vymazaný.");
                        location.reload();
                    }
                },
                i
            );
        }
        e.stopPropagation();
        e.preventDefault();

    });

};
