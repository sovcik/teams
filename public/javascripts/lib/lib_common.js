"use strict";

var libCommon = {};

libCommon.noop = function(){};  // to be used for undefined callbacks

libCommon.objPathGet = function(obj, path){
    if (typeof path === "string")
        return libCommon.objPathGet(obj, path.split('.'));
    var ret = obj;
    for (var i = 0; i<path.length; i++){
        ret = ret[path[i]];
    }
    return ret;
};

libCommon.getNoCache = function(url){
    var d = new Date();
    return url+"&ts="+d.toISOString();
};

libCommon.convertLocaleDate2SysDate = function(d,locale){
    var a = d.split(/[ :\-\/\.]/g);
    var s = "";
    switch (locale.substr(3,2)){
        case 'US':
            s = a[2]+"-"+a[0]+"-"+a[1];
            break;
        case 'SK':
        case 'DE':
        case 'GB':
            s = a[2]+"-"+a[1]+"-"+a[0];
            break;
        default:
            s = "unknown locale";

    }

    return s;

};
