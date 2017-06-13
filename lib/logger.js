const Logger = require('le_node');

const log = new Logger({
    token: process.env.LOGENTRIES_TOKEN,
    console: true, // send log to console too
    levels: ["TRACE","DEBUG","INFO","WARN","ERROR","CRIT","FATAL"], // custom names for log levels
    minLevel: 2,
    secure: true,
    timestamp: true
});

module.exports = log;