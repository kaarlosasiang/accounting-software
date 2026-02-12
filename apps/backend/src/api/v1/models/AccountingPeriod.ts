import { model, Schema } from "mongoose";
import {
  IAccountingPeriod,
  PeriodStatus,
  PeriodType,
} from "../shared/interface/IAccountingPeriod.js";

/**
 * AccountingPeriod Schema
 * Manages fiscal periods for locking and closing
 */
const AccountingPeriodSchema = new Schema<IAccountingPeriod>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      required: [true, "Company ID is required"],
      ref: "Company",
      index: true,
    },
    periodName: {
      type: String,
      required: [true, "Period name is required"],
      trim: true,
      maxlength: [100, "Period name cannot exceed 100 characters"],
      // e.g., "January 2026", "Q1 2026", "FY 2026"
    },
    periodType: {
      type: String,
      required: [true, "Period type is required"],
      enum: {
        values: Object.values(PeriodType),
        message: "{VALUE} is not a valid period type",
      },
    },
    fiscalYear: {
      type: Number,
      required: [true, "Fiscal year is required"],
      min: [1900, "Fiscal year must be 1900 or later"],
      max: [2100, "Fiscal year must be 2100 or earlier"],
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: {
        values: Object.values(PeriodStatus),
        message: "{VALUE} is not a valid period status",
      },
      default: PeriodStatus.OPEN,
    },
    closedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    closingJournalEntryId: {
      type: Schema.Types.ObjectId,
      ref: "JournalEntry",
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
AccountingPeriodSchema.index({ companyId: 1, fiscalYear: 1 });
AccountingPeriodSchema.index({ companyId: 1, status: 1 });
AccountingPeriodSchema.index({ companyId: 1, startDate: 1, endDate: 1 });

// Unique constraint: One period per company per date range
AccountingPeriodSchema.index(
  { companyId: 1, startDate: 1, endDate: 1 },
  { unique: true },
);

/**
 * Pre-save validation: Ensure endDate is after startDate
 */
AccountingPeriodSchema.pre("save", function () {
  if (this.endDate <= this.startDate) {
    throw new Error("End date must be after start date");
  }
});

/**
 * Instance method: Check if a date falls within this period
 */
AccountingPeriodSchema.methods.containsDate = function (date: Date): boolean {
  return date >= this.startDate && date <= this.endDate;
};

/**
 * Instance method: Check if period can be closed
 */
AccountingPeriodSchema.methods.canBeClosed = function (): boolean {
  return this.status === PeriodStatus.OPEN;
};

/**
 * Instance method: Check if period can be reopened
 */
AccountingPeriodSchema.methods.canBeReopened = function (): boolean {
  return this.status === PeriodStatus.CLOSED;
};

/**
 * Static method: Find period containing a specific date
 */
AccountingPeriodSchema.statics.findPeriodForDate = async function (
  companyId: string,
  date: Date,
) {
  return this.findOne({
    companyId,
    startDate: { $lte: date },
    endDate: { $gte: date },
  });
};

/**
 * Static method: Get all open periods for a company
 */
AccountingPeriodSchema.statics.getOpenPeriods = async function (
  companyId: string,
) {
  return this.find({
    companyId,
    status: PeriodStatus.OPEN,
  }).sort({ startDate: 1 });
};

export const AccountingPeriod = model<IAccountingPeriod>(
  "AccountingPeriod",
  AccountingPeriodSchema,
);
