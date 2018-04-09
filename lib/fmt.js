"use strict";

const exp = module.exports = {};

exp.fmtDate = function (dt, loc) {
    if (!loc) loc = "en-US";
    let d = "";
    switch (loc.substr(3)){
        case 'SK':
        case 'DE':
            d = dt.getDate()+'.'+(dt.getMonth() + 1)+'.'+dt.getFullYear();
            break;
        case 'GB':
            d = dt.getDate()+'/'+(dt.getMonth() + 1)+'/'+dt.getFullYear();
            break;
        default:
            d = (dt.getMonth() + 1)+'/'+dt.getDate()+'/'+dt.getFullYear();
    }
    return d;

};

exp.fmtDateFormat = function (loc) {
    if (!loc) loc = "en-US";
    let d = "";
    switch (loc.substr(3)){
        case 'SK':
        case 'DE':
            d = 'dd.mm.yyyy';
            break;
        case 'GB':
            d = 'dd/mm/yyyy';
            break;
        default:
            d = 'mm/dd/yyyy';
    }
    return d;

};
