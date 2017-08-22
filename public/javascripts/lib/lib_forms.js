"use strict";

const libForms = {};

libForms.validate = function(fields,cb){
    let ret;
    let err = [];
    for (let f of fields){
        if (f.required && !f.value)
            err.push({field:f.id, message:"required"});
    }

    if (err.length > 0)
        ret = {message:"Polia obsahujú nesprávny údaj alebo neobsahujú povinný údaj.", errors:err};

    if (typeof cb === "function")
        cb(fields,ret);

};
