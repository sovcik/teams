'use strict';
const debugLib = require('debug')('rt-docs');
const mongoose = require('mongoose');
const express = require('express');
const cel = require('connect-ensure-login');
const router = express.Router();

const log = require('../lib/logger');

const libFmt = require('../lib/fmt');

const storage = require('../lib/storage');

const Program = mongoose.models.Program;
const User = mongoose.models.User;

module.exports = router;

router.get('/', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    const debug = debugLib.extend('GET /');
    const cmd = req.query.cmd;

    debug('Query %O',req.query);

    const r = {result:"error", status:200};

    switch (cmd){
        case 'getList':
            let progId = req.query.programId;
            debug('list of docs prg=%s',progId);

            try {
                if (!progId) throw("Program ID not specified.");

                let l = await storage.listFiles(progId+'/');
                debug('%O',l);
                let l2 = l.Contents.map(function(itm){
                    let a = itm.Key.split('/');
                    let n = a[a.length-1];
                    return {name:decodeURI(n), size:itm.Size, key:itm.Key}
                });
                r.list = l2;
                r.user = req.user;
                r.result = 'ok';

            } catch (err) {
                log.ERROR("Failed to fetch list of files for program. err="+err.message);
                r.error = {message:"Failed to fetch list of files for program. err="+err};
            }
            res.json(r);
            res.end();

            break;
        case 'download':
            try {
                if (!req.query.doc) throw new error("document name not specified");
                debug('download doc=%s',req.query.doc);
                let fname = req.query.doc.split("/");
                fname = fname[fname.length-1];
                let s = await storage.getFileStream(req.query.doc, res);
                res.attachment(fname);
                s.pipe(res);
                debug("download started");
            } catch (err) {
                log.ERROR("Failed downloading file for program. err="+err.message);
                r.error = {message:"Failed downloading document. err="+err.message};
            }
            break;
        default:
            console.log("cmd=unknown");

    }

});