"use strict";

var libProfile = {};

libProfile.setAdmin = function (flag, userId, cb){
    console.log("setAdmin",userId);
    $.post("/profile/"+userId,
        {
            cmd: 'setAdmin',
            val: flag?1:0
        },
        function (res) {
            console.log("setAdmin: Server returned",res);
            if (res.result == "ok") {
                cb(true);
            } else {
                console.log("Error while setAdmin");
            }
        }
    )
        .fail(function (err) {
            console.log("setAdmin failed",err);
            cb(false,err);
        });
};

libProfile.setActive = function (flag, userId, cb){
    console.log("setActive",userId);
    $.post("/profile/"+userId,
        {
            cmd: 'setActive',
            val: flag?1:0
        },
        function (res) {
            console.log("setActive: Server returned",res);
            if (res.result == "ok") {
                cb(true);
            } else {
                console.log("Error while setActive");
            }
        }
    )
        .fail(function (err) {
            console.log("setActive failed",err);
            cb(false,err);
        });
};