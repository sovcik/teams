const exp = {};
exp.Schema = {};

exp.Schema.User = require('./User');
exp.Schema.UserVerify = require('./UserVerify');
exp.Schema.Team = require('./Team');
exp.Schema.UserTeam = require('./UserTeam');

module.exports = exp;