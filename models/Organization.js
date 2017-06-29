const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const statusPlugin = require('./plugins/status-plugin');

const OrganizationSchema = new mongoose.Schema({
    name: { type: String, default:'' },
    companyNo: { type: String, default:'' },
    taxNo: { type: String, default:'' },
    VATNo: { type: String, default:'' },
    bankAccount: {type: String, default:''},
    bankSWIFT: {type: String, default:''}
});

OrganizationSchema.testData = function(rec, prefix){
    rec.name = prefix+"org";
    rec.companyNo = prefix + "CNo";
    rec.taxNo = prefix + "TxNo";
    rec.VATNo = prefix + "VATNo";
    rec.bankAccount = "SK26 1234 1234 1234 1234" + prefix;
    rec.bankSWIFT = "SWIFTXYZ";

    return rec;
};

module.exports = OrganizationSchema;