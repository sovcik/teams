const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const ResultSchema = new mongoose.Schema(
    {
        type: { type: mongoose.Schema.Types.String, required: true },
        modifiedOn: { type: mongoose.Schema.Types.Date, required: false },
        modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        score: { type: mongoose.Schema.Types.Number, default: 0 },
        details: { type: mongoose.Schema.Types.String }, // json containing result details
    },
    {
        usePushEach: true,
    }
);

module.exports = ResultSchema;
