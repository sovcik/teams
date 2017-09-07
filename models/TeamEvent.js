const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const TeamEventSchema = new mongoose.Schema({
    eventId: { type: String, required: true },
    teamId: { type: String, required: true },
    programId: { type: String, required: true },
    registeredOn: {type: Date, required: true },
    teamNumber: {type:String}
});

// unique index to ensure team can register for specific event only once
TeamEventSchema.index({ eventId:1, teamId: 1 }, { unique:true });

if (!mongoose.models.TeamEvent) {
    mongoose.model('TeamEvent', TeamEventSchema);
}

module.exports = TeamEventSchema;