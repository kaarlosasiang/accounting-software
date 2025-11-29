import mongoose, { Schema } from "mongoose";

import { ILedger, ILedgerDocument } from "../shared/interface/ILedger";

/**
 * Ledger Schema
 * Represents individual transactions in the general ledger
 */
const LedgerSchema = new Schema<ILedger>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company ID is required"],
      index: true,
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: [true, "Account ID is required"],
      index: true,
    },
    accountName: {
      type: String,
      required: [true, "Account name is required"],
      trim: true,
    },
    journalEntryId: {
      type: Schema.Types.ObjectId,
      ref: "JournalEntry",
      required: [true, "Journal entry ID is required"],
      index: true,
    },
    entryNumber: {
      type: String,
      required: [true, "Entry number is required"],
      trim: true,
      index: true,
    },
    transactionDate: {
      type: Date,
      required: [true, "Transaction date is required"],
      index: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    debit: {
      type: String,
      required: [true, "Debit is required"],
      default: "0",
    },
    credit: {
      type: String,
      required: [true, "Credit is required"],
      default: "0",
    },
    runningBalance: {
      type: Number,
      required: [true, "Running balance is required"],
      default: 0,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "ledgers",
  },
);

/**
 * Indexes for performance
 */
LedgerSchema.index({ companyId: 1, accountId: 1, transactionDate: -1 });
LedgerSchema.index({ companyId: 1, journalEntryId: 1 });
LedgerSchema.index({ companyId: 1, transactionDate: -1 });
LedgerSchema.index({ accountId: 1, transactionDate: 1 }); // For running balance calculation

/**
 * Static method: Get ledger entries by account and date range
 */
LedgerSchema.statics.findByAccountAndDateRange = function (
  accountId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date,
) {
  return this.find({
    accountId,
    transactionDate: { $gte: startDate, $lte: endDate },
  }).sort({ transactionDate: 1, createdAt: 1 });
};

/**
 * Static method: Get ledger entries by journal entry
 */
LedgerSchema.statics.findByJournalEntry = function (
  journalEntryId: mongoose.Types.ObjectId,
) {
  return this.find({ journalEntryId }).sort({ accountId: 1 });
};

/**
 * Static method: Calculate running balance for an account up to a date
 */
LedgerSchema.statics.calculateRunningBalance = async function (
  accountId: mongoose.Types.ObjectId,
  upToDate: Date,
) {
  const result = await this.aggregate([
    {
      $match: {
        accountId,
        transactionDate: { $lte: upToDate },
      },
    },
    {
      $group: {
        _id: null,
        totalDebit: { $sum: { $toDouble: "$debit" } },
        totalCredit: { $sum: { $toDouble: "$credit" } },
      },
    },
  ]);

  if (result.length === 0) {
    return 0;
  }

  const { totalDebit, totalCredit } = result[0];
  return totalDebit - totalCredit;
};

/**
 * Static method: Get account balance
 */
LedgerSchema.statics.getAccountBalance = function (
  accountId: mongoose.Types.ObjectId,
) {
  return this.findOne({ accountId })
    .sort({ transactionDate: -1, createdAt: -1 })
    .select("runningBalance")
    .then((doc: ILedgerDocument | null) => (doc ? doc.runningBalance : 0));
};

/**
 * Export the model
 */
export const Ledger =
  (mongoose.models.Ledger as mongoose.Model<ILedgerDocument>) ||
  mongoose.model<ILedgerDocument>("Ledger", LedgerSchema as any);
