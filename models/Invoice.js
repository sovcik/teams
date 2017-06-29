"use strict";

const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const AddressSchema = require('./Address');
const OrgSchema = require('./Organization');
const ContactSchema = require('./Contact');
const InvoiceItemSchema = require('./InvoiceItem');

const InvoiceSchema = new mongoose.Schema({
    number: { type: String, required: true },  // normally created as prefix+number
    type: {type: String, required: true},
    invoicingOrg: { type: mongoose.Schema.Types.ObjectId, ref: 'invoicingOrg' },
    issuingOrg: OrgSchema,
    issuingAdr: AddressSchema,
    issuingContact: ContactSchema,
    billOrg: OrgSchema,
    billAdr: AddressSchema,
    billContact: ContactSchema,
    issuedOn: {type: Date},
    dueOn: {type:Date},
    paidOn: {type: Date},
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    items: [InvoiceItemSchema],
    total: {type: Number},
    currency: {type: String}
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

    rec.items = [];

    let item = {};
    InvoiceItemSchema.testData(item, 'itm'+id);
    rec.items.push(item);

    item = {};
    InvoiceItemSchema.testData(item, 'itm'+id+1);
    rec.items.push(item);

    item = {};
    InvoiceItemSchema.testData(item, 'itm'+id+2);
    rec.items.push(item);

    rec.total = 1000.23;
    rec.currency = "€";

    rec.issuedOn = Date.now();
    rec.dueOn = Date.now()+14;

    return rec;
};

if (!mongoose.models.Invoice) {
    mongoose.model('Invoice', InvoiceSchema);
}

module.exports = InvoiceSchema;