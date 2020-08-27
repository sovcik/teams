'use strict';

var viewInvOrg = {};

viewInvOrg.filterPaidStatus = 'A';
viewInvOrg.filterInvType = 'A';
viewInvOrg.filterInvYear = new Date().getFullYear().toString();

viewInvOrg.init = function (invOrgId, u) {
    console.log('Initializing Invoicing Org');
    viewInvOrg.user = JSON.parse(u);
    moment.locale(viewInvOrg.user.locales.substr(0, 2));

    $('#dueOption').editable({
        source: [
            { value: 1, text: 'Dni splatnosti' },
            { value: 2, text: 'Dátum splatnosti' },
            { value: 3, text: 'min(dni,dátum)' },
        ],
    });

    $('.editable').editable();

    //var invOrgId = getResourceId(location.href);
    $('#filterPaidStatus').val(viewInvOrg.filterPaidStatus);
    $('#filterInvType').val(viewInvOrg.filterInvType);
    $('#filterInvYear').val(viewInvOrg.filterInvYear);

    viewInvOrg.loadManagers(invOrgId);
    viewInvOrg.loadInvoices(invOrgId);
    viewInvOrg.loadTemplates(invOrgId);

    $('#filterPaidStatus').on('change', function (ev) {
        viewInvOrg.filterPaidStatus = ev.target.value;
        console.log(viewInvOrg.filterPaidStatus);
        viewInvOrg.loadInvoices(invOrgId);
    });

    $('#filterInvType').on('change', function (ev) {
        viewInvOrg.filterInvType = ev.target.value;
        console.log(viewInvOrg.filterInvType);
        viewInvOrg.loadInvoices(invOrgId);
    });

    $('#filterInvYear').on('change', function (ev) {
        viewInvOrg.filterInvYear = ev.target.value;
        console.log(viewInvOrg.filterInvYear);
        viewInvOrg.loadInvoices(invOrgId);
    });

    $('#addInvTemplate').on('click', function (ev) {
        libModals.editValue(
            'Vytvor šablónu faktúry',
            'Názov šablóny',
            'názov šablóny',
            'text',
            '',
            function (browserEvent, tname, onSuccess, onError) {
                if (typeof onSuccess !== 'function')
                    onSuccess = function (u) {
                        return true;
                    };
                if (typeof onError !== 'function')
                    onError = function (msg) {
                        console.log('ERROR: ', msg);
                    };

                libInvOrg.createInvTemplate(invOrgId, tname, function (res, err) {
                    if (err) return onError(err.message);
                    onSuccess(res);
                });
            },
            function (res) {
                console.log('new invoice template created');
                viewInvOrg.loadTemplates(invOrgId);
            },
            function (msg) {
                alert('Chyba pri vytváraní šablóny faktúry.\n\n' + msg);
            }
        );
    });

    $('#addManager').on('click', function (ev) {
        libModals.editValue(
            'Pridaj manažéra',
            'Používateľ',
            'prihlasovacie meno používateľa',
            'text',
            '',
            function (browserEvent, username, onSuccess, onError) {
                if (typeof onSuccess !== 'function')
                    onSuccess = function (u) {
                        return true;
                    };
                if (typeof onError !== 'function')
                    onError = function (msg) {
                        console.log('ERROR: ', msg);
                    };

                libInvOrg.createInvTemplate(invOrgId, username, function (res, err) {
                    if (err) return onError(err.message);
                    onSuccess(res);
                });
            },
            function (res) {
                console.log('new invorg manager added');
                viewInvOrg.loadManagers(invOrgId);
            },
            function (msg) {
                alert('Chyba pri pridávaní manažéra organizácie.\n\n' + msg);
            }
        );
    });
};

viewInvOrg.loadInvoices = function (invOrgId) {
    var site =
        location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '');
    console.log('Loading invoices');
    var t = $('#allInvoices');
    var ti = $('#allInvoices>*'); // all children of specified element
    var q = '&invOrg=' + invOrgId;

    if (viewInvOrg.filterPaidStatus != 'A') q += '&isPaid=' + viewInvOrg.filterPaidStatus;

    if (viewInvOrg.filterInvType != 'A') q += '&type=' + viewInvOrg.filterInvType;

    q += '&year=' + viewInvOrg.filterInvYear;

    $.get(libCommon.getNoCache('/invoice?cmd=getList' + q), function (res) {
        console.log('Server returned invoices', res);
        if (res.result === 'ok') {
            console.log('List of', res.list.length, 'records');
            ti.remove();
            if (res.list.length > 0) {
                console.log('Found ', res.list.length, 'records');
                var c = $('<tr>')
                    .append($('<th>').append('#'))
                    .append($('<th>').append('Organizácia'))
                    .append($('<th>').append('Suma'))
                    .append($('<th>').append('Vystavená'))
                    .append($('<th>').append('Splatná'))
                    .append($('<th>').append('Zaplatená'));
                t.append(c);

                res.list.forEach(function (item) {
                    c = $('<tr>')
                        .append(
                            $('<td>').append(
                                $('<a href="/invoice/' + item._id + '" target="_blank">').append(
                                    item.number
                                )
                            )
                        )
                        .append(
                            $('<td>')
                                .append(item.billOrg.name + ', ' + item.billAdr.city + ' ')
                                .append($('<a href="/team/' + item.team + '">').append('[tím]'))
                        )
                        .append($('<td>').append(item.total.toFixed(2)))
                        .append(
                            $('<td>').append(
                                new Date(item.issuedOn).toLocaleDateString(res.user.locales)
                            )
                        )
                        .append(
                            $('<td>').append(
                                new Date(item.dueOn).toLocaleDateString(res.user.locales)
                            )
                        );

                    if (item.paidOn)
                        c.append(
                            $('<td>').append(
                                new Date(item.paidOn).toLocaleDateString(res.user.locales)
                            )
                        );
                    else if ((res.user.isInvoicingOrgManager || res.user.isAdmin) && !item.isDraft)
                        c.append(
                            $('<td>').append(
                                $(
                                    '<button id="PAY' +
                                        item._id +
                                        '" class="btn btn-default markAsPaid">'
                                ).append('Zaplať')
                            )
                        );
                    else c.append('');

                    t.append(c);
                });
                $('#allInvoices>tr:odd').addClass('bg-info');
                libInvoice.initInvoiceButtons(function () {
                    viewInvOrg.loadInvoices(invOrgId);
                });
            } else {
                t.text('Žiadne faktúry');
            }
        } else {
            console.log('Server returned ERROR');
        }
    });
};

viewInvOrg.loadTemplates = function (invOrgId) {
    var site =
        location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '');
    console.log('Loading invoice templates');
    var t = $('#InvTemplates');
    var ti = $('#InvTemplates>*'); // all children of specified element
    var q = '&invOrg=' + invOrgId + '&type=T';

    $.get(libCommon.getNoCache('/invoice?cmd=getList' + q), function (res) {
        console.log('Server returned templates', res);
        if (res.result === 'ok') {
            console.log('List of', res.list.length, 'records');
            ti.remove();
            if (res.list.length > 0) {
                console.log('Found ', res.list.length, 'records');

                res.list.forEach(function (item) {
                    var c = $('<div>').append(
                        $(
                            '<span id="rem+' + item._id + '" class="glyphicon glyphicon-remove"/>'
                        ).on('click', function (ev) {
                            console.log('Removing template', item._id);
                            libInvoice.remove(item._id, function () {
                                viewInvOrg.loadTemplates(invOrgId);
                            });
                        }),
                        $('<a href="/invoice/' + item._id + '">').append('  ' + item.number)
                    );
                    t.append(c);
                });
            } else {
                t.text('Žiadne šablóny');
            }
        } else {
            console.log('Server returned ERROR');
        }
    });
};

viewInvOrg.loadManagers = function (iorgId) {
    var site =
        location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '');
    console.log('Loading invorg managers');
    var t = $('#iomsList');
    t.empty();
    $.get('/invorg/' + iorgId + '?cmd=getManagers', function (res) {
        console.log('Server returned managers', res);
        if (res.result === 'ok') {
            t.empty();
            if (res.list.length > 0) {
                console.log('Found ', res.list.length, 'records');
                res.list.forEach(function (item) {
                    if (item.fullName) {
                        var c = $(
                            '<a href="' +
                                site +
                                '/profile/' +
                                item._id +
                                '" class="btn btn-success btn-member" role="button">'
                        ).append(item.fullName);

                        t.append(c);
                    }
                });
            } else {
                t.text('Žiadni manažéri');
            }
        } else {
            console.log('Server returned ERROR');
        }
    });
};
