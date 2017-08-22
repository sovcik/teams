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

    foundingOrg: OrgSchema, // team has been created by founding organization (e.g school)
    foundingAdr: AddressSchema,
    foundingContact: ContactSchema,

    billingAsFounding: {type:Boolean, default:true},
    billingOrg: OrgSchema, // billing organization gets to pay invoices
    billingAdr: AddressSchema,
    billingContact: ContactSchema,

    shippingAsFounding: {type:Boolean, default:true},
    shippingOrg: OrgSchema, // this address is used for sending paper-mail
    shippingAdr: AddressSchema,
    shippingContact: ContactSchema,

    programId: { type: String, required: true }
});

TeamSchema.plugin(statusPlugin);

TeamSchema.statics.testData = function(rec, id){
    if (!id) id = '';
    rec.name = "Team "+id;

    rec.billingOrg = {};
    OrgSchema.testData(rec.billingOrg, 'boT'+id);
    rec.shippingOrg = {};
    OrgSchema.testData(rec.shippingOrg, 'soT'+id);
    rec.foundingOrg = {};
    OrgSchema.testData(rec.foundingOrg, 'foT'+id);

    rec.billingAdr = {};
    AddressSchema.testData(rec.billingAdr, 'baT'+id);
    rec.shippingAdr = {};
    AddressSchema.testData(rec.shippingAdr, 'saT'+id);
    rec.foundingAdr = {};
    AddressSchema.testData(rec.foundingAdr, 'faT'+id);

    rec.billingContact = {};
    ContactSchema.testData(rec.billingContact, 'bcT'+id);
    rec.shippingContact = {};
    ContactSchema.testData(rec.shippingContact, 'scT'+id);
    rec.foundingContact = {};
    ContactSchema.testData(rec.foundingContact, 'fcT'+id);

    return rec;
};

if (!mongoose.models.Team) {
    mongoose.model('Team', TeamSchema);
}

module.exports = TeamSchema;