import mongoose, { Schema } from "mongoose";

import {
  applyDocumentStatus,
  applyDocumentTotals,
  OPEN_DOCUMENT_STATUSES,
} from "../shared/helpers/documentTotals.js";
import {
  BillStatus,
  IBill,
  IBillDocument,
  IBillLineItem,
} from "../shared/interface/IBill.js";

import { nextDocumentNumber } from "./Counter.js";

/**
 * Bill Line Item Schema
 */
const BillLineItemSchema = new Schema<IBillLineItem>(
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
 * Bill Schema
 */
const BillSchema = new Schema<IBill>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company ID is required"],
      index: true,
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      required: [true, "Supplier ID is required"],
      index: true,
    },
    billNumber: {
      type: String,
      required: [true, "Bill number is required"],
      trim: true,
    },
    billDate: {
      type: Date,
      default: () => new Date(),
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
        values: Object.values(BillStatus),
        message: "Invalid status",
      },
      default: BillStatus.DRAFT,
      index: true,
    },
    lineItems: {
      type: [BillLineItemSchema],
      required: [true, "At least one line item is required"],
      validate: {
        validator: function (items: IBillLineItem[]) {
          return items && items.length > 0;
        },
        message: "Bill must have at least one line item",
      },
    },
    subtotal: {
      type: Number,
      required: [true, "Subtotal is required"],
      min: [0, "Subtotal cannot be negative"],
    },
    taxRate: {
      type: Number,
      required: [true, "Tax rate is required"],
      min: [0, "Tax rate cannot be negative"],
      default: 0,
    },
    taxAmount: {
      type: Number,
      required: [true, "Tax amount is required"],
      min: [0, "Tax amount cannot be negative"],
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
    },
    discount: {
      type: Number,
      required: [true, "Discount is required"],
      min: [0, "Discount cannot be negative"],
      default: 0,
    },
    amountPaid: {
      type: Number,
      required: [true, "Amount paid is required"],
      min: [0, "Amount paid cannot be negative"],
      default: 0,
    },
    balanceDue: {
      type: Number,
      required: [true, "Balance due is required"],
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
    collection: "bills",
  },
);

/**
 * Indexes for performance
 */
BillSchema.index({ companyId: 1, supplierId: 1 });
BillSchema.index({ companyId: 1, status: 1 });
BillSchema.index({ companyId: 1, dueDate: 1 });
BillSchema.index({ companyId: 1, billNumber: 1 }, { unique: true });

/**
 * Pre-validate hook: Generate bill number (atomic per-company counter).
 */
BillSchema.pre("validate", async function () {
  if (this.isNew && !this.billNumber) {
    const year = (this.billDate ?? new Date()).getFullYear();
    this.billNumber = await nextDocumentNumber({
      model: mongoose.model<IBillDocument>("Bill"),
      field: "billNumber",
      companyId: this.companyId,
      prefix: `BILL-${year}-`,
      pad: 4,
    });
  }
});

/**
 * Pre-validate: recompute amounts from line items and derive the status.
 * Server-side totals are authoritative (client-supplied totals are ignored).
 */
BillSchema.pre("validate", function () {
  applyDocumentTotals(this);
  applyDocumentStatus(this);
});

/**
 * Instance method: Record payment
 */
BillSchema.methods.recordPayment = function (amount: number) {
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
 * Instance method: Void bill
 */
BillSchema.methods.void = function () {
  if (this.status === BillStatus.VOID) {
    throw new Error("Bill is already void");
  }
  if (this.status === BillStatus.PAID) {
    throw new Error("Cannot void a paid bill");
  }
  if (this.amountPaid > 0) {
    throw new Error("Cannot void a bill with payments");
  }
  // The caller saves (inside its transaction).
  this.status = BillStatus.VOID;
  return this;
};

/**
 * Static method: Find bills by supplier
 */
BillSchema.statics.findBySupplier = function (
  supplierId: mongoose.Types.ObjectId,
) {
  return this.find({ supplierId }).sort({ dueDate: -1 });
};

/**
 * Static method: Find bills by status
 */
BillSchema.statics.findByStatus = function (
  companyId: mongoose.Types.ObjectId,
  status: BillStatus,
) {
  return this.find({ companyId, status }).sort({ dueDate: -1 });
};

/**
 * Static method: Find overdue bills
 */
BillSchema.statics.findOverdue = function (companyId: mongoose.Types.ObjectId) {
  return this.find({
    companyId,
    status: { $in: OPEN_DOCUMENT_STATUSES },
    dueDate: { $lt: new Date() },
  }).sort({ dueDate: 1 });
};

/**
 * Export the model
 */
export const Bill =
  (mongoose.models.Bill as mongoose.Model<IBillDocument>) ||
  mongoose.model<IBillDocument>("Bill", BillSchema as any);
