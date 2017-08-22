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
            console.log("CREATE INVOICE");

            try {
                const te = await TeamEvent.findOne({teamId:teamId, eventId:eventId});
                if (!te) return reject(new Error("team-event not found "+teamId));

                const t = await Team.findById(te.teamId);
                if (!t) return reject(new Error("team not found "+te.teamId ));

                const ev = await Event.findById(te.eventId);
                if (!ev) return reject(new Error("event not found "+te.eventId ));

                let incq;
                if (invType === "I")
                    incq = { nextInvNumber: 1 };
                else
                    incq = { nextNTInvNumber: 1 };
                const io = await InvoicingOrg.findOneAndUpdate({ _id: ev.invoicingOrg }, { $inc: incq});
                if (!io) return reject(new Error("failed to increment invoice number "+ev.invoicingOrg ));

                const inv = {};
                inv.team = t.id;
                inv.invoicingOrg = io.id;

                if (invType === "I")
                    inv.number = io.invNumPrefix+io.nextInvNumber;  // the one in the database has been already increased
                else
                    inv.number = io.ntInvNumPrefix+io.nextNTInvNumber;

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

exp.copyInvoice = function(invoiceId, newInvoiceType){
    return new Promise(
        async function (fulfill, reject) {
            console.log("COPYING INVOICE");

            try {
                const oldInv = await Invoice.findById(invoiceId);

                if (!oldInv) return reject(new Error("invoice not found "+invoiceId));

                let incq;
                if (newInvoiceType === "I")
                    incq = { nextInvNumber: 1 };
                else
                    incq = { nextNTInvNumber: 1 };

                const io = await InvoicingOrg.findOneAndUpdate({ _id: oldInv.invoicingOrg }, { $inc: incq});
                if (!io) return reject(new Error("failed to increment invoice number "+oldInv.invoicingOrg ));

                const inv = {};
                inv.team = oldInv.team;
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
