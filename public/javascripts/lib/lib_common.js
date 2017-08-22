"use strict";

const libCommon = {};

libCommon.noop = function(){};  // to be used for undefined callbacks

libCommon.objPathGet = function(obj, path){
    if (typeof path === "string")
        return libCommon.objPathGet(obj, path.split('.'));
    let ret = obj;
    for (let i = 0; i<path.length; i++){
        ret = ret[path[i]];
    }
    return ret;
};
