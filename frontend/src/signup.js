'use strict';

var viewSignup = {};

viewSignup.init = function () {
    console.log('/signup - Initializing');

    $('#frmSignup').on('submit', viewSignup.validateSignupForm);

    console.log('/signup - Initializing completed');
};

viewSignup.validateSignupForm = function () {
    console.log('Validating form');
    const lname = $('#userName').val().trim();

    /*    
    // this won't work - it requires async/await call
    var userValid = viewSignup.validateLogin(lname);
    console.log('user valid = ', lname, userValid);

    if (!userValid) {
        $('#userNameGrp').addClass('has-error');
        alert("Prihlasovacie meno '" + lname + "' sa už používa.");
        return false;
    }
*/

    if (lname.length < 5) {
        $('#userNameGrp').addClass('has-error');
        alert('Prihlasovacie meno musí mať aspoň 5 znakov.');
        return false;
    } else $('#userNameGrp').removeClass('has-error');

    if ($('#fullName').val().trim().length == 0) {
        $('#fullNameGrp').addClass('has-error');
        alert('Meno a priezvisko nesmie byť prázdne.');
        return false;
    } else $('#fullNameGrp').removeClass('has-error');

    if (!validatePassword($('#password').val())) {
        $('#passwordGrp').addClass('has-error');
        alert('Heslo musí obsahovať aspoň jedno číslo, malé písmeno a musí mať aspoň 6 znakov.');
        return false;
    } else $('#fullNameGrp').removeClass('has-error');

    console.log('Form OK');
    return true; // return false to cancel form action
};

viewSignup.validateLogin = function (loginName) {
    $.get(libCommon.getNoCache('/signup?email=' + loginName))
        .done(function (res) {
            console.log('validateLogin: Server returned', res);
            if (res.result == 'ok') {
                console.log('User valid = ', res.found != 1);
                return res.found != 1;
            } else {
                console.log('Error checking login name');
            }
        })
        .fail(function (err) {
            console.log('Loginname check failed', err);
        });
    return false;
};
