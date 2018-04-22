"use strict";

const exp = module.exports = {};

exp.defaultLocales = 'sk-SK';

exp.fmtDate = function (dt, loc) {
    if (!loc) loc = exp.defaultLocales;
    let d = "";
    switch (loc.substr(3)){
        case 'GB':
            d = dt.getDate()+'/'+(dt.getMonth() + 1)+'/'+dt.getFullYear();
            break;
        case 'US':
            d = (dt.getMonth() + 1)+'/'+dt.getDate()+'/'+dt.getFullYear();
            break;
        case 'SK':
        case 'DE':
        default:
            d = dt.getDate()+'.'+(dt.getMonth() + 1)+'.'+dt.getFullYear();
            break;

    }
    return d;

};

exp.fmtDateFormat = function (loc) {
    if (!loc) loc = exp.defaultLocales;
    let d = "";
    switch (loc.substr(3)){
        case 'GB':
            d = 'dd/mm/yyyy';
            break;
        case 'US':
            d = 'mm/dd/yyyy';
            break;
        case 'SK':
        case 'DE':
        default:
            d = 'dd.mm.yyyy';
            break;

    }
    return d;

};
