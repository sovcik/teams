/*
 Team entity - Storing team details
 */
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const statusPlugin = require('./plugins/status-plugin');

const AddressSchema = require('./Address');
const OrgSchema = require('./Organization');
const ContactSchema = require('./Contact');

const InvoicingOrgSchema = new mongoose.Schema(
    {
        org: { type: OrgSchema, default: {} },
        adr: { type: AddressSchema, default: {} },
        contact: { type: ContactSchema, default: {} },
        nextDraftInvNumber: { type: Number, required: true, default: 1 }, // next draft invoice number
        draftInvNumPrefix: { type: String, required: true, default: 'DR' },
        nextInvNumber: { type: Number, required: true, default: 1 }, // next tax invoice number
        nextNTInvNumber: { type: Number, required: true, default: 1 }, // next non-tax invoice number
        nextCRInvNumber: { type: Number, required: true, default: 1 }, // next credit invoice number
        invNumPrefix: { type: String, required: true, default: 'IN' },
        ntInvNumPrefix: { type: String, required: true, default: 'NT' },
        crInvNumPrefix: { type: String, required: true, default: 'CR' },
        dueDays: { type: Number, required: true, default: 14 },
        logo: {
            type: String,
            required: true,
            default: 'https://github.com/FLL-SK/teams/raw/master/public/teams-logo-150x150px.png'
        },
        invoiceFooter: { type: String, required: false, default: '' },
        managers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    },
    {
        usePushEach: true
    }
);

InvoicingOrgSchema.plugin(statusPlugin);

InvoicingOrgSchema.statics.testData = function(rec, id) {
    rec.org = {};
    OrgSchema.testData(rec.org, 'boT' + id);
    rec.adr = {};
    AddressSchema.testData(rec.adr, 'baT' + id);
    rec.contact = {};
    ContactSchema.testData(rec.contact, 'bcT' + id);

    return rec;
};

if (!mongoose.models.InvoicingOrg) {
    mongoose.model('InvoicingOrg', InvoicingOrgSchema);
}

module.exports = InvoicingOrgSchema;
