import { Document, Types } from "mongoose";

/**
 * Journal Entry Line Item
 * Represents individual debit/credit entries in a journal entry
 */
export interface IJournalEntryLine {
  accountId: Types.ObjectId; // Reference to Account
  accountCode: string; // Denormalized for quick access
  accountName: string; // Denormalized for quick access
  debit: number; // Default: 0
  credit: number; // Default: 0
  description: string;
}

/**
 * Journal Entry Types
 */
export enum JournalEntryType {
  MANUAL = 1,
  AUTO_INVOICE = 2,
  AUTO_PAYMENT = 3,
  AUTO_BILL = 4,
}

/**
 * Journal Entry Status
 */
export enum JournalEntryStatus {
  DRAFT = "Draft",
  POSTED = "Posted",
  VOID = "Void",
}

/**
 * Journal Entry Document Interface
 */
export interface IJournalEntry {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  entryNumber: string; // Auto-generated, e.g., 'JE-2025-001'
  entryDate: Date;
  referenceNumber?: string; // Optional reference number
  description?: string;
  entryType: JournalEntryType;
  status: JournalEntryStatus;
  lines: IJournalEntryLine[]; // Array of line items
  totalDebit: number; // Must equal totalCredit
  totalCredit: number; // Must equal totalDebit
  postedBy?: Types.ObjectId; // User who posted the entry
  createdBy: Types.ObjectId;
  voidedAt?: Date;
  voidedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Journal Entry Document (Mongoose)
 */
export interface IJournalEntryDocument
  extends Omit<IJournalEntry, "_id">,
    Document {}
