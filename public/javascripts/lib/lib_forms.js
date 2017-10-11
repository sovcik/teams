"use strict";

var libForms = {};

libForms.validate = function(fields,cb){
    var ret;
    var errors = [];
    for (var i = 0; i < fields.length; i++){
        if (fields[i].required && !fields[i].value)
            errors.push({field:fields[i].id, message:"required"});
        if (fields[i].type == 'date'){
            try {
                fields[i].dateValue = new Date(libCommon.convertLocaleDate2SysDate(fields[i].value, fields[i].locales));
            } catch (err) {
                errors.push({field:fields[i].id, message:"nesprávny formát dátumu"});
            }
        }

    }

    if (errors.length > 0)
        ret = {message:"Polia obsahujú nesprávny údaj alebo neobsahujú povinný údaj.", errors:errors};

    if (typeof cb === "function")
        cb(fields,ret);

};
