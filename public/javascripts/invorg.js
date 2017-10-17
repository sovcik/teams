"use strict";

var viewInvOrg = {};

viewInvOrg.filterPaidStatus = 'A';
viewInvOrg.filterInvType = 'A';

viewInvOrg.init = function(){
    console.log("Initializing Invoicing Org");
    var invOrgId = getResourceId(location.href);
    $("#filterPaidStatus").val(viewInvOrg.filterPaidStatus);
    $("#filterInvType").val(viewInvOrg.filterInvType);
    viewInvOrg.loadInvoices(invOrgId);

    $("#filterPaidStatus").on('change',function(ev){
        viewInvOrg.filterPaidStatus = ev.target.value;
        console.log(viewInvOrg.filterPaidStatus);
        viewInvOrg.loadInvoices(invOrgId);
    });

    $("#filterInvType").on('change',function(ev){
        viewInvOrg.filterInvType = ev.target.value;
        console.log(viewInvOrg.filterInvType);
        viewInvOrg.loadInvoices(invOrgId);
    });
};

viewInvOrg.loadInvoices = function(invOrgId){
    var site = location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: '');
    console.log("Loading invoices");
    var t = $("#allInvoices");
    var ti = $("#allInvoices>*");  // all children of specified element
    var q = "&invOrg="+invOrgId;

    if (viewInvOrg.filterPaidStatus != "A")
        q += "&isPaid="+viewInvOrg.filterPaidStatus;

    if (viewInvOrg.filterInvType != "A")
        q += "&type="+viewInvOrg.filterInvType;

    $.get( libCommon.getNoCache("/invoice?cmd=getList"+q), function(res) {
        console.log("Server returned invoices",res);
        if (res.result === 'ok'){
            console.log("List of",res.list.length,"records");
            ti.remove();
            if (res.list.length > 0) {
                console.log("Found ",res.list.length,"records");
                var c =
                    $('<tr>')
                        .append($('<th>').append("#"))
                        .append($('<th>').append("Organizácia"))
                        .append($('<th>').append("Suma"))
                        .append($('<th>').append("Vystavená"))
                        .append($('<th>').append("Splatná"))
                        .append($('<th>').append("Zaplatená"));
                t.append(c);

                res.list.forEach(function(item) {
                    c =
                        $('<tr>')
                            .append($('<td>').append($('<a href="/invoice/'+item._id+'">').append(item.number)))
                            .append($('<td>').append(item.billOrg.name+", "+item.billAdr.city+" ").append($('<a href="/team/'+item.team+'">').append("[tím]")))
                            .append($('<td>').append(item.total.toFixed(2)))
                            .append($('<td>').append((new Date(item.issuedOn)).toLocaleDateString(res.user.locales)))
                            .append($('<td>').append((new Date(item.dueOn)).toLocaleDateString(res.user.locales)));

                        if (item.paidOn)
                            c.append($('<td>').append((new Date(item.paidOn)).toLocaleDateString(res.user.locales)));
                        else
                            if ((res.user.isInvoicingOrgManager || res.user.isAdmin) && !item.isDraft)
                                c.append($('<td>').append($('<button id="PAY'+item._id+'" class="btn btn-default markAsPaid">').append("Zaplať")));
                            else
                                c.append('');

                        t.append(c);
                });
                $("#allInvoices>tr:odd").addClass("bg-info");
                libInvoice.initInvoiceButtons(
                    function(){
                        viewInvOrg.loadInvoices(invOrgId);
                    });

            } else {
                t.text('Žiadne faktúry');
            }
        } else {
            console.log("Server returned ERROR");
        }

    });

};