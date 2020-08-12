/* eslint-disable no-unused-vars */
/* eslint-disable no-async-promise-executor */

const Logger = require('r7insight_node');

const log = new Logger({
    token: process.env.LOGENTRIES_TOKEN,
    console: true, // send log to console too
    levels: ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'CRIT', 'FATAL'], // custom names for log levels
    minLevel: process.env.LOG_LEVEL,
    secure: true,
    timestamp: true,
    region: 'eu'
});

module.exports = log;
