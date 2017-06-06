/*
 Team entity - Storing team details
 */
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const statusPlugin = require('./plugins/status-plugin');

const AddressSchema = require('./Address');
const OrgSchema = require('./Organization');
const ContactSchema = require('./Contact');

const TeamSchema = new mongoose.Schema({
    name: { type: String, required: true },
    billingOrg: OrgSchema,
    billingAdr: AddressSchema,
    billingContact: ContactSchema,
    shippingOrg: OrgSchema,
    shippingAdr: AddressSchema,
    shippingContact: ContactSchema
});

TeamSchema.plugin(statusPlugin);

TeamSchema.statics.testData = function(rec, id){
    if (!id) id = '';
    rec.name = "Team "+id;
    rec.billingOrg = {};
    OrgSchema.testData(rec.billingOrg, 'boT'+id);
    rec.shippingOrg = {};
    OrgSchema.testData(rec.shippingOrg, 'soT'+id);
    rec.billingAdr = {};
    AddressSchema.testData(rec.billingAdr, 'baT'+id);
    rec.shippingAdr = {};
    AddressSchema.testData(rec.shippingAdr, 'saT'+id);
    rec.billingContact = {};
    ContactSchema.testData(rec.billingContact, 'bcT'+id);
    rec.shippingContact = {};
    ContactSchema.testData(rec.shippingContact, 'scT'+id);

    return rec;
};

if (!mongoose.models.Team) {
    mongoose.model('Team', TeamSchema);
}

module.exports = TeamSchema;