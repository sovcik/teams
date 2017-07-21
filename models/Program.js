const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const statusPlugin = require('./plugins/status-plugin');

const ProgramSchema = new mongoose.Schema({
    name: { type: String, required: true },
    managers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

ProgramSchema.plugin(statusPlugin);

if (!mongoose.models.Program) {
    mongoose.model('Program', ProgramSchema);
}

module.exports = ProgramSchema;