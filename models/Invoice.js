/*
 Team entity - Storing team details
 */
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const statusPlugin = require('./plugins/status-plugin');

const AddressSchema = require('./Address');
const OrgSchema = require('./Organization');
const ContactSchema = require('./Contact');

const InvoiceSchema = new mongoose.Schema({
    number: { type: String, required: true },
    type: {type: String, required: true},
    issuingOrg: OrgSchema,
    issuingAdr: AddressSchema,
    issuingContact: ContactSchema,
    billOrg: OrgSchema,
    billAdr: AddressSchema,
    billContact: ContactSchema,
    issuedOn: {type: Date},
    dueOn: {type:Date},
    paidOn: {type: Date},
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' }
});

InvoiceSchema.statics.testData = function(rec, id){
    if (!id) id = 'FA12345';
    rec.billOrg = {};
    OrgSchema.testData(rec.billOrg, 'boT'+id);
    rec.issuingOrg = {};
    OrgSchema.testData(rec.issuingOrg, 'soT'+id);
    rec.billAdr = {};
    AddressSchema.testData(rec.billAdr, 'baT'+id);
    rec.issuingAdr = {};
    AddressSchema.testData(rec.issuingAdr, 'saT'+id);
    rec.billContact = {};
    ContactSchema.testData(rec.billContact, 'bcT'+id);
    rec.issuingContact = {};
    ContactSchema.testData(rec.issuingContact, 'scT'+id);

    rec.issuedOn = Date.now();
    rec.dueOn = Date.now()+14;

    return rec;
};

if (!mongoose.models.Invoice) {
    mongoose.model('Invoice', InvoiceSchema);
}

module.exports = InvoiceSchema;