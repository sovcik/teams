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
    return url+"&ts="+Date.UTC();
};
