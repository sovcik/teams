'use strict';

function initSignup(){
    console.log("/signup - Initializing");

    $('#frmSignup').on("submit",validateSignupForm);

    console.log("/signup - Initializing completed");
}

function validateSignupForm(){
    console.log("Validating form");
    if ($('#userName').val().trim().length < 5) {
        $('#userNameGrp').addClass("has-error");
        alert("Prihlasovacie meno musí mať aspoň 5 znakov.");
        return false;
    } else
        $('#userNameGrp').removeClass("has-error");

    if ($('#fullName').val().trim().length == 0) {
        $('#fullNameGrp').addClass("has-error");
        alert("Meno a priezvisko nesmie byť prázdne.");
        return false;
    } else
        $('#fullNameGrp').removeClass("has-error");

    if (!validatePassword($('#password').val())) {
        $('#passwordGrp').addClass("has-error");
        alert("Heslo musí obsahovať aspoň jedno číslo, malé písmeno a musí mať aspoň 6 znakov.");
        return false;
    } else
        $('#fullNameGrp').removeClass("has-error");


    console.log("Form OK");
    return true; // return false to cancel form action
}

