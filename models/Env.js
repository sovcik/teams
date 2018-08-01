const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const EnvSchema = new mongoose.Schema({
    dbrev: { type: Number, required: true, default:0 }
}, {
    usePushEach: true
});

if (!mongoose.models.Env) {
    mongoose.model('Env', EnvSchema);
}

module.exports = EnvSchema;