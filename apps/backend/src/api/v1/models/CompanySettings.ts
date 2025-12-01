import mongoose, { Schema } from "mongoose";

import {
  AccountingMethod,
  IAccountingSettings,
  IBillingSettings,
  ICompanySettings,
  ICompanySettingsDocument,
  IGeneralSettings,
  IInvoicingSettings,
  INotificationsSettings,
  IReportingSettings,
} from "../shared/interface/ICompanySettings";

/**
 * General Settings Schema
 */
const GeneralSettingsSchema = new Schema<IGeneralSettings>(
  {
    dateFormat: {
      type: String,
      required: [true, "Date format is required"],
      default: "MM/DD/YYYY",
    },
    timeZone: {
      type: String,
      required: [true, "Time zone is required"],
      default: "Asia/Manila",
    },
    language: {
      type: String,
      required: [true, "Language is required"],
      default: "en",
    },
  },
  { _id: false },
);

/**
 * Accounting Settings Schema
 */
const AccountingSettingsSchema = new Schema<IAccountingSettings>(
  {
    accountingMethod: {
      type: String,
      required: [true, "Accounting method is required"],
      enum: {
        values: Object.values(AccountingMethod),
        message: "Invalid accounting method",
      },
      default: AccountingMethod.ACCRUAL,
    },
    fiscalYearEnd: {
      type: String,
      required: [true, "Fiscal year end is required"],
      default: "12-31",
      validate: {
        validator: function (v: string) {
          return /^\d{2}-\d{2}$/.test(v);
        },
        message: "Fiscal year end must be in MM-DD format",
      },
    },
    baseCurrency: {
      type: String,
      required: [true, "Base currency is required"],
      default: "PHP",
    },
    decimalPlaces: {
      type: Number,
      required: [true, "Decimal places is required"],
      default: 2,
      min: [0, "Decimal places cannot be negative"],
      max: [4, "Decimal places cannot exceed 4"],
    },
  },
  { _id: false },
);

/**
 * Invoicing Settings Schema
 */
const InvoicingSettingsSchema = new Schema<IInvoicingSettings>(
  {
    invoicePrefix: {
      type: String,
      required: [true, "Invoice prefix is required"],
      default: "INV",
      trim: true,
    },
    invoiceStartNumber: {
      type: Number,
      required: [true, "Invoice start number is required"],
      default: 1,
      min: [1, "Invoice start number must be at least 1"],
    },
    defaultPaymentTerms: {
      type: String,
      required: [true, "Default payment terms is required"],
      default: "Net 30",
      trim: true,
    },
    defaultTaxRate: {
      type: Number,
      required: [true, "Default tax rate is required"],
      default: 0,
      min: [0, "Tax rate cannot be negative"],
      max: [100, "Tax rate cannot exceed 100%"],
    },
    showCompanyLogo: {
      type: Boolean,
      required: [true, "Show company logo flag is required"],
      default: true,
    },
  },
  { _id: false },
);

/**
 * Billing Settings Schema
 */
const BillingSettingsSchema = new Schema<IBillingSettings>(
  {
    billPrefix: {
      type: String,
      required: [true, "Bill prefix is required"],
      default: "BILL",
      trim: true,
    },
    billStartNumber: {
      type: Number,
      required: [true, "Bill start number is required"],
      default: 1,
      min: [1, "Bill start number must be at least 1"],
    },
  },
  { _id: false },
);

/**
 * Reporting Settings Schema
 */
const ReportingSettingsSchema = new Schema<IReportingSettings>(
  {
    reportHeaderText: {
      type: String,
      required: [true, "Report header text is required"],
      default: "",
      trim: true,
    },
    showLogo: {
      type: Boolean,
      required: [true, "Show logo flag is required"],
      default: true,
    },
    includeFooter: {
      type: Boolean,
      required: [true, "Include footer flag is required"],
      default: true,
    },
    footerText: {
      type: String,
      required: [true, "Footer text is required"],
      default: "",
      trim: true,
    },
  },
  { _id: false },
);

/**
 * Notifications Settings Schema
 */
const NotificationsSettingsSchema = new Schema<INotificationsSettings>(
  {
    emailNotifications: {
      type: Boolean,
      required: [true, "Email notifications flag is required"],
      default: true,
    },
    reminderDays: {
      type: [Number],
      required: [true, "Reminder days is required"],
      default: [7, 3, 1], // 7 days, 3 days, 1 day before due date
      validate: {
        validator: function (v: number[]) {
          return v.every((day) => day > 0);
        },
        message: "All reminder days must be positive numbers",
      },
    },
    overdueNotifications: {
      type: Boolean,
      required: [true, "Overdue notifications flag is required"],
      default: true,
    },
  },
  { _id: false },
);

/**
 * Company Settings Schema
 */
const CompanySettingsSchema = new Schema<ICompanySettings>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company ID is required"],
      unique: true,
      index: true,
    },
    general: {
      type: GeneralSettingsSchema,
      required: [true, "General settings is required"],
      default: () => ({}),
    },
    accounting: {
      type: AccountingSettingsSchema,
      required: [true, "Accounting settings is required"],
      default: () => ({}),
    },
    invoicing: {
      type: InvoicingSettingsSchema,
      required: [true, "Invoicing settings is required"],
      default: () => ({}),
    },
    billing: {
      type: BillingSettingsSchema,
      required: [true, "Billing settings is required"],
      default: () => ({}),
    },
    reporting: {
      type: ReportingSettingsSchema,
      required: [true, "Reporting settings is required"],
      default: () => ({}),
    },
    notifications: {
      type: NotificationsSettingsSchema,
      required: [true, "Notifications settings is required"],
      default: () => ({}),
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: true }, // Only track updates
    collection: "companySettings",
  },
);

/**
 * Instance method: Update general settings
 */
CompanySettingsSchema.methods.updateGeneralSettings = function (
  settings: Partial<IGeneralSettings>,
) {
  Object.assign(this.general, settings);
  return this.save();
};

/**
 * Instance method: Update accounting settings
 */
CompanySettingsSchema.methods.updateAccountingSettings = function (
  settings: Partial<IAccountingSettings>,
) {
  Object.assign(this.accounting, settings);
  return this.save();
};

/**
 * Instance method: Update invoicing settings
 */
CompanySettingsSchema.methods.updateInvoicingSettings = function (
  settings: Partial<IInvoicingSettings>,
) {
  Object.assign(this.invoicing, settings);
  return this.save();
};

/**
 * Instance method: Update billing settings
 */
CompanySettingsSchema.methods.updateBillingSettings = function (
  settings: Partial<IBillingSettings>,
) {
  Object.assign(this.billing, settings);
  return this.save();
};

/**
 * Instance method: Update reporting settings
 */
CompanySettingsSchema.methods.updateReportingSettings = function (
  settings: Partial<IReportingSettings>,
) {
  Object.assign(this.reporting, settings);
  return this.save();
};

/**
 * Instance method: Update notifications settings
 */
CompanySettingsSchema.methods.updateNotificationsSettings = function (
  settings: Partial<INotificationsSettings>,
) {
  Object.assign(this.notifications, settings);
  return this.save();
};

/**
 * Instance method: Reset to default settings
 */
CompanySettingsSchema.methods.resetToDefaults = function () {
  this.general = {
    dateFormat: "MM/DD/YYYY",
    timeZone: "Asia/Manila",
    language: "en",
  };
  this.accounting = {
    accountingMethod: AccountingMethod.ACCRUAL,
    fiscalYearEnd: "12-31",
    baseCurrency: "PHP",
    decimalPlaces: 2,
  };
  this.invoicing = {
    invoicePrefix: "INV",
    invoiceStartNumber: 1,
    defaultPaymentTerms: "Net 30",
    defaultTaxRate: 0,
    showCompanyLogo: true,
  };
  this.billing = {
    billPrefix: "BILL",
    billStartNumber: 1,
  };
  this.reporting = {
    reportHeaderText: "",
    showLogo: true,
    includeFooter: true,
    footerText: "",
  };
  this.notifications = {
    emailNotifications: true,
    reminderDays: [7, 3, 1],
    overdueNotifications: true,
  };
  return this.save();
};

/**
 * Static method: Find settings by company
 */
CompanySettingsSchema.statics.findByCompany = function (
  companyId: mongoose.Types.ObjectId,
) {
  return this.findOne({ companyId });
};

/**
 * Static method: Get or create settings for company
 */
CompanySettingsSchema.statics.getOrCreate = async function (
  companyId: mongoose.Types.ObjectId,
) {
  let settings = await this.findOne({ companyId });
  if (!settings) {
    settings = await this.create({ companyId });
  }
  return settings;
};

/**
 * Static method: Initialize default settings for company
 */
CompanySettingsSchema.statics.initializeForCompany = function (
  companyId: mongoose.Types.ObjectId,
) {
  return this.create({ companyId });
};

/**
 * Export the model
 */
export const CompanySettings =
  (mongoose.models
    .CompanySettings as mongoose.Model<ICompanySettingsDocument>) ||
  mongoose.model<ICompanySettingsDocument>(
    "CompanySettings",
    CompanySettingsSchema as any,
  );
