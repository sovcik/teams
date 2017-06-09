const exp = {};
exp.Schema = {};

exp.Schema.User = require('./User');
exp.Schema.UserVerify = require('./UserVerify');
exp.Schema.Team = require('./Team');
exp.Schema.TeamUser = require('./TeamUser');
exp.Schema.Event = require('./Event');
exp.Schema.TeamEvent = require('./TeamEvent');
exp.Schema.Program = require('./Program');

module.exports = exp;