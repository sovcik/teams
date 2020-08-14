'use strict';

var viewAdmin = {};

viewAdmin.init = function () {
    console.log('/admin - Initializing');
    $('#newProgramBtn').on('click', viewAdmin.createNewProgram);
    $('#newEventBtn').on('click', viewAdmin.createNewEvent);

    $('#newInvOrgBtn').on('click', function (event) {
        var ioName = $('#newOrgName').val();
        viewAdmin.createIO(ioName);
    });

    viewAdmin.loadPrograms();
    viewAdmin.loadInvoicingOrgs();
    viewAdmin.loadUsers();
    viewAdmin.loadTeams($('#activeTeams'), true);
    viewAdmin.loadTeams($('#inactiveTeams'), false);

    console.log('/admin - Initializing completed');
};

viewAdmin.createNewProgram = function () {
    var selProgName = $('#newProgramName');
    var selStatus = $('#teamCreateStatus');
    if (selProgName.val().trim() != '') {
        console.log('Posting request to create new program');
        $.post('/program', { cmd: 'createProgram', name: selProgName.val() }, function (res) {
            console.log('createProgram: Server returned', res);
            if (res.result == 'ok') {
                console.log('Program created');
                viewAdmin.loadPrograms();
                selProgName.val('');
            } else {
                console.log('Error while creating program');
            }
        }).fail(function () {
            selStatus.text('Nepodarilo sa vytvoriť program.');
            console.log('Creation failed');
        });
    } else {
        selStatus.text('Program musí mať meno.');
        selStatus.css('display', 'inline').fadeOut(2000);
    }
};

viewAdmin.loadPrograms = function () {
    var selProg = $('#allPrograms');
    console.log('Loading programs');
    $.get(libCommon.getNoCache('/program?cmd=getList'), function (res) {
        console.log('loadProgs: Server returned', res);
        if (res.result === 'ok') {
            // sort results by program name
            res.list.sort(function (a, b) {
                return a.name > b.name ? 1 : b.name > a.name ? -1 : 0;
            });
            // clear page elements containing programs
            selProg.empty();
            if (res.list.length > 0) {
                console.log('Found ', res.list.length, 'records');
                res.list.forEach(function (item) {
                    var c = $(
                        '<a href="/program/' + item._id + '" class="list-group-item" >'
                    ).append(item.name);
                    //var c = $('<li class="list-group-item" value="'+item._id+'"">').append(item.name);
                    selProg.append(c);
                });
            } else {
                t.text('Žiadne programy');
            }
        } else {
            console.log('loadProgs: Server returned ERROR');
        }
    });
};

viewAdmin.loadInvoicingOrgs = function () {
    var selIO = $('#allInvoicingOrgs');
    console.log('Loading invoicing orgs');
    $.get(libCommon.getNoCache('/invorg?cmd=getList'), function (res) {
        console.log('loadInvOrgs: Server returned', res);
        if (res.result === 'ok') {
            // sort results by program name
            res.list.sort(function (a, b) {
                return a.org.name > b.org.name ? 1 : b.org.name > a.org.name ? -1 : 0;
            });
            // clear page elements containing programs
            selIO.empty();
            if (res.list.length > 0) {
                console.log('Found ', res.list.length, 'records');
                res.list.forEach(function (item) {
                    var c = $(
                        '<a href="/invorg/' + item._id + '" class="list-group-item" >'
                    ).append(item.org.name + ', ' + item.adr.city);
                    selIO.append(c);
                });
            } else {
                selIO.text('Žiadne');
            }
        } else {
            console.log('loadInvOrgs: Server returned ERROR');
        }
    });
};

viewAdmin.createIO = function (ioName) {
    var succ = false;
    console.log('Creating new invoicing org', ioName);
    if (!ioName) {
        console.log('IOName not specified');
        return;
    }

    $.ajax({
        type: 'POST',
        url: '/invorg',
        dataType: 'json',
        data: {
            cmd: 'create',
            name: ioName,
        },
    })
        .done(function (res) {
            console.log('createIO: Server returned', res);
            if (res.result == 'ok') {
                viewAdmin.loadInvoicingOrgs();
            } else {
                console.log('Error creating org');
            }
        })
        .fail(function (err) {
            console.log('Creating org failed', err);
        });

    return succ;
};

viewAdmin.loadUsers = function () {
    var sel = $('#allUsers');
    console.log('Loading users');
    $.get(libCommon.getNoCache('/profile?cmd=getList'), function (res) {
        console.log('loadUsers: Server returned', res);
        if (res.result === 'ok') {
            // sort results by username
            res.list.sort(function (a, b) {
                return a.fullName > b.fullName ? 1 : b.fullName > a.fullName ? -1 : 0;
            });
            // clear page elements containing programs
            sel.empty();

            if (res.list.length > 0) {
                console.log('Found ', res.list.length, 'records');

                res.list.forEach(function (item) {
                    if (item.passwordHash.length > 0) {
                        var c = $(
                            '<a class="list-group-item" href="/profile/' + item._id + '"">'
                        ).append(item.fullName + ', [' + item.username + '], ' + item.email);

                        sel.append(c);
                    }
                });
            } else {
                sel.text('Žiadne');
            }
        } else {
            console.log('loadUsers: Server returned ERROR');
        }
    });
};

viewAdmin.loadTeams = function (dstElm, active) {
    console.log('Loading teams');
    $.get(libCommon.getNoCache('/team?cmd=getList&active=' + (active ? 'yes' : 'no')), function (
        res
    ) {
        console.log('loadTeams: Server returned', res);
        if (res.result === 'ok') {
            // sort teams by name
            res.list.sort(function (a, b) {
                return a.name > b.name ? 1 : b.name > a.name ? -1 : 0;
            });
            dstElm.empty();
            if (res.list.length > 0) {
                console.log('Found ', res.list.length, 'records');
                res.list.forEach(function (item) {
                    var c = $('<a class="list-group-item" href="/team/' + item._id + '"">').append(
                        item.name + ', ' + item.foundingOrg.name + ', ' + item.foundingAdr.city
                    );
                    dstElm.append(c);
                });
            } else {
                dstElm.text('Žiadne tímy');
            }
        } else {
            console.log('loadTeams: Server returned ERROR');
        }
    });
};
