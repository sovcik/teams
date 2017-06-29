const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const statusPlugin = require('./plugins/status-plugin');

const ContactSchema = new mongoose.Schema({
    name: { type: String, default:'' },
    phone: { type: String, default:'' },
    mobile: { type: String, default:'' },
    email: { type: String, default:'' },
});

ContactSchema.testData = function(rec, prefix) {
    rec.name = prefix + "Cntct";
    rec.phone = prefix + "Phn";
    rec.mobile = prefix + "Mob";
    rec.email = prefix + "Eml";

    return rec;
};

module.exports = ContactSchema;