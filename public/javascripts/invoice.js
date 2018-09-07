"use strict";

var viewInvoice = {};

viewInvoice.init = function(invId, u) {
    console.log("Invoice initialized");
    viewInvoice.user = JSON.parse(u);

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
        var fields = [
            {id:"paidOn", label:"Dátum zaplatenia", type:"date", required:1, locales:viewInvoice.user.locales, dateFormat:viewInvoice.user.dateFormat}
        ];

        libModals.multiFieldDialog(
            "Zaplatenie faktúry",
            "",
            fields,
            function (flds, cb) {
                var pd = flds.find(function(f){return f.id == "paidOn"}).dateValue;
                pd.setHours(12); // adjust hours so paid date will be ok for all time zones
                libInvoice.markAsPaid(
                    invId,
                    function (res, err) {
                        if (err)
                            alert("Nepodarilo označiť faktúru ako zaplatenú.");
                        else {
                            alert("Faktúra zaplatená.");
                            location.reload();
                        }
                    },
                    pd,
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

    $("#invRemove").on("click", function(e){
        console.log("click invoice remove",invId);
        if (confirm('Naozaj chcete vymazať túto faktúru?')) {

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

    $("#invLoadBillTo").on("click", function(e){
        console.log("click invoice load bill-to",invId);
        if (confirm('Naozaj chcete znovunačítať fakturačné údaje?')) {
            $("#invActions").dropdown("toggle");
            libInvoice.loadBillingDetails(
                invId,
                function (res, err) {
                    if (err)
                        alert("Nepodarilo sa znovunačítať fakturačné údaje.");
                    else {
                        alert("Faktúračné údaje boli úspešne načítané.");
                        location.reload();
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
                    flds.find(function(f){return f.id == "text"}).value,
                    flds.find(function(f){return f.id == "price"}).value,
                    flds.find(function(f){return f.id == "id"}).value,
                    flds.find(function(f){return f.id == "qty"}).value,
                    flds.find(function(f){return f.id == "unit"}).value,
                    flds.find(function(f){return f.id == "note"}).value
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
