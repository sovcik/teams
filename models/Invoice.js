"use strict";

const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const AddressSchema = require('./Address');
const OrgSchema = require('./Organization');
const ContactSchema = require('./Contact');
const InvoiceItemSchema = require('./InvoiceItem');

const InvoiceSchema = new mongoose.Schema({
    number: { type: String },  // normally created as prefix+number
    type: {type: String, required: true}, // I/C/P
    isDraft: {type: Boolean, default: true},
    invoicingOrg: { type: mongoose.Schema.Types.ObjectId, ref: 'invoicingOrg', required:true },
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
    currency: {type: String},
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    taxInvoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' }
}, {
    usePushEach: true
});

InvoiceSchema.methods.updateTotal = function() {
    let ttl = 0;
    this.items.forEach(function(i){
        i.total = i.qty * i.unitPrice;
        ttl += i.total;
    });
    this.total = ttl.toFixed(2);
};

InvoiceSchema.methods.renumber = function() {
    let idx = 1;
    this.items.forEach(function(i){
        i.itemNo = idx++;
    });
};

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
    let itemNo = 1;
    InvoiceItemSchema.testData(item, 'itm'+id);
    item.itemNo = itemNo++;
    rec.items.push(item);

    item = {};
    InvoiceItemSchema.testData(item, 'itm'+id+1);
    item.itemNo = itemNo++;
    rec.items.push(item);

    item = {};
    InvoiceItemSchema.testData(item, 'itm'+id+2);
    item.itemNo = itemNo++;
    rec.items.push(item);

    rec.total = 1000.23;
    rec.currency = "€";

    rec.issuedOn = new Date();
    rec.dueOn = new Date();
    rec.dueOn.setDate(rec.dueOn.getDate()+14);

    return rec;
};



if (!mongoose.models.Invoice) {
    mongoose.model('Invoice', InvoiceSchema);
}

module.exports = InvoiceSchema;