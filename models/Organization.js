const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const statusPlugin = require('./plugins/status-plugin');

const OrganizationSchema = new mongoose.Schema({
    name: { type: String },
    companyNo: { type: String },
    taxNo: { type: String },
    VATNo: { type: String },
});

OrganizationSchema.testData = function(rec, prefix){
    rec.name = prefix+"org";
    rec.companyNo = prefix + "CNo";
    rec.taxNo = prefix + "TxNo";
    rec.VATNo = prefix + "VATNo";

    return rec;
};

module.exports = OrganizationSchema;