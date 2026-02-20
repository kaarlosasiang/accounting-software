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
  nextSequenceNumber?: number; // Current sequence counter (internal use)
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
  nextSequenceNumber?: number; // Current sequence counter (internal use)
}

/**
 * Payment Settings Interface
 */
export interface IPaymentSettings {
  paymentPrefix?: string; // e.g., 'PAY', default: 'PAY'
  paymentStartNumber?: number; // default: 1
  nextSequenceNumber?: number; // Current sequence counter (internal use)
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
 * Bank Account Info
 * For record-keeping purposes (not actual bank connection)
 */
export interface IBankAccountInfo {
  id: string; // Unique identifier
  bankName: string;
  accountName: string;
  accountNumber: string; // Can be partially masked
  accountType: "Checking" | "Savings" | "Credit Card" | "Other";
  currency: string; // e.g., 'PHP', 'USD'
  linkedAccountId?: Types.ObjectId; // Reference to Account in Chart of Accounts
  isActive: boolean;
  notes?: string;
}

/**
 * Banking Settings Interface
 */
export interface IBankingSettings {
  accounts: IBankAccountInfo[];
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
  payment: IPaymentSettings;
  banking: IBankingSettings;
  reporting: IReportingSettings;
  notifications: INotificationsSettings;
  updatedAt: Date;
}

/**
 * Company Settings Document (Mongoose)
 */
export interface ICompanySettingsDocument
  extends Omit<ICompanySettings, "_id">, Document {
  // Instance methods
  updateGeneralSettings(settings: Partial<IGeneralSettings>): Promise<this>;
  updateAccountingSettings(
    settings: Partial<IAccountingSettings>,
  ): Promise<this>;
  updateInvoicingSettings(settings: Partial<IInvoicingSettings>): Promise<this>;
  updateBillingSettings(settings: Partial<IBillingSettings>): Promise<this>;
  updateReportingSettings(settings: Partial<IReportingSettings>): Promise<this>;
  updateNotificationsSettings(
    settings: Partial<INotificationsSettings>,
  ): Promise<this>;
  addBankAccount(bankAccount: IBankAccountInfo): Promise<this>;
  updateBankAccount(
    accountId: string,
    updates: Partial<IBankAccountInfo>,
  ): Promise<this>;
  removeBankAccount(accountId: string): Promise<this>;
  getBankAccount(accountId: string): IBankAccountInfo | undefined;
}
