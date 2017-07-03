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

};/**
 * Created by Jozef on 03.07.2017.
 */
