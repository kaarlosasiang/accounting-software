import mongoose, { Schema } from "mongoose";

import {
  IInvoice,
  IInvoiceDocument,
  IInvoiceLineItem,
  InvoiceStatus,
} from "../shared/interface/IInvoice";

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
      unique: true,
      index: true,
    },
    invoiceDate: {
      type: Date,
      default: null,
    },
    dueDate: {
      type: Number,
      required: [true, "Due date is required"],
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
    discount: {
      type: Number,
      required: [true, "Discount is required"],
      min: [0, "Discount cannot be negative"],
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
    terms: {
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
    collection: "invoices",
  },
);

/**
 * Indexes for performance
 */
InvoiceSchema.index({ companyId: 1, customerId: 1 });
InvoiceSchema.index({ companyId: 1, status: 1 });
InvoiceSchema.index({ companyId: 1, invoiceDate: -1 });
InvoiceSchema.index({ companyId: 1, dueDate: 1 });

/**
 * Pre-save: Calculate amounts from line items
 */
InvoiceSchema.pre("save", function () {
  // Calculate subtotal from line items
  this.subtotal = this.lineItems.reduce((sum, item) => {
    item.amount = item.quantity * item.unitPrice;
    return sum + item.amount;
  }, 0);

  // Calculate tax amount
  this.taxAmount = (this.subtotal * this.taxRate) / 100;

  // Calculate total amount
  this.totalAmount = this.subtotal + this.taxAmount - this.discount;

  // Calculate balance due
  this.balanceDue = new Date(this.totalAmount - this.amountPaid);
});

/**
 * Pre-save: Auto-update status based on payment
 */
InvoiceSchema.pre("save", function () {
  if (this.status === InvoiceStatus.VOID) return;

  const tolerance = 0.01;

  if (Math.abs(this.balanceDue.getTime()) < tolerance) {
    this.status = InvoiceStatus.PAID;
  } else if (this.amountPaid > 0 && this.amountPaid < this.totalAmount) {
    this.status = InvoiceStatus.PARTIAL;
  } else if (this.dueDate < Date.now() && this.balanceDue.getTime() > 0) {
    this.status = InvoiceStatus.OVERDUE;
  }
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
  if (this.status === InvoiceStatus.PAID) {
    throw new Error("Cannot void a paid invoice");
  }
  if (this.amountPaid > 0) {
    throw new Error("Cannot void an invoice with payments");
  }
  this.status = InvoiceStatus.VOID;
  return this.save();
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
    status: { $in: [InvoiceStatus.SENT, InvoiceStatus.PARTIAL] },
    dueDate: { $lt: Date.now() },
  }).sort({ dueDate: 1 });
};

/**
 * Export the model
 */
export const Invoice =
  (mongoose.models.Invoice as mongoose.Model<IInvoiceDocument>) ||
  mongoose.model<IInvoiceDocument>("Invoice", InvoiceSchema as any);
