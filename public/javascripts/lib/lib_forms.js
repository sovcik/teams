"use strict";

var libForms = {};

libForms.validate = function(fields,cb){
    var ret;
    var err = [];
    for (var i = 0; i < fields.length; i++){
        if (fields[i].required && !fields[i].value)
            err.push({field:fields[i].id, message:"required"});
    }

    if (err.length > 0)
        ret = {message:"Polia obsahujú nesprávny údaj alebo neobsahujú povinný údaj.", errors:err};

    if (typeof cb === "function")
        cb(fields,ret);

};
