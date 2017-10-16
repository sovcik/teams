"use strict";

var viewInvoice = {};

viewInvoice.init = function(invId, u) {
    console.log("Invoice initialized");
    var user = JSON.parse(u);
    console.log("json-user=",user );

    $("#invPrint").on("click", function(e){
        console.log("click invoice print",invId);
        $("#invActions").dropdown("toggle");
        window.print();
        e.stopPropagation();
        e.preventDefault();
    } );

    $("#invPay").on("click", function(e){
        console.log("click invoice paid",invId);
        $("#invActions").dropdown("toggle");
        libInvoice.markAsPaid(
            invId,
            function(res, err){
                if (err)
                    alert("Nepodarilo sa označiť faktúru ako zaplatenú");
                else {
                    alert("Faktúru označená ako zaplatená");
                    location.reload();
                }
            }
        );

        e.stopPropagation();
        e.preventDefault();
    } );

    $("#invRemove").on("click", function(e){
        console.log("click invoice remove",invId);
        $("#invActions").dropdown("toggle");
        libInvoice.remove(
            invId,
            function (res,err) {
                if (err)
                    alert("Nepodarilo sa vymazať faktúru.");
                else {
                    alert("Faktúra vymazaná.");
                    window.history.back();
                }
            }
        );
        e.stopPropagation();
        e.preventDefault();

    });

    $("#invNotifyOverdue").on("click", function(e){
        console.log("click invoice notify overdue",invId);
        $("#invActions").dropdown("toggle");
        libInvoice.notifyOverdue(
            invId,
            function (res,err) {
                if (err)
                    alert("Nepodarilo sa poslať upozornenie.");
                else {
                    alert("Upozornenie poslané.");
                }
            }
        );
        e.stopPropagation();
        e.preventDefault();

    });

};
