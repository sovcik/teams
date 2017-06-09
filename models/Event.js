
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const statusPlugin = require('./plugins/status-plugin');

const EventSchema = new mongoose.Schema({
    name: { type: String, required: true },
    programId: { type: String, required: true },
    startDate: {type: Date, required: false}
});

EventSchema.plugin(statusPlugin);

EventSchema.statics.testData = function(rec, id){
    if (!id) id = '';
    rec.name = "Event "+id;
    rec.startDate = Date.now();

    return rec;
};

if (!mongoose.models.Event) {
    mongoose.model('Event', EventSchema);
}

module.exports = EventSchema;