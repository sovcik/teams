/*
 Team entity - Storing team details
 */
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const statusPlugin = require('./plugins/status-plugin');

const AddressSchema = require('./Address');
const OrgSchema = require('./Organization');
const ContactSchema = require('./Contact');

const InvoicingOrgSchema = new mongoose.Schema({
    org: OrgSchema,
    adr: AddressSchema,
    contact: ContactSchema,
    nextInvNumber: {type:Number, required:true, default:1},  // next tax invoice number
    nextNTInvNumber: {type:Number, required:true, default:1}, // next non-tax invoice number
    invNumPrefix: {type:String, required:true, default:''},
    ntInvNumPrefix: {type:String, required:true, default:''},
    dueDays:{type:Number, required:true, default:14},
    managers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

InvoicingOrgSchema.plugin(statusPlugin);

InvoicingOrgSchema.statics.testData = function(rec, id){
    rec.org = {};
    OrgSchema.testData(rec.org, 'boT'+id);
    rec.adr = {};
    AddressSchema.testData(rec.adr, 'baT'+id);
    rec.contact = {};
    ContactSchema.testData(rec.contact, 'bcT'+id);

    return rec;
};

if (!mongoose.models.InvoicingOrg) {
    mongoose.model('InvoicingOrg', InvoicingOrgSchema);
}

module.exports = InvoicingOrgSchema;