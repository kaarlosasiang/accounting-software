import mongoose, { Schema } from "mongoose";

import {
  applyDocumentStatus,
  applyDocumentTotals,
  OPEN_DOCUMENT_STATUSES,
} from "../shared/helpers/documentTotals.js";
import {
  IInvoice,
  IInvoiceDocument,
  IInvoiceLineItem,
  InvoiceStatus,
} from "../shared/interface/IInvoice.js";

import { nextDocumentNumber } from "./Counter.js";

/**
 * Invoice Line Item Schema
 */
const InvoiceLineItemSchema = new Schema<IInvoiceLineItem>(
  {
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
    },
    unitPrice: {
      type: Number,
      required: [true, "Unit price is required"],
      min: [0, "Unit price cannot be negative"],
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: [true, "Account ID is required"],
    },
    inventoryItemId: {
      type: Schema.Types.ObjectId,
      ref: "InventoryItem",
      default: null,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
  },
  { _id: false },
);

/**
 * Invoice Schema
 */
const InvoiceSchema = new Schema<IInvoice>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company ID is required"],
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer ID is required"],
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: [true, "Invoice number is required"],
      trim: true,
    },
    invoiceDate: {
      type: Date,
      default: null,
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
      index: true,
    },
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: {
        values: Object.values(InvoiceStatus),
        message: "Invalid status",
      },
      default: InvoiceStatus.DRAFT,
      index: true,
    },
    lineItems: {
      type: [InvoiceLineItemSchema],
      required: [true, "At least one line item is required"],
      validate: {
        validator: function (items: IInvoiceLineItem[]) {
          return items && items.length > 0;
        },
        message: "Invoice must have at least one line item",
      },
    },
    subtotal: {
      type: Number,
      required: false,
      default: 0,
      min: [0, "Subtotal cannot be negative"],
    },
    taxRate: {
      type: Number,
      required: [true, "Tax rate is required"],
      min: [0, "Tax rate cannot be negative"],
      default: 0,
    },
    // No schema default on purpose: a default would also be applied to
    // legacy documents when they are loaded and silently change their tax.
    taxBase: {
      type: String,
      enum: ["afterDiscount", "beforeDiscount"],
    },
    taxAmount: {
      type: Number,
      required: false,
      default: 0,
      min: [0, "Tax amount cannot be negative"],
    },
    discount: {
      type: Number,
      required: [true, "Discount is required"],
      min: [0, "Discount cannot be negative"],
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: false,
      default: 0,
      min: [0, "Total amount cannot be negative"],
    },
    amountPaid: {
      type: Number,
      required: [true, "Amount paid is required"],
      min: [0, "Amount paid cannot be negative"],
      default: 0,
    },
    balanceDue: {
      type: Number,
      required: false,
      default: 0,
      min: [0, "Balance due cannot be negative"],
    },
    notes: {
      type: String,
      trim: true,
      default: null,
    },
    terms: {
      type: String,
      trim: true,
      default: null,
    },
    journalEntryId: {
      type: Schema.Types.ObjectId,
      ref: "JournalEntry",
      required: false,
      default: null,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by is required"],
    },
  },
  {
    timestamps: true,
    collection: "invoices",
  },
);

/**
 * Indexes for performance
 */
InvoiceSchema.index({ companyId: 1, invoiceNumber: 1 }, { unique: true });
InvoiceSchema.index({ companyId: 1, customerId: 1 });
InvoiceSchema.index({ companyId: 1, status: 1 });
InvoiceSchema.index({ companyId: 1, invoiceDate: -1 });
InvoiceSchema.index({ companyId: 1, dueDate: 1 });

/**
 * Pre-validate: generate the invoice number (atomic per-company counter).
 */
InvoiceSchema.pre("validate", async function () {
  if (this.isNew && !this.invoiceNumber) {
    const year = (this.invoiceDate ?? new Date()).getFullYear();
    this.invoiceNumber = await nextDocumentNumber({
      model: mongoose.model<IInvoiceDocument>("Invoice"),
      field: "invoiceNumber",
      companyId: this.companyId,
      prefix: `INV-${year}-`,
      pad: 4,
    });
  }
});

/**
 * Pre-validate: recompute amounts from line items and derive the status.
 * Runs before schema validation so min/required checks see final values.
 */
InvoiceSchema.pre("validate", function () {
  applyDocumentTotals(this);
  applyDocumentStatus(this);
});

/**
 * Instance method: Record payment
 */
InvoiceSchema.methods.recordPayment = function (amount: number) {
  if (amount <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }
  if (this.amountPaid + amount > this.totalAmount) {
    throw new Error("Payment amount exceeds balance due");
  }
  this.amountPaid += amount;
  return this.save();
};

/**
 * Instance method: Void invoice
 */
InvoiceSchema.methods.void = function () {
  if (this.status === InvoiceStatus.VOID) {
    throw new Error("Invoice is already void");
  }
  if (this.status === InvoiceStatus.PAID) {
    throw new Error("Cannot void a paid invoice");
  }
  if (this.amountPaid > 0) {
    throw new Error("Cannot void an invoice with payments");
  }
  // The caller saves (inside its transaction).
  this.status = InvoiceStatus.VOID;
  return this;
};

/**
 * Static method: Find invoices by customer
 */
InvoiceSchema.statics.findByCustomer = function (
  customerId: mongoose.Types.ObjectId,
) {
  return this.find({ customerId }).sort({ invoiceDate: -1 });
};

/**
 * Static method: Find invoices by status
 */
InvoiceSchema.statics.findByStatus = function (
  companyId: mongoose.Types.ObjectId,
  status: InvoiceStatus,
) {
  return this.find({ companyId, status }).sort({ invoiceDate: -1 });
};

/**
 * Static method: Find overdue invoices
 */
InvoiceSchema.statics.findOverdue = function (
  companyId: mongoose.Types.ObjectId,
) {
  return this.find({
    companyId,
    status: { $in: OPEN_DOCUMENT_STATUSES },
    dueDate: { $lt: Date.now() },
  }).sort({ dueDate: 1 });
};

/**
 * Export the model
 */
export const Invoice =
  (mongoose.models.Invoice as mongoose.Model<IInvoiceDocument>) ||
  mongoose.model<IInvoiceDocument>("Invoice", InvoiceSchema as any);
