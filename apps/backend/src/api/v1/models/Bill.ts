import mongoose, { Schema } from "mongoose";

import {
  BillStatus,
  IBill,
  IBillDocument,
  IBillLineItem,
} from "../shared/interface/IBill";

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
      type: Number,
      required: [true, "Bill number is required"],
      index: true,
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
    amountPaid: {
      type: Number,
      required: [true, "Amount paid is required"],
      min: [0, "Amount paid cannot be negative"],
      default: 0,
    },
    balanceDue: {
      type: Date,
      required: [true, "Balance due is required"],
    },
    notes: {
      type: String,
      trim: true,
      default: null,
    },
    journalEntryId: {
      type: Schema.Types.ObjectId,
      ref: "JournalEntry",
      required: [true, "Journal entry ID is required"],
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
 * Pre-save: Calculate amounts from line items
 */
BillSchema.pre("save", function () {
  // Calculate subtotal from line items
  this.subtotal = this.lineItems.reduce((sum, item) => {
    item.amount = item.quantity * item.unitPrice;
    return sum + item.amount;
  }, 0);

  // Calculate tax amount
  this.taxAmount = (this.subtotal * this.taxRate) / 100;

  // Calculate total amount
  this.totalAmount = this.subtotal + this.taxAmount;

  // Calculate balance due
  this.balanceDue = new Date(this.totalAmount - this.amountPaid);
});

/**
 * Pre-save: Auto-update status based on payment
 */
BillSchema.pre("save", function () {
  if (this.status === BillStatus.VOID) return;

  const tolerance = 0.01;

  if (Math.abs(this.balanceDue.getTime()) < tolerance) {
    this.status = BillStatus.PAID;
  } else if (this.amountPaid > 0 && this.amountPaid < this.totalAmount) {
    this.status = BillStatus.PARTIAL;
  } else if (this.dueDate < new Date() && this.balanceDue.getTime() > 0) {
    this.status = BillStatus.OVERDUE;
  }
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
  if (this.status === BillStatus.PAID) {
    throw new Error("Cannot void a paid bill");
  }
  if (this.amountPaid > 0) {
    throw new Error("Cannot void a bill with payments");
  }
  this.status = BillStatus.VOID;
  return this.save();
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
    status: { $in: [BillStatus.OPEN, BillStatus.PARTIAL] },
    dueDate: { $lt: new Date() },
  }).sort({ dueDate: 1 });
};

/**
 * Export the model
 */
export const Bill =
  (mongoose.models.Bill as mongoose.Model<IBillDocument>) ||
  mongoose.model<IBillDocument>("Bill", BillSchema as any);
