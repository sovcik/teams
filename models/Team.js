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

if (!mongoose.models.Team) {
    mongoose.model('Team', TeamSchema);
}

module.exports = TeamSchema;