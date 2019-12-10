'use strict';

const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const InvoiceItemSchema = new mongoose.Schema(
    {
        itemNo: { type: Number, required: true },
        code: { type: String, default: '' },
        text: { type: String, required: true },
        note: { type: String },
        qty: { type: Number },
        unit: { type: String, default: '' },
        unitPrice: { type: Number },
        total: { type: Number }
    },
    {
        usePushEach: true
    }
);

InvoiceItemSchema.testData = function(rec, prefix) {
    rec.itemNo = 1;
    rec.code = prefix + 'AAA';
    rec.text = 'item-name ' + prefix;
    rec.note = 'item-note ' + prefix;
    rec.qty = 2.5;
    rec.unit = 'pcs';
    rec.unitPrice = 11.33;
    rec.total = (rec.qty * rec.unitPrice).toFixed(2);

    return rec;
};

module.exports = InvoiceItemSchema;
