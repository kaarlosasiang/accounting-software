import { Document, Types } from "mongoose";

/**
 * Report Type Enum
 */
export enum ReportType {
  BALANCE_SHEET = "Balance Sheet",
  INCOME_STATEMENT = "Income Statement",
  CASH_FLOW = "Cash Flow Statement",
  TRIAL_BALANCE = "Trial Balance",
  GENERAL_LEDGER = "General Ledger",
  ACCOUNTS_RECEIVABLE = "Accounts Receivable",
  ACCOUNTS_PAYABLE = "Accounts Payable",
  INVENTORY_SUMMARY = "Inventory Summary",
  SALES_SUMMARY = "Sales Summary",
  PURCHASE_SUMMARY = "Purchase Summary",
  TAX_SUMMARY = "Tax Summary",
  PROFIT_LOSS = "Profit & Loss",
  CUSTOM = "Custom Report",
}

/**
 * Report Format Enum
 */
export enum ReportFormat {
  PDF = "PDF",
  EXCEL = "Excel",
  CSV = "CSV",
}

/**
 * Report Parameters Interface
 */
export interface IReportParameters {
  startDate: Date;
  endDate: Date;
  accountIds?: Types.ObjectId[];
  [key: string]: any; // Allow additional custom parameters
}

/**
 * Report Interface
 */
export interface IReport {
  _id: string;
  companyId: Types.ObjectId;
  reportName: string;
  reportType: ReportType;
  parameters: IReportParameters;
  generatedData: object; // The actual report data/results
  generatedBy: Types.ObjectId; // User who generated the report
  generatedAt: Date;
  format: ReportFormat;
  filePath: string; // Path to the generated file
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Report Document (Mongoose)
 */
export interface IReportDocument extends Omit<IReport, "_id">, Document {}
