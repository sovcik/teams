'use strict';
const debugLib = require('debug')('rt-docs');
const mongoose = require('mongoose');
const express = require('express');
const cel = require('connect-ensure-login');
const router = express.Router();

const log = require('../lib/logger');

const storage = require('../lib/storage');

const TeamEvent = mongoose.models.TeamEvent;

module.exports = router;

router.get('/', cel.ensureLoggedIn('/login'), async function(req, res, next) {
    const debug = debugLib.extend('GET /');
    const cmd = req.query.cmd;

    debug('Query %O', req.query);

    const r = { result: 'error', status: 200 };
    let progs = [];

    switch (cmd) {
        case 'getListTeam': {
            debug('documents for team %s', req.query.teamId);
            let d = new Date();
            let q = {
                teamId: req.query.teamId,
                $or: [{ eventDate: { $gte: d } }, { eventDate: { $eq: null } }]
            };
            let pgs = await TeamEvent.find(q);
            progs = pgs.map(p => p.programId);
            debug('Progs = %o', progs);
        }

        // break is omitted intentionally so list of programs is processed
        // eslint-disable-next-line no-fallthrough
        case 'getList':
            {
                let progId = req.query.programId;
                debug('list of docs prg=%s', progId);

                try {
                    if (progs.length == 0 && progId) {
                        progs.push(progId);
                    }

                    r.list = [];

                    let i = 0;
                    while (i < progs.length) {
                        let l = await storage.listFiles(progs[i] + '/');
                        debug('%O', l);
                        let l2 = l.Contents.map(function(itm) {
                            let a = itm.Key.split('/');
                            let n = a[a.length - 1];
                            return { name: decodeURI(n), size: itm.Size, key: itm.Key };
                        });
                        l2 = l2.filter(i => i.name.length > 0);
                        r.list = r.list.concat(l2);
                        i++;
                    }

                    r.user = req.user;
                    r.result = 'ok';
                } catch (err) {
                    log.ERROR('Failed to fetch list of files for program. err=' + err.message);
                    r.error = { message: 'Failed to fetch list of files for program. err=' + err };
                }
                res.json(r);
                res.end();
            }

            break;
        case 'download':
            try {
                if (!req.query.doc) throw new Error('document name not specified');
                debug('download doc=%s', req.query.doc);
                let fname = req.query.doc.split('/');
                fname = fname[fname.length - 1];
                let s = await storage.getFileStream(req.query.doc, res);
                res.attachment(fname);
                s.pipe(res);
                debug('download started');
            } catch (err) {
                log.ERROR('Failed downloading file for program. err=' + err.message);
                r.error = { message: 'Failed downloading document. err=' + err.message };
            }
            break;
        default:
            console.log('cmd=unknown');
    }
});
