const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const statusPlugin = require('./plugins/status-plugin');

const ProgramSchema = new mongoose.Schema({
    name: { type: String, required: true },
    startDate: {type: Date, required: false},
    endDate: {type: Date, required: false},
    message: {type: String, required: false}, // message to be displayed when team is registering for program event
    managers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

ProgramSchema.plugin(statusPlugin);

if (!mongoose.models.Program) {
    mongoose.model('Program', ProgramSchema);
}

module.exports = ProgramSchema;