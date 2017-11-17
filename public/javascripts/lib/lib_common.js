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
    if (!d)
        d = "x/x/x";
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

libCommon.convertSys2LocaleDate = function(d,locale){
    if (!d)
        d = "x/x/x";
    var a = d.split(/[ :\-\/\.]/g);
    var s = "";
    switch (locale.substr(3,2)){
        case 'US':
            s = a[1]+"/"+a[2]+"/"+a[0];
            break;
        case 'SK':
        case 'DE':
            s = a[2]+"."+a[1]+"."+a[0];
            break;
        case 'GB':
            s = a[2]+"/"+a[1]+"/"+a[0];
            break;
        default:
            s = "unknown locale";

    }

    return s;

};

libCommon.Prog2CSV = function(data,sep,locales) {
    var str = '';

    // header
    var header =
        'program'+sep+
        'event.name'+sep+
        'event.start'+sep+
        'team.num'+sep+
        'team.name'+sep+
        'team.registeredOn'+sep+
        'coach.name'+sep+
        'coach.email'+sep+
        'team.org.name'+sep+
        'team.org.address'+sep+
        'team.org.city'+sep+
        'team.org.postCode'+sep+
        'member.01.fullName'+sep+
        'member.01.dob'+sep+
        'member.02.fullName'+sep+
        'member.02.dob'+sep+
        'member.03.fullName'+sep+
        'member.03.dob'+sep+
        'member.04.fullName'+sep+
        'member.04.dob'+sep+
        'member.05.fullName'+sep+
        'member.05.dob'+sep+
        'member.06.fullName'+sep+
        'member.06.dob'+sep+
        'member.07.fullName'+sep+
        'member.07.dob'+sep+
        'member.08.fullName'+sep+
        'member.08.dob'+sep+
        'member.09.fullName'+sep+
        'member.09.dob'+sep+
        'member.10.fullName'+sep+
        'member.10.dob';

    str += header + '\r\n';

    // data
    for (var i = 0; i < data.program.teams.length; i++) {
        var line = '';
        var t = data.program.teams[i];

        line += data.program.name;
        line += sep + t.event.eventId.name;
        line += sep + (new Date(t.event.eventId.startDate)).toLocaleDateString(locales);
        line += sep + t.event.teamNumber;
        line += sep + t.name;
        line += sep + (new Date(t.event.registeredOn)).toLocaleDateString(locales);

        line += sep + t.coaches[0].fullName;
        line += sep + t.coaches[0].email;

        if (t.foundingOrg)
            line += sep + t.foundingOrg.name;
        else
            line += sep + '';

        if (t.foundingAdr) {
            line += sep + t.foundingAdr.addrLine1
                + (t.foundingAdr.addrLine2 ? ", " + t.foundingAdr.addrLine2 : "")
                + (t.foundingAdr.addrLine3 ? ", " + t.foundingAdr.addrLine3 : "");
            line += sep + t.foundingAdr.city;
            line += sep + t.foundingAdr.postCode;
        } else {
            line += sep + sep + sep;
        }

        for (var j = 0; j < 10; j++) {
            if (j < t.members.length)
                line += sep + t.members[j].fullName + sep + t.members[j].dateOfBirth;
            else
                line += sep + ' ' + sep + ' ';
        }

        str += line + '\r\n';
    }

    return str;
};