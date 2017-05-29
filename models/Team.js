/*
 Team entity - Storing team details
 */
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const statusPlugin = require('./plugins/status-plugin');

const TeamSchema = new mongoose.Schema({
    name: { type: String, required: true }
});

TeamSchema.plugin(statusPlugin);

if (!mongoose.models.Team) {
    mongoose.model('Team', TeamSchema);
}