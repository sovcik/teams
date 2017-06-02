const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const statusPlugin = require('./plugins/status-plugin');

const ContactSchema = new mongoose.Schema({
    name: { type: String },
    phone: { type: String },
    mobile: { type: String },
    email: { type: String },
});

module.exports = ContactSchema;