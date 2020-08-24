'use strict';

var signupView = {};

signupView.init = function () {
    console.log('/signup - Initializing');

    $('#frmSignup').on('submit', signupView.validateSignupForm);

    console.log('/signup - Initializing completed');
};

signupView.validateSignupForm = function () {
    console.log('Validating form');
    const lname = $('#userName').val().trim();

    if (!signupView.validateLogin(lname)) {
        $('#userNameGrp').addClass('has-error');
        alert('Prihlasovacie meno sa už používa.');
        return false;
    }

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

signupView.validateLogin = function (loginName) {
    $.get(libCommon.getNoCache('/signup?email=' + loginName))
        .done(function (res) {
            console.log('validateLogin: Server returned', res);
            if (res.result == 'ok') {
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
