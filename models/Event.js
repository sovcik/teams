
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const statusPlugin = require('./plugins/status-plugin');

const AddressSchema = require('./Address');
const OrgSchema = require('./Organization');
const ContactSchema = require('./Contact');

const EventSchema = new mongoose.Schema({
    name: { type: String, required: true },
    programId: { type: String, required: true },
    invoicingOrg: { type: mongoose.Schema.Types.ObjectId, ref: 'InvoicingOrg' },
    startDate: {type: Date, required: false},
    endDate: {type: Date, required: false},
    regEndDate: {type: Date, required: false},
    address: AddressSchema,
    instructions: { type: String, required: false },
    organizerOrg: OrgSchema,
    organizerAdr: AddressSchema,
    organizerContact: ContactSchema,
    managers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

// virtual set of teams
EventSchema.virtual('teams', {
    ref: 'TeamEvent',
    localField: '_id',
    foreignField: 'teamId'
});

EventSchema.plugin(statusPlugin);

EventSchema.statics.testData = function(rec, id){
    if (!id) id = '';
    rec.name = "Event "+id;
    rec.startDate = new Date();

    return rec;
};

if (!mongoose.models.Event) {
    mongoose.model('Event', EventSchema);
}

module.exports = EventSchema;