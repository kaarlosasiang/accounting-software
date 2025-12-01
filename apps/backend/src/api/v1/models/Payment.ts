import mongoose, { Schema } from "mongoose";

import {
  IPayment,
  IPaymentDocument,
  PaymentMethod,
  PaymentType,
} from "../shared/interface/IPayment";

/**
 * Payment Schema
 */
const PaymentSchema = new Schema<IPayment>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company ID is required"],
      index: true,
    },
    paymentNumber: {
      type: String,
      required: [true, "Payment number is required"],
      trim: true,
      unique: true,
      index: true,
    },
    paymentDate: {
      type: Date,
      required: [true, "Payment date is required"],
      index: true,
    },
    paymentType: {
      type: String,
      required: [true, "Payment type is required"],
      enum: {
        values: Object.values(PaymentType),
        message: "Invalid payment type",
      },
      index: true,
    },
    paymentMethod: {
      type: String,
      required: [true, "Payment method is required"],
      enum: {
        values: Object.values(PaymentMethod),
        message: "Invalid payment method",
      },
    },
    referenceNumber: {
      type: String,
      required: [true, "Reference number is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer ID is required"],
      index: true,
    },
    invoiceIds: {
      type: [Schema.Types.ObjectId],
      ref: "Invoice",
      required: [true, "At least one invoice is required"],
      validate: {
        validator: function (ids: mongoose.Types.ObjectId[]) {
          return ids && ids.length > 0;
        },
        message: "Payment must be applied to at least one invoice",
      },
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      default: null,
      index: true,
    },
    billIds: {
      type: [Schema.Types.ObjectId],
      ref: "Bill",
      required: [true, "Bill IDs is required"],
      default: [],
    },
    bankAccountId: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: [true, "Bank account ID is required"],
      index: true,
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
    collection: "payments",
  },
);

/**
 * Indexes for performance
 */
PaymentSchema.index({ companyId: 1, paymentType: 1 });
PaymentSchema.index({ companyId: 1, customerId: 1 });
PaymentSchema.index({ companyId: 1, supplierId: 1 });
PaymentSchema.index({ companyId: 1, paymentDate: -1 });
PaymentSchema.index({ companyId: 1, paymentNumber: 1 });

/**
 * Pre-save validation: Ensure correct type-specific fields
 */
PaymentSchema.pre("save", function () {
  if (this.paymentType === PaymentType.RECEIVED) {
    // Payment received: must have customerId and invoiceIds
    if (!this.customerId) {
      throw new Error("Customer ID is required for received payments");
    }
    if (!this.invoiceIds || this.invoiceIds.length === 0) {
      throw new Error("At least one invoice is required for received payments");
    }
  } else if (this.paymentType === PaymentType.MADE) {
    // Payment made: must have supplierId and billIds
    if (!this.supplierId) {
      throw new Error("Supplier ID is required for made payments");
    }
    if (!this.billIds || this.billIds.length === 0) {
      throw new Error("At least one bill is required for made payments");
    }
  }
});

/**
 * Pre-save hook: Generate payment number if not provided
 */
PaymentSchema.pre("save", async function () {
  if (this.isNew && !this.paymentNumber) {
    const year = new Date().getFullYear();
    const typePrefix =
      this.paymentType === PaymentType.RECEIVED ? "PMT-RCV" : "PMT-MADE";
    const prefix = `${typePrefix}-${year}-`;

    // Find the last payment number for this year and type
    const lastPayment = await mongoose
      .model<IPaymentDocument>("Payment")
      .findOne({
        companyId: this.companyId,
        paymentType: this.paymentType,
        paymentNumber: new RegExp(`^${prefix}`),
      })
      .sort({ paymentNumber: -1 })
      .select("paymentNumber");

    let nextNumber = 1;
    if (lastPayment && lastPayment.paymentNumber) {
      const lastNumberStr = lastPayment.paymentNumber.replace(prefix, "");
      const lastNumber = parseInt(lastNumberStr, 10);
      nextNumber = lastNumber + 1;
    }

    this.paymentNumber = `${prefix}${nextNumber.toString().padStart(4, "0")}`;
  }
});

/**
 * Static method: Find payments by customer
 */
PaymentSchema.statics.findByCustomer = function (
  customerId: mongoose.Types.ObjectId,
) {
  return this.find({
    customerId,
    paymentType: PaymentType.RECEIVED,
  }).sort({ paymentDate: -1 });
};

/**
 * Static method: Find payments by supplier
 */
PaymentSchema.statics.findBySupplier = function (
  supplierId: mongoose.Types.ObjectId,
) {
  return this.find({
    supplierId,
    paymentType: PaymentType.MADE,
  }).sort({ paymentDate: -1 });
};

/**
 * Static method: Find payments by type
 */
PaymentSchema.statics.findByType = function (
  companyId: mongoose.Types.ObjectId,
  paymentType: PaymentType,
) {
  return this.find({ companyId, paymentType }).sort({ paymentDate: -1 });
};

/**
 * Static method: Find payments by date range
 */
PaymentSchema.statics.findByDateRange = function (
  companyId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date,
) {
  return this.find({
    companyId,
    paymentDate: { $gte: startDate, $lte: endDate },
  }).sort({ paymentDate: -1 });
};

/**
 * Static method: Get total received payments for a period
 */
PaymentSchema.statics.getTotalReceived = async function (
  companyId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date,
) {
  const result = await this.aggregate([
    {
      $match: {
        companyId,
        paymentType: PaymentType.RECEIVED,
        paymentDate: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" },
      },
    },
  ]);

  return result.length > 0 ? result[0].total : 0;
};

/**
 * Static method: Get total made payments for a period
 */
PaymentSchema.statics.getTotalMade = async function (
  companyId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date,
) {
  const result = await this.aggregate([
    {
      $match: {
        companyId,
        paymentType: PaymentType.MADE,
        paymentDate: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" },
      },
    },
  ]);

  return result.length > 0 ? result[0].total : 0;
};

/**
 * Export the model
 */
export const Payment =
  (mongoose.models.Payment as mongoose.Model<IPaymentDocument>) ||
  mongoose.model<IPaymentDocument>("Payment", PaymentSchema as any);
