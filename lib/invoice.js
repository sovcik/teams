'use strict';

const mongoose = require('mongoose');
const email = require('./email');
const log = require('./logger');

const Invoice = mongoose.models.Invoice;
const InvoiceItem = mongoose.models.InvoiceItem;
const InvoicingOrg = mongoose.models.InvoicingOrg;
const Team = mongoose.models.Team;
const Event = mongoose.models.Event;
const TeamEvent = mongoose.models.TeamEvent;

const exp = {};

module.exports = exp;

exp.resolveDueOn = function(dueOption, issuedOn, dueDays, dueMaxDate) {
    let dueOn = new Date();
    dueOn.setDate(issuedOn.getDate() + dueDays);

    switch (dueOption) {
        case 1:
            // dueOn alreade calculated
            break;
        case 2:
            dueOn = new Date(dueMaxDate.getTime());
            break;
        case 3:
            // relies on dueOn already set above
            if (dueOn.getTime() > dueMaxDate.getTime()) dueOn = new Date(dueMaxDate.getTime());
            break;
    }

    return dueOn;
};

exp.createInvoice = function(invOrgId, invType, billOrg, billAdr, billContact, templateId) {
    return new Promise(async function(fulfill, reject) {
        console.log('CREATE INVOICE DRAFT');

        try {
            const io = await InvoicingOrg.findOneAndUpdate(
                { _id: invOrgId },
                { $inc: { nextDraftInvNumber: 1 } }
            );
            if (!io) return reject(new Error('failed to increment draft number iorg=' + invOrgId));

            const it = await Invoice.findById(templateId);
            if (!it)
                return reject(
                    new Error('failed to locate specified invoice template id=' + templateId)
                );

            const inv = {};
            inv.isDraft = true;
            if (invType == null) invType = io.invType;
            inv.type = invType;
            inv.number = io.draftInvNumPrefix + io.nextDraftInvNumber;
            inv.invoicingOrg = io.id;

            inv.logo = io.logo;
            inv.footer = io.invoiceFooter;

            inv.issuingOrg = io.org;
            inv.issuingAdr = io.adr;
            inv.issuingContact = io.contact;
            inv.billOrg = billOrg;
            inv.billAdr = billAdr;
            inv.billContact = billContact;
            inv.issuedOn = new Date();

            inv.dueOn = exp.resolveDueOn(io.dueOption, inv.issuedOn, io.dueDays, io.dueMaxDate);

            inv.items = [];
            it.items.forEach(i => inv.items.push(i)); // load items from template

            inv.currency = '€';
            inv.total = 0;
            inv.items.forEach(i => (inv.total += i.total));

            inv.total = inv.total.toFixed(2);

            const i = Invoice.create(inv);
            if (!i)
                return reject(
                    new Error(
                        'failed create new invoice io=' +
                            inv.invoicingOrg +
                            '  invNumber=' +
                            inv.number
                    )
                );

            fulfill(i);
        } catch (err) {
            console.log('CREATE INVOICE DRAFT FAILED error=', err);
            reject(err);
        }
    });
};

exp.createTeamInvoice = function(invOrgId, invType, teamId) {
    return new Promise(async function(fulfill, reject) {
        console.log('CREATE TEAM INVOICE');

        try {
            const t = await Team.findById(teamId);
            if (!t) reject(new Error('team not found id=' + teamId));

            let inv = await Invoice.findOne({ invoicingOrg: invOrgId, type: 'T' }); // find invoice template used by invoicing org

            let i = await exp.createInvoice(
                invOrgId,
                invType,
                t.billingOrg,
                t.billingAdr,
                t.billingContact,
                !inv ? null : inv._id
            );

            i.team = t._id;
            await i.save();

            fulfill(i);
        } catch (err) {
            console.log('CREATE TEAM INVOICE FAILED error=', err);
            reject(err);
        }
    });
};

exp.confirmInvoice = function(invId) {
    return new Promise(async function(fulfill, reject) {
        console.log('CONFIRM INVOICE id=' + invId);

        try {
            const i = await Invoice.findById(invId);
            if (!i) return reject(new Error('invoice not found ' + invId));

            if (!i.isDraft) return reject(new Error('faktúra už nie je návrh ' + invId));

            let incq;
            switch (i.type) {
                case 'I':
                    incq = { nextInvNumber: 1 };
                    break;
                case 'C':
                    incq = { nextCRInvNumber: 1 };
                    break;
                case 'P':
                    incq = { nextNTInvNumber: 1 };
                    break;
                default:
                    return reject(new Error('wrong invoice type type=' + i.type + ' inv=' + i._id));
            }

            const io = await InvoicingOrg.findOneAndUpdate({ _id: i.invoicingOrg }, { $inc: incq });
            if (!io)
                return reject(
                    new Error('failed to increment invoice number iorg=' + i.invoicingOrg)
                );

            switch (i.type) {
                case 'I':
                    i.number = io.invNumPrefix + io.nextInvNumber; // the one in the database has been already increased
                    break;
                case 'C':
                    i.number = io.crInvNumPrefix + io.nextCRInvNumber;
                    break;
                case 'P':
                    i.number = io.ntInvNumPrefix + io.nextNTInvNumber;
                    break;
                default:
                    return reject(new Error("wrong invoice type '" + i.type + "'"));
            }

            i.issuedOn = new Date();
            i.dueOn = exp.resolveDueOn(io.dueOption, i.issuedOn, io.dueDays, io.dueMaxDate);

            i.total = 0;
            i.items.forEach(iv => (i.total += iv.total));

            i.total = i.total.toFixed(2);

            i.isDraft = false;

            await i.save();

            fulfill(i);
        } catch (err) {
            console.log('CONFIRM INVOICE DRAFT FAILED error=', err);
            reject(err);
        }
    });
};

exp.copyInvoice = function(invoiceId, newInvoiceType) {
    return new Promise(async function(fulfill, reject) {
        console.log('COPYING INVOICE');

        try {
            const oldInv = await Invoice.findById(invoiceId);

            if (!oldInv) return reject(new Error('invoice not found ' + invoiceId));

            // only one tax invoice can be created from non-tax invoice
            if (oldInv.taxInvoice)
                return reject(new Error('tax invoice already created ' + oldInv.taxInvoice));

            let incq;
            if (newInvoiceType === 'I') incq = { nextInvNumber: 1 };
            else incq = { nextNTInvNumber: 1 };

            const io = await InvoicingOrg.findOneAndUpdate(
                { _id: oldInv.invoicingOrg },
                { $inc: incq }
            );
            if (!io)
                return reject(
                    new Error('failed to increment invoice number ' + oldInv.invoicingOrg)
                );

            const inv = {};
            inv.team = oldInv.team;
            inv.isDraft = oldInv.isDraft;
            inv.invoicingOrg = oldInv.invoicingOrg;
            if (newInvoiceType === 'I') inv.number = io.invNumPrefix + io.nextInvNumber;
            // the one in the database has been already increased
            else inv.number = io.ntInvNumPrefix + io.nextNTInvNumber;

            inv.issuingOrg = oldInv.issuingOrg;
            inv.issuingAdr = oldInv.issuingAdr;
            inv.issuingContact = oldInv.issuingContact;

            inv.billOrg = oldInv.billOrg;
            inv.billAdr = oldInv.billAdr;
            inv.billContact = oldInv.billContact;

            inv.issuedOn = new Date();
            inv.dueOn = new Date();
            inv.total = oldInv.total;
            inv.currency = oldInv.currency;
            inv.event = oldInv.event;

            inv.items = oldInv.items;

            inv.logo = oldInv.logo;
            inv.footer = oldInv.footer;

            if (oldInv.paidOn) {
                // if proforma invoice has been paid already
                inv.dueOn = inv.issuedOn;
                inv.paidOn = inv.issuedOn;
            } else {
                inv.dueOn.setDate(inv.issuedOn.getDate() + io.dueDays);
            }

            inv.type = newInvoiceType;

            const i = await Invoice.create(inv);
            if (!i)
                return reject(
                    new Error(
                        'failed create new invoice io=' +
                            inv.invoicingOrg +
                            '  invNumber=' +
                            inv.number
                    )
                );

            // store tax invoice id to document it has been created from
            if (newInvoiceType === 'I') {
                try {
                    oldInv.taxInvoice = i.id;
                    oldInv.save();
                } catch (err) {
                    log.ERROR(
                        'Failed writing tax invoice number ' +
                            i.id +
                            ' to original invoice ' +
                            oldInv.id
                    );
                }
            }

            fulfill(i);
        } catch (err) {
            console.log('COPY INVOICE FAILED error=', err);
            reject(err);
        }
    });
};

exp.removeInvoice = function(invoiceId) {
    return new Promise(async function(fulfill, reject) {
        console.log('REMOVING INVOICE');

        try {
            const inv = await Invoice.findById(invoiceId);

            if (!inv) return reject(new Error('invoice not found ' + invoiceId));

            if (inv.type === 'I' && !inv.isDraft)
                return reject(new Error('not allowed to remove tax invoice ' + invoiceId));

            await Invoice.deleteOne({ _id: inv._id });

            fulfill(inv);
        } catch (err) {
            console.log('REMOVE INVOICE FAILED error=', err);
            reject(err);
        }
    });
};

exp.createTemplateInvoice = function(invOrgId) {
    return new Promise(async function(fulfill, reject) {
        console.log('CREATING INVOICE TEMPLATE');

        try {
            let inv = Invoice();
            inv.type = 'T'; // creating new invoice template
            inv.number = 'Template';
            inv.isDraft = false;
            inv.invoicingOrg = invOrgId;
            inv.team = '000000000000000000000000'; // dummy team id

            inv.items = [];
            inv.items.push({
                itemNo: 1,
                text: 'Template line 1',
                unit: 'pcs',
                qty: 1,
                unitPrice: 1.0,
                total: 1.0
            });
            inv.items.push({
                itemNo: 2,
                text: 'Template line 2',
                unit: 'pcs',
                qty: 2,
                unitPrice: 2.0,
                total: 2.0
            });

            inv.currency = '€';
            inv.total = 0;
            inv.items.forEach(i => (inv.total += i.total));

            inv.total = inv.total.toFixed(2);

            inv = await inv.save();
            //console.log(inv);

            fulfill(inv);
        } catch (err) {
            console.log('CREATING INVOICE TEMPLATE FAILED error=', err);
            reject(err);
        }
    });
};
