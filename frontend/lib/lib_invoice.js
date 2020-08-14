"use strict";

var libInvoice = {};

libInvoice.createTaxInvoice = function(invId, cb){
    console.log('Creating tax invoice for '+invId);
    (typeof cb === 'function') || (cb = libCommon.noop);
    $.post("/invoice/"+invId,
        {
            cmd: 'copyToNew',
            type: 'I'
        },
        function (res) {
            console.log("createTaxInvoice: Server returned",res);
            if (res.result == "ok") {
                console.log("tax invoice created", res.invoice._id);
                cb(res);
            } else {
                console.log("Error while creating invoice",res);
                cb(res,{message:"Error while creating invoice"});
            }
        }
    )
        .fail(function (err) {
            console.log("Invoice creation failed",err);
            cb(null,err);
        });

};


libInvoice.loadBillingDetails = function(invId, cb, paidOn){
    console.log('loading billing details to invoice '+invId);
    (typeof cb === 'function') || (cb = libCommon.noop);
    $.post("/invoice/"+invId,
        {
            cmd : 'reloadBillTo'
        },
        function (res) {
            console.log("loadBilling: Server returned",res);
            if (res.result == "ok") {
                console.log("loadBilling: details loaded", res.invoice._id);
                cb(res);
            } else {
                console.log("Error loading billing details",res);
                cb(res,{message:"Error loading billing details"});
            }
        }
    )
        .fail(function (err) {
            console.log("Error loading billing details",err);
            cb(null, err);
        });
};


libInvoice.markAsPaid = function(invId, cb, paidOn){
    console.log('Marking invoice as paid '+invId);
    (typeof cb === 'function') || (cb = libCommon.noop);
    $.post("/invoice/"+invId,
        {
            cmd : 'markAsPaid',
            paidOn : paidOn.toISOString()
        },
        function (res) {
            console.log("markAsPaid: Server returned",res);
            if (res.result == "ok") {
                console.log("invoice marked as paid", res.invoice._id);
                cb(res);
            } else {
                console.log("Error marking invoice as paid",res);
                cb(res,{message:"Error marking invoice as paid"});
            }
        }
    )
        .fail(function (err) {
            console.log("Error marking invoice as paid",err);
            cb(null, err);
        });
};

libInvoice.create = function(teamId, eventId, invType, cb){
    console.log("Creating invoice draft for team",teamId);
    (typeof cb === 'function') || (cb = libCommon.noop);
    $.post("/invoice",
        {
            cmd: 'create',
            teamId: teamId,
            eventId: eventId,
            type: invType
        },
        function (res) {
            console.log("createInvoice: Server returned",res);
            if (res.result == "ok") {
                console.log("Invoice created",res.invoice._id);
                if (cb)
                    cb(res.invoice);
            } else {
                console.log("Error while creating invoice");
                if (cb)
                    cb(null,{message:"Error while creating invoice"});
            }
        }
    )
        .fail(function (err) {
            console.log("Error while creating invoice",err);
            if (cb)
                cb(null,err)
        });

};

libInvoice.remove = function(invId, cb){
    console.log('Removing invoice '+invId);
    (typeof cb === 'function') || (cb = libCommon.noop);
    $.post("/invoice/"+invId,
        {
            cmd: 'remove'
        },
        function (res) {
            console.log("remove: Server returned",res);
            if (res.result == "ok") {
                console.log("invoice removed", res.invoice._id);
                cb(res);
            } else {
                console.log("Error removing invoice",res);
                cb(res,{message:"Nepodarilo sa vymazať faktúru."});
            }
        }
    )
        .fail(function (err) {
            console.log("Error removing invoice",err);
            cb(null, err);
        });
};

libInvoice.confirm = function(invId, cb){
    console.log('Confirming invoice '+invId);
    (typeof cb === 'function') || (cb = libCommon.noop);
    $.post("/invoice/"+invId,
        {
            cmd: 'confirm'
        },
        function (res) {
            console.log("confirm: Server returned",res);
            if (res.result == "ok") {
                console.log("invoice confirmed", res.invoice._id);
                cb(res);
            } else {
                console.log("Error confirming invoice",res);
                cb(res,{message:"Nepodarilo sa potvrdiť faktúru."});
            }
        }
    )
        .fail(function (err) {
            console.log("Error confirming invoice",err);
            cb(null, err);
        });
};


libInvoice.notifyOverdue = function(invId, cb){
    console.log('Notify Overdue '+invId);
    (typeof cb === 'function') || (cb = libCommon.noop);
    $.post("/invoice/"+invId,
        {
            cmd: 'notifyOverdue'
        },
        function (res) {
            console.log("notifyOverdue: Server returned",res);
            if (res.result == "ok") {
                console.log("notification sent");
                cb(res);
            } else {
                console.log("Error sending notification",res);
                cb(res,{message:"Nepodarilo poslať notifikáciu."});
            }
        }
    )
        .fail(function (err) {
            console.log("Error sending notification",err);
            cb(null, err);
        });
};

libInvoice.renumberItems = function(invId, cb){
    console.log('renumber items '+invId);
    (typeof cb === 'function') || (cb = libCommon.noop);
    $.post("/invoice/"+invId,
        {
            cmd: 'renumber'
        },
        function (res) {
            console.log("renumber: Server returned",res);
            if (res.result == "ok") {
                console.log("renumbering done");
                cb(res);
            } else {
                console.log("Error renumbering",res);
                cb(res,{message:"Nepodarilo prečíslovať riadky."});
            }
        }
    )
        .fail(function (err) {
            console.log("Error renumbering",err);
            cb(null, err);
        });
};

libInvoice.addItem = function(invId, cb, lineText, lineValue, lineNo, lineQty, lineUnit, lineNote ){
    console.log('Add item '+invId);
    (typeof cb === 'function') || (cb = libCommon.noop);
    (typeof lineNo === 'undefined') && (lineNo = 1);
    (typeof lineQty === 'undefined') && (lineQty = 1);
    (typeof lineUnit === 'undefined') && (lineUnit = '');
    (typeof lineNote === 'undefined') && (lineNote = '');
    $.post("/invoice/"+invId,
        {
            cmd: 'addItem',
            text: lineText,
            value: lineValue,
            unit: lineUnit,
            qty: lineQty,
            itemNo: lineNo,
            note: lineNote
        },
        function (res) {
            console.log("addItem: Server returned",res);
            if (res.result == "ok") {
                console.log("item added");
                cb(res);
            } else {
                console.log("Error adding item",res);
                cb(res,{message:"Nepodarilo pridať riadok."});
            }
        }
    )
        .fail(function (err) {
            console.log("Error sending notification",err);
            cb(null, err);
        });
};

libInvoice.removeItem = function(invId, cb, itmNo){
    console.log('Remove item '+invId);
    (typeof cb === 'function') || (cb = libCommon.noop);
    $.post("/invoice/"+invId,
        {
            cmd: 'removeItem',
            itemNo: itmNo
        },
        function (res) {
            console.log("removeItem: Server returned",res);
            if (res.result == "ok") {
                console.log("removed added");
                cb(res);
            } else {
                console.log("Error removing item",res);
                cb(res,{message:"Nepodarilo vymazať riadok."});
            }
        }
    )
        .fail(function (err) {
            console.log("Error sending notification",err);
            cb(null, err);
        });
};

libInvoice.initInvoiceButtons = function(cb){
    console.log("Init Invoice Buttons");
    (typeof cb === 'function') || (cb = libCommon.noop);
    $('.createTaxInvoice').on('click',
        function(evt) {
            var invId = evt.target.id.substr(3);
            console.log("click create tax invoice",invId);
            libInvoice.createTaxInvoice(
                invId,
                function (res, err) {
                    if (err)
                        alert("Nepodarilo sa vytvoriť faktúru");
                    else
                        cb(res);
                }
            );
        }
    );
    $('.markAsPaid').on('click',
        function(evt){
            var invId = evt.target.id.substr(3);
            if (confirm("Naozaj si želáte túto faktúru označiť ako zaplatenú?")) {
                console.log("click invoice paid", invId);
                libInvoice.markAsPaid(
                    invId,
                    function (res, err) {
                        if (err)
                            alert("Nepodarilo sa označiť faktúru ako zaplatenú");
                        else
                            cb(res);
                    }
                );
            }
        }
    );
};
