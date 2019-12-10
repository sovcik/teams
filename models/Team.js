/*
 Team entity - Storing team details
 */
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const statusPlugin = require('./plugins/status-plugin');

const AddressSchema = require('./Address');
const OrgSchema = require('./Organization');
const ContactSchema = require('./Contact');

const TeamSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            index: true,
            minLength: [
                5,
                'Názov tímu je príliš krátky. Názov musí mať aspoň `{MINLENGTH}` znakov.'
            ]
        },

        // team has been created by founding organization (e.g school)
        foundingOrg: { type: OrgSchema, default: {} },
        foundingAdr: { type: AddressSchema, default: {} },
        foundingContact: { type: ContactSchema, default: {} },

        // billing organization gets to pay invoices
        billingOrg: { type: OrgSchema, default: {} },
        billingAdr: { type: AddressSchema, default: {} },
        billingContact: { type: ContactSchema, default: {} },

        // this address is used for sending paper-mail
        shippingOrg: { type: OrgSchema, default: {} },
        shippingAdr: { type: AddressSchema, default: {} },
        shippingContact: { type: ContactSchema, default: {} },

        boyCount: { type: Number, default: 0 },
        girlCount: { type: Number, default: 0 }
    },
    {
        usePushEach: true
    }
);

// virtual set of teams
TeamSchema.virtual('programs', {
    ref: 'TeamEvent',
    localField: '_id',
    foreignField: 'teamId'
});

TeamSchema.plugin(statusPlugin);

TeamSchema.statics.testData = function(rec, id) {
    if (!id) id = '';
    rec.name = 'Team ' + id;

    rec.billingOrg = {};
    OrgSchema.testData(rec.billingOrg, 'boT' + id);
    rec.shippingOrg = {};
    OrgSchema.testData(rec.shippingOrg, 'soT' + id);
    rec.foundingOrg = {};
    OrgSchema.testData(rec.foundingOrg, 'foT' + id);

    rec.billingAdr = {};
    AddressSchema.testData(rec.billingAdr, 'baT' + id);
    rec.shippingAdr = {};
    AddressSchema.testData(rec.shippingAdr, 'saT' + id);
    rec.foundingAdr = {};
    AddressSchema.testData(rec.foundingAdr, 'faT' + id);

    rec.billingContact = {};
    ContactSchema.testData(rec.billingContact, 'bcT' + id);
    rec.shippingContact = {};
    ContactSchema.testData(rec.shippingContact, 'scT' + id);
    rec.foundingContact = {};
    ContactSchema.testData(rec.foundingContact, 'fcT' + id);

    return rec;
};

if (!mongoose.models.Team) {
    mongoose.model('Team', TeamSchema);
}

module.exports = TeamSchema;
