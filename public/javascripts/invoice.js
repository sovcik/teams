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

    $("#invAddLine").on("click", function(e){
        console.log("click invoice add line",invId);
        if (confirm('Naozaj chcete pridať príspevok?')) {
            $("#invActions").dropdown("toggle");
            libInvoice.addLine(
                invId,
                function (res, err) {
                    if (err)
                        alert("Nepodarilo sa pridať riadok.");
                    else {
                        alert("Riadok pridaný.");
                        location.reload();
                    }
                },
                "Príspevok na registráciu",
                -100.0
            );
        }
        e.stopPropagation();
        e.preventDefault();

    });

};
