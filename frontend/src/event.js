'use strict';

var viewEvent = {};

viewEvent.init = function (evId, u) {
    viewEvent.user = JSON.parse(u);
    moment.locale(viewEvent.user.locales.substr(0, 2));
    console.log('locales=', viewEvent.user.locales);

    viewEvent.loadRegisteredTeams(evId);
    viewEvent.loadOrganizers(evId);
    var ioid = $('#invOrgId').val();
    viewEvent.loadInvoiceTemplates(evId, ioid);

    if (viewEvent.user.permissions.isAdmin || viewEvent.user.permissions.isEventOrganizer) {
        $('.editable').editable();
    }

    console.log($('#invoiceTemplate'));

    $('#invTmpl').editable({
        source: [
            { value: 1, text: 'a' },
            { value: 2, text: 'b' },
        ],
    });

    $('#exportData').on('click', function () {
        // get JSON data
        libEvent.exportData(evId, function (d) {
            // convert to CSV
            var data = libCommon.Prog2CSV(d.data, '\t');
            // save to file
            var encodedUri = encodeURI('data:text/csv;charset=utf-8,' + data);
            var link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', 'event_export_utf8.csv');
            document.body.appendChild(link);

            link.click();
        });
    });

    $('#btnSaveTeamNumber').on('click', function (ev) {
        var teamEventId = $('#teamEventId').val();
        var teamNum = $('#teamNumber').val();
        viewEvent.assignTeamNumber(teamEventId, teamNum, function (res, err) {
            if (err) {
                console.log('Error saving team number');
                alert('Nepodarilo sa priradiť tímu číslo.');
            } else {
                viewEvent.loadRegisteredTeams(evId);
                alert('Číslo bolo úspešne priradené.');
                $('#editTeamNumber').modal('hide');
            }
        });
    });

    $('#addOrganizer').on('click', function (ev) {
        libModals.selectUserDialog(
            'Pridaj organizátora',
            function (browserEvent, username, onSuccess, onError) {
                if (typeof onSuccess !== 'function')
                    onSuccess = function (u) {
                        return true;
                    };
                if (typeof onError !== 'function')
                    onError = function (msg) {
                        console.log('ERROR: ', msg);
                    };

                libEvent.addOrganizer(evId, username, function (res, err) {
                    if (err) return onError(err.message);
                    onSuccess(res);
                });
            },
            function (res) {
                console.log('event organizer added');
                viewEvent.loadOrganizers(evId);
            },
            function (msg) {
                alert('Chyba pri pridávaní organizátora.\n\n' + msg);
            }
        );
    });

    $('#setDate').on('click', function (ev) {
        libModals.editValue(
            'Nastav dátum',
            'Dátum',
            '',
            'date',
            new Date(),
            function (browserEvent, newDate, onSuccess, onError) {
                if (typeof onSuccess !== 'function')
                    onSuccess = function (u) {
                        return true;
                    };
                if (typeof onError !== 'function')
                    onError = function (msg) {
                        console.log('ERROR: ', msg);
                    };

                libEvent.setDate(evId, newDate, function (res, err) {
                    if (err) return onError(err.message);
                    onSuccess(res);
                });
            },
            function (res) {
                console.log('new date set');
                location.reload(true);
            },
            function (msg) {
                alert('Chyba pri zapisovaní dátumu.\n\n' + msg);
            }
        );
    });
};

viewEvent.loadRegisteredTeams = function (eventId) {
    var sel = $('#allTeams');
    console.log('Loading registered teams');
    $.get(libCommon.getNoCache('/event/' + eventId + '?cmd=getTeams'), function (res) {
        console.log('loadTeams: Server returned', res);
        if (res.result === 'ok') {
            // sort results
            res.list.sort(function (a, b) {
                return a.name > b.name ? 1 : b.name > a.name ? -1 : 0;
            });

            sel.empty();

            let perms = viewEvent.user.permissions;
            if (res.list.length > 0) {
                console.log('Found ', res.list.length, 'records');
                res.list.forEach(function (item) {
                    let c = $('<div class="well well-sm container-fluid">')
                        .append(
                            $('<a href="/team/' + item._id + '" >').append(
                                item.name +
                                    (item.teamEvent.teamNumber
                                        ? '  [#' + item.teamEvent.teamNumber + ']'
                                        : '') +
                                    ', ' +
                                    (item.billingAdr ? item.billingAdr.city : 'xxx') +
                                    ', ' +
                                    (item.billingOrg ? item.billingOrg.name : 'xxx')
                            )
                        )
                        .append(
                            perms.isAdmin || perms.isProgramManager
                                ? $(
                                      '<button id="ETN' +
                                          item.teamEvent._id +
                                          '" class="btn btn-default btnEditTeamNumber" style="float:right">'
                                  ).append('Číslo tímu')
                                : ''
                        )
                        .append(
                            perms.isAdmin || perms.isProgramManager
                                ? $(
                                      '<button id="DRT' +
                                          item._id +
                                          '" class="btn btn-default btnDeregisterTeam" style="float:right">'
                                  ).append('Odhlás')
                                : ''
                        )
                        .append(
                            perms.isAdmin || perms.isInvoicingOrgManager
                                ? $(
                                      '<button id="CNI' +
                                          item._id +
                                          '" class="btn btn-default btnCreateNTInvoice" style="float:right">'
                                  ).append('Vytvor proformu')
                                : ''
                        )
                        .append(
                            perms.isAdmin || perms.isInvoicingOrgManager
                                ? $(
                                      '<button id="CTI' +
                                          item._id +
                                          '" class="btn btn-default btnCreateTaxInvoice" style="float:right">'
                                  ).append('Vytvor faktúru')
                                : ''
                        );

                    sel.append(c);
                });

                $('.btnCreateNTInvoice').on('click', function (event) {
                    libInvoice.create(this.id.substr(3), eventId, 'P', function (res, err) {
                        if (err) alert('Chyba pri vytváraní zálohovej faktúry.', err);
                        else alert('Zálohová Faktúra bola vytvorená. Nájdete ju na stránke tímu.');
                    });
                });

                $('.btnCreateTaxInvoice').on('click', function (event) {
                    libInvoice.create(this.id.substr(3), eventId, 'I', function (res, err) {
                        if (err) alert('Chyba pri vytváraní daňovej faktúry.', err);
                        else alert('Daňová faktúra bola vytvorená. Nájdete ju na stránke tímu.');
                    });
                });

                $('.btnDeregisterTeam').on('click', function (event) {
                    libEvent.deregisterTeam(eventId, viewEvent.user, this.id.substr(3), function (
                        res,
                        err
                    ) {
                        if (err) alert('Chyba odhlasovaní tímu.', err);
                        else {
                            alert('Tím bol odhlásený.');
                            location.reload(true);
                        }
                    });
                });

                $('.btnEditTeamNumber').on('click', function (evt) {
                    let teId = evt.target.id.substr(3);
                    $('#teamEventId').val(teId);
                    $('#teamNumber').val('');
                    $('#editTeamNumber').modal();
                });
            } else {
                sel.text('Žiadne');
            }
        } else {
            console.log('loadTeams: Server returned ERROR');
        }
    });
};

viewEvent.assignTeamNumber = function (teamEventId, teamNum, cb) {
    console.log('Assigning number #' + teamNum + ' to teamEvent=' + teamEventId);
    $.post(
        '/teamevent/' + teamEventId,
        {
            cmd: 'assignNumber',
            teamNumber: teamNum,
        },
        function (res) {
            console.log('assignNumber: Server returned', res);
            if (res.result == 'ok') {
                console.log('team number assigned', res.teamEvent.teamNumber);
                cb(res);
            } else {
                console.log('Error assigning number to team', res);
                cb(res, res.error);
            }
        }
    ).fail(function (err) {
        console.log('Error assigning number to a team', err);
        cb(null, err);
    });
};

viewEvent.loadOrganizers = function (resId) {
    var site =
        location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '');
    console.log('Loading event organizers');
    var t = $('#eorgsList');
    t.empty();
    $.get(libCommon.getNoCache('/event/' + resId + '?cmd=getOrganizers'), function (res) {
        console.log('Server returned organizers', res);
        if (res.result === 'ok') {
            console.log('List of', res.list.length, 'records');
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
                t.text('Žiadni organizátori');
            }
        } else {
            console.log('Server returned ERROR');
        }
    });
};

viewEvent.loadInvoiceTemplates = function (eventId, ioId) {
    var site =
        location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '');
    console.log('Loading event invoice templates');

    $.get(libCommon.getNoCache('/invoice?cmd=getList&type=T&invOrg=' + ioId), function (res) {
        console.log('Server returned templates', res);
        if (res.result === 'ok') {
            console.log('List of', res.list.length, 'records');
            if (res.list.length > 0) {
                console.log('Found ', res.list.length, 'records');
                var l = res.list.map(function (x) {
                    return { value: x._id, text: x.number };
                });
                console.log('List', l);
                $('#invoiceTemplate').editable({
                    source: l,
                    prepend: '',
                });
            } else {
                t.text('Žiadne šablóny');
            }
        } else {
            console.log('Server returned ERROR');
        }
    });
};
