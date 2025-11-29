import { Document, Types } from "mongoose";

/**
 * Ledger Entry Document Interface
 * Represents individual transactions in the general ledger
 */
export interface ILedger {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  accountId: Types.ObjectId;
  accountName: string; // Denormalized for quick access
  journalEntryId: Types.ObjectId;
  entryNumber: string; // Denormalized journal entry number
  transactionDate: Date;
  description: string;
  debit: string; // Stored as string to preserve precision
  credit: string; // Stored as string to preserve precision
  runningBalance: number;
  createdAt: Date;
}

/**
 * Ledger Document (Mongoose)
 */
export interface ILedgerDocument extends Omit<ILedger, "_id">, Document {}
