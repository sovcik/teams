"use strict";

function urlGetParam(param) {
    var vars = {};
    window.location.href.replace( location.hash, '' ).replace(
        /[?&]+([^=&]+)=?([^&]*)?/gi, // regexp
        function( m, key, value ) { // callback
            vars[key] = value !== undefined ? value : '';
        }
    );

    if ( param ) {
        return vars[param] ? vars[param] : null;
    }
    return vars;
}

function date2ISOString(datetime){
    return datetime.getFullYear()+'-'+datetime.getMonth()+'-'+datetime.getDate();
}

function validateEmail(email){
    console.log("Validating email");
    var re = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
    return re.test(email);
}

function validatePassword(pwd){
    // at has to contain number and small letter and has to be at least 6 chars long
    console.log("Validating password");
    var re = /(?=.*[0-9])(?=.*[a-z]).{6,}/;
    return re.test(pwd);
}

function getResourceId(url){
    // strip query (if provided)
    if (url.indexOf('?') > 0)
        url = url.substr(0,url.indexOf('?'));
    // if pathname last char is /, then remove it
    if (url[url.lenght-1] == '/')
        url = url.substr(0,url.length-1);
    return url.substr(url.lastIndexOf('/') + 1);
}