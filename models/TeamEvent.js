const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const statusPlugin = require('./plugins/status-plugin');

const TeamEventSchema = new mongoose.Schema({
    eventId: { type: String, required: true },
    teamId: { type: String, required: true }
});

TeamEventSchema.plugin(statusPlugin);

if (!mongoose.models.TeamEvent) {
    mongoose.model('TeamEvent', TeamEventSchema);
}

module.exports = TeamEventSchema;