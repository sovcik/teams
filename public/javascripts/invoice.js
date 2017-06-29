function initInvoiceButtons(onSucc, onErr){
    $('.createTaxInvoice').on('click',function(evt){createTaxInvoice(evt, onSucc, onErr);});
    $('.markAsPaid').on('click',function(evt){markInvoiceAsPaid(evt, onSucc, onErr);});
}

function createTaxInvoice(evt, onSucc, onErr){
    let invId = evt.target.id.substr(3);
    console.log('Creating tax invoice for '+invId);
    $.post("/invoice/"+invId,
        {
            cmd: 'copyToNew',
            type: 'I'
        },
        function (res) {
            console.log("createTaxInvoice: Server returned",res);
            if (res.result == "ok") {
                console.log("tax invoice created", res.invoice.id);
                onSucc(res);
            } else {
                console.log("Error while creating invoice",res);
                if (onErr)
                    onErr(res);
                else
                    alert("Nepodarilo sa vytvoriť faktúru");
            }
        }
    )
        .fail(function (err) {
            console.log("Invoice creation failed",err);
            if (onErr)
                onErr(err);
            else
                alert("Nepodarilo sa vytvoriť faktúru");
        });

}

function markInvoiceAsPaid(evt, onSucc, onErr){
    let invId = evt.target.id.substr(3);
    console.log('Marking invoice as paid '+invId);
    $.post("/invoice/"+invId,
        {
            cmd: 'markAsPaid'
        },
        function (res) {
            console.log("markAsPaid: Server returned",res);
            if (res.result == "ok") {
                console.log("invoice marked as paid", res.invoice.id);
                onSucc(res);
            } else {
                console.log("Error marking invoice as paid",res);
                if (onErr)
                    onErr(res);
                else
                    alert("Nepodarilo sa označiť faktúru ako zaplatenú");
            }
        }
    )
        .fail(function (err) {
            console.log("Error marking invoice as paid",err);
            if (onErr)
                onErr(err);
            else
                alert("Nepodarilo sa označiť faktúru ako zaplatenú");
        });
}

function createInvoice(teamId, eventId, invType, cb){

    console.log("Creating invoice for team",teamId);
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

}