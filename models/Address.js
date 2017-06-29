const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const statusPlugin = require('./plugins/status-plugin');

const AddressSchema = new mongoose.Schema({
    addrLine1: { type: String, default:'' },
    addrLine2: { type: String, default:'' },
    addrLine3: { type: String, default:'' },
    city: { type: String, default:'' },
    postCode: { type: String, default:'' }
});

AddressSchema.testData = function(rec, prefix){
    rec.addrLine1 = prefix + "adr1";
    rec.addrLine2 = prefix + "adr2";
    rec.city = prefix + "city";
    rec.postCode = "12345";

    return rec;
};

module.exports = AddressSchema;