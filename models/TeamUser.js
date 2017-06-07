/*
 User-Team relationship
 */
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const statusPlugin = require('./plugins/status-plugin');

const TeamUserSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    teamId: { type: String, required: true },
    role: { type: String, required: true }  // coach, member
});

TeamUserSchema.plugin(statusPlugin);

if (!mongoose.models.TeamUser) {
    mongoose.model('TeamUser', TeamUserSchema);
}

module.exports = TeamUserSchema;