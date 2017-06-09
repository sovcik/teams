const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const statusPlugin = require('./plugins/status-plugin');

const ProgramSchema = new mongoose.Schema({
    name: { type: String, required: true },
    adminId: { type: String, required: true } //id of admin user for specific program
});

ProgramSchema.plugin(statusPlugin);

if (!mongoose.models.Program) {
    mongoose.model('Program', ProgramSchema);
}

module.exports = ProgramSchema;