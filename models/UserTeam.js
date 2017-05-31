/*
 User-Team relationship
 */
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const statusPlugin = require('./plugins/status-plugin');

const UserTeamSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    teamId: { type: String, required: true },
    role: { type: String, required: true }  // coach, member
});

UserTeamSchema.plugin(statusPlugin);

if (!mongoose.models.UserTeam) {
    mongoose.model('UserTeam', UserTeamSchema);
}