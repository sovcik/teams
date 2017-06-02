const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const statusPlugin = require('./plugins/status-plugin');

const AddressSchema = new mongoose.Schema({
    addrLine1: { type: String },
    addrLine2: { type: String },
    addrLine3: { type: String },
    city: { type: String },
    postCode: { type: String }
});

module.exports = AddressSchema;