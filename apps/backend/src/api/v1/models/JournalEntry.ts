import mongoose, { Schema } from "mongoose";

import {
  IJournalEntry,
  IJournalEntryDocument,
  IJournalEntryLine,
  JournalEntryStatus,
  JournalEntryType,
} from "../shared/interface/IJournalEntry";

/**
 * Journal Entry Line Item Schema
 */
const JournalEntryLineSchema = new Schema<IJournalEntryLine>(
  {
    accountId: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: [true, "Account ID is required"],
    },
    accountCode: {
      type: String,
      required: [true, "Account code is required"],
      trim: true,
    },
    accountName: {
      type: String,
      required: [true, "Account name is required"],
      trim: true,
    },
    debit: {
      type: Number,
      default: 0,
      min: [0, "Debit cannot be negative"],
    },
    credit: {
      type: Number,
      default: 0,
      min: [0, "Credit cannot be negative"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false },
);

/**
 * Journal Entry Schema
 */
const JournalEntrySchema = new Schema<IJournalEntry>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company ID is required"],
      index: true,
    },
    entryNumber: {
      type: String,
      required: [true, "Entry number is required"],
      trim: true,
      unique: true,
      index: true,
    },
    entryDate: {
      type: Date,
      required: [true, "Entry date is required"],
      index: true,
    },
    referenceNumber: {
      type: String,
      trim: true,
      default: null,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    entryType: {
      type: Number,
      required: [true, "Entry type is required"],
      enum: {
        values: Object.values(JournalEntryType).filter(
          (v) => typeof v === "number",
        ),
        message: "Invalid entry type",
      },
      index: true,
    },
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: {
        values: Object.values(JournalEntryStatus),
        message: "Invalid status",
      },
      default: JournalEntryStatus.DRAFT,
      index: true,
    },
    lines: {
      type: [JournalEntryLineSchema],
      required: [true, "At least one line item is required"],
      validate: {
        validator: function (lines: IJournalEntryLine[]) {
          return lines && lines.length > 0;
        },
        message: "Journal entry must have at least one line item",
      },
    },
    totalDebit: {
      type: Number,
      required: [true, "Total debit is required"],
      min: [0, "Total debit cannot be negative"],
    },
    totalCredit: {
      type: Number,
      required: [true, "Total credit is required"],
      min: [0, "Total credit cannot be negative"],
    },
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by is required"],
    },
    voidedAt: {
      type: Date,
      default: null,
    },
    voidedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "journalEntries",
  },
);

/**
 * Indexes for performance
 */
JournalEntrySchema.index({ companyId: 1, entryDate: -1 });
JournalEntrySchema.index({ companyId: 1, status: 1 });
JournalEntrySchema.index({ companyId: 1, entryType: 1 });
JournalEntrySchema.index({ companyId: 1, entryNumber: 1 });

/**
 * Pre-save validation: Ensure debits equal credits
 */
JournalEntrySchema.pre("save", function () {
  // Calculate totals from lines
  this.totalDebit = this.lines.reduce((sum, line) => sum + line.debit, 0);
  this.totalCredit = this.lines.reduce((sum, line) => sum + line.credit, 0);

  // Validate balanced entry
  const tolerance = 0.01; // Allow small rounding differences
  if (Math.abs(this.totalDebit - this.totalCredit) > tolerance) {
    throw new Error(
      `Journal entry must be balanced. Total Debit: ${this.totalDebit}, Total Credit: ${this.totalCredit}`,
    );
  }

  // Validate that each line has either debit or credit, not both
  for (const line of this.lines) {
    if (line.debit > 0 && line.credit > 0) {
      throw new Error(
        "A line item cannot have both debit and credit amounts. One must be zero.",
      );
    }
    if (line.debit === 0 && line.credit === 0) {
      throw new Error(
        "A line item must have either a debit or credit amount greater than zero.",
      );
    }
  }
});

/**
 * Pre-save hook: Generate entry number if not provided
 */
JournalEntrySchema.pre("save", async function () {
  if (this.isNew && !this.entryNumber) {
    const year = new Date().getFullYear();
    const prefix = `JE-${year}-`;

    // Find the last entry number for this year
    const lastEntry = await mongoose
      .model<IJournalEntryDocument>("JournalEntry")
      .findOne({
        companyId: this.companyId,
        entryNumber: new RegExp(`^${prefix}`),
      })
      .sort({ entryNumber: -1 })
      .select("entryNumber");

    let nextNumber = 1;
    if (lastEntry && lastEntry.entryNumber) {
      const lastNumberStr = lastEntry.entryNumber.replace(prefix, "");
      const lastNumber = parseInt(lastNumberStr, 10);
      nextNumber = lastNumber + 1;
    }

    this.entryNumber = `${prefix}${nextNumber.toString().padStart(3, "0")}`;
  }
});

/**
 * Instance method: Post the journal entry
 */
JournalEntrySchema.methods.post = function (userId: mongoose.Types.ObjectId) {
  if (this.status !== JournalEntryStatus.DRAFT) {
    throw new Error("Only draft entries can be posted");
  }
  this.status = JournalEntryStatus.POSTED;
  this.postedBy = userId;
  return this.save();
};

/**
 * Instance method: Void the journal entry
 */
JournalEntrySchema.methods.void = function (userId: mongoose.Types.ObjectId) {
  if (this.status !== JournalEntryStatus.POSTED) {
    throw new Error("Only posted entries can be voided");
  }
  this.status = JournalEntryStatus.VOID;
  this.voidedAt = new Date();
  this.voidedBy = userId;
  return this.save();
};

/**
 * Static method: Get entries by company and date range
 */
JournalEntrySchema.statics.findByDateRange = function (
  companyId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date,
) {
  return this.find({
    companyId,
    entryDate: { $gte: startDate, $lte: endDate },
  }).sort({ entryDate: -1, entryNumber: -1 });
};

/**
 * Static method: Get entries by status
 */
JournalEntrySchema.statics.findByStatus = function (
  companyId: mongoose.Types.ObjectId,
  status: JournalEntryStatus,
) {
  return this.find({ companyId, status }).sort({
    entryDate: -1,
    entryNumber: -1,
  });
};

/**
 * Export the model
 */
export const JournalEntry =
  (mongoose.models.JournalEntry as mongoose.Model<IJournalEntryDocument>) ||
  mongoose.model<IJournalEntryDocument>(
    "JournalEntry",
    JournalEntrySchema as any,
  );
