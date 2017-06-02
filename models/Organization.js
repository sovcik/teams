const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const statusPlugin = require('./plugins/status-plugin');

const OrganizationSchema = new mongoose.Schema({
    name: { type: String },
    companyNo: { type: String },
    taxNo: { type: String },
    VATNo: { type: String },
});

module.exports = OrganizationSchema;