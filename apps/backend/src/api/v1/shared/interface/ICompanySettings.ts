import { Document, Types } from "mongoose";

/**
 * Accounting Method Enum
 */
export enum AccountingMethod {
  ACCRUAL = "Accrual",
  CASH = "Cash",
}

/**
 * General Settings Interface
 */
export interface IGeneralSettings {
  dateFormat: string; // e.g., 'MM/DD/YYYY', 'DD/MM/YYYY'
  timeZone: string; // e.g., 'Asia/Manila'
  language: string; // e.g., 'en', 'fil'
}

/**
 * Accounting Settings Interface
 */
export interface IAccountingSettings {
  accountingMethod: AccountingMethod;
  fiscalYearEnd: string; // e.g., '12-31' for December 31
  baseCurrency: string; // e.g., 'PHP', 'USD'
  decimalPlaces: number; // Number of decimal places for currency
}

/**
 * Invoicing Settings Interface
 */
export interface IInvoicingSettings {
  invoicePrefix: string; // e.g., 'INV'
  invoiceStartNumber: number;
  defaultPaymentTerms: string; // e.g., 'Net 30', 'Due on Receipt'
  defaultTaxRate: number; // Percentage
  showCompanyLogo: boolean;
}

/**
 * Billing Settings Interface
 */
export interface IBillingSettings {
  billPrefix: string;
  billStartNumber: number;
}

/**
 * Reporting Settings Interface
 */
export interface IReportingSettings {
  reportHeaderText: string;
  showLogo: boolean;
  includeFooter: boolean;
  footerText: string;
}

/**
 * Notifications Settings Interface
 */
export interface INotificationsSettings {
  emailNotifications: boolean;
  reminderDays: number[]; // Days before due date to send reminders
  overdueNotifications: boolean;
}

/**
 * Company Settings Interface
 */
export interface ICompanySettings {
  _id: string;
  companyId: Types.ObjectId;
  general: IGeneralSettings;
  accounting: IAccountingSettings;
  invoicing: IInvoicingSettings;
  billing: IBillingSettings;
  reporting: IReportingSettings;
  notifications: INotificationsSettings;
  updatedAt: Date;
}

/**
 * Company Settings Document (Mongoose)
 */
export interface ICompanySettingsDocument
  extends Omit<ICompanySettings, "_id">,
    Document {}
