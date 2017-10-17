"use strict";

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

exp.createInvoice = function(teamId, eventId, invType){
    return new Promise(
        async function (fulfill, reject) {
            console.log("CREATE INVOICE DRAFT");

            try {
                const te = await TeamEvent.findOne({teamId:teamId, eventId:eventId});
                if (!te) return reject(new Error("team-event not found "+teamId));

                const t = await Team.findById(te.teamId);
                if (!t) return reject(new Error("team not found "+te.teamId ));

                const ev = await Event.findById(te.eventId);
                if (!ev) return reject(new Error("event not found "+te.eventId ));

                const io = await InvoicingOrg.findOneAndUpdate({ _id: ev.invoicingOrg }, { $inc: {nextDraftInvNumber:1}});
                if (!io) return reject(new Error("failed to increment draft number iorg="+ev.invoicingOrg ));

                const inv = {};
                inv.isDraft = true;
                inv.number = io.draftInvNumPrefix+io.nextDraftInvNumber;
                inv.team = t.id;
                inv.invoicingOrg = io.id;

                inv.issuingOrg = io.org;
                inv.issuingAdr = io.adr;
                inv.issuingContact = io.contact;
                inv.billOrg = t.billingOrg;
                inv.billAdr = t.billingAdr;
                inv.billContact = t.billingContact;
                inv.issuedOn = new Date();
                inv.dueOn = new Date();
                inv.dueOn.setDate(inv.issuedOn.getDate()+io.dueDays);
                inv.type = invType;
                inv.event = ev.id;

                inv.items = [];
                inv.items.push({itemNo:1, text:"FLL Challenge Set 2017/2018", unit:"ks", qty:1, unitPrice:129.0, total:129.0});
                inv.items.push({itemNo:2, text:"FLL Registračný poplatok 2017/2018", unit:"ks", qty:1, unitPrice:137.0,  total:137.0});
                inv.items.push({itemNo:3, text:"Zľava z registračného poplatku FLL 2017/2018", note:"Vďaka sponzorom FLL Slovensko o.z.", unit:"ks", qty:1, unitPrice:-107.0, total:-107.0});

                inv.currency = "€";
                inv.total = 0;
                inv.items.forEach(i => inv.total += i.total);

                inv.total = inv.total.toFixed(2);

                const i = Invoice.create(inv);
                if (!i) return reject(new Error("failed create new invoice io="+inv.invoicingOrg+"  invNumber="+inv.number ));

                fulfill(i);

            } catch(err) {
                reject(err);
            }

        }
    )
};

exp.confirmInvoice = function(invId){
    return new Promise(
        async function (fulfill, reject) {
            console.log("CONFIRM INVOICE id="+invId);

            try {
                const i = await Invoice.findById(invId);
                if (!i) return reject(new Error("invoice not found "+invId ));

                if (!i.isDraft)
                    return reject(new Error("faktúra už nie je návrh "+invId ));

                let incq;
                switch (i.type){
                    case "I":
                        incq = { nextInvNumber: 1 };
                        break;
                    case "C":
                        incq = { nextCRInvNumber: 1 };
                        break;
                    case "P":
                        incq = { nextNTInvNumber: 1 };
                        break;
                    default:
                        return reject(new Error("wrong invoice type type="+i.type+" inv="+i._id ));
                }

                const io = await InvoicingOrg.findOneAndUpdate({ _id: i.invoicingOrg }, { $inc: incq});
                if (!io) return reject(new Error("failed to increment invoice number iorg="+i.invoicingOrg ));

                switch (i.type){
                    case "I":
                        i.number = io.invNumPrefix+io.nextInvNumber;  // the one in the database has been already increased
                        break;
                    case "C":
                        i.number = io.crInvNumPrefix+io.nextCRInvNumber;
                        break;
                    case "P":
                        i.number = io.ntInvNumPrefix+io.nextNTInvNumber;
                        break;
                    default:
                        return reject(new Error("wrong invoice type '"+i.type+"'"));
                }

                i.issuedOn = new Date();
                i.dueOn = new Date();
                i.dueOn.setDate(i.issuedOn.getDate()+io.dueDays);

                i.total = 0;
                i.items.forEach(iv => i.total += iv.total);

                i.total = i.total.toFixed(2);

                i.isDraft= false;

                await i.save();

                fulfill(i);

            } catch(err) {
                reject(err);
            }

        }
    )
};

exp.copyInvoice = function(invoiceId, newInvoiceType){
    return new Promise(
        async function (fulfill, reject) {
            console.log("COPYING INVOICE");

            try {
                const oldInv = await Invoice.findById(invoiceId);

                if (!oldInv) return reject(new Error("invoice not found "+invoiceId));

                // only one tax invoice can be created from non-tax invoice
                if (oldInv.taxInvoice) return reject(new Error("tax invoice already created "+oldInv.taxInvoice));

                let incq;
                if (newInvoiceType === "I")
                    incq = { nextInvNumber: 1 };
                else
                    incq = { nextNTInvNumber: 1 };

                const io = await InvoicingOrg.findOneAndUpdate({ _id: oldInv.invoicingOrg }, { $inc: incq});
                if (!io) return reject(new Error("failed to increment invoice number "+oldInv.invoicingOrg ));

                const inv = {};
                inv.team = oldInv.team;
                inv.isDraft = oldInv.isDraft;
                inv.invoicingOrg = oldInv.invoicingOrg;
                if (newInvoiceType === "I")
                    inv.number = io.invNumPrefix+io.nextInvNumber;  // the one in the database has been already increased
                else
                    inv.number = io.ntInvNumPrefix+io.nextNTInvNumber;

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

                if (oldInv.paidOn){ // if proforma invoice has been paid already
                    inv.dueOn = inv.issuedOn;
                    inv.paidOn = inv.issuedOn;
                } else {
                    inv.dueOn.setDate(inv.issuedOn.getDate()+io.dueDays);
                }
                
                inv.type = newInvoiceType;

                const i = await Invoice.create(inv);
                if (!i) return reject(new Error("failed create new invoice io="+inv.invoicingOrg+"  invNumber="+inv.number ));

                // store tax invoice id to document it has been created from
                if (newInvoiceType === "I") {
                    try {
                        oldInv.taxInvoice = i.id;
                        oldInv.save();
                    } catch (err) {
                        log.ERROR("Failed writing tax invoice number "+i.id+" to original invoice "+oldInv.id);
                    }
                }

                fulfill(i);

            } catch(err) {
                reject(err);
            }

        }
    )
};

exp.removeInvoice = function(invoiceId){
    return new Promise(
        async function (fulfill, reject) {
            console.log("REMOVING INVOICE");

            try {
                const inv = await Invoice.findById(invoiceId);

                if (!inv) return reject(new Error("invoice not found "+invoiceId));

                if (inv.type === "T")
                    return reject(new Error("not allowed to remove tax invoice "+invoiceId));

                await Invoice.deleteOne({_id:inv._id});

                fulfill(inv);

            } catch(err) {
                reject(err);
            }

        }
    )
};

