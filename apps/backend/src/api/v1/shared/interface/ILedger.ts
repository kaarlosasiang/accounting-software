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
  debit: number; // Legacy rows may still hold numeric strings
  credit: number; // Legacy rows may still hold numeric strings
  /**
   * Balance after this row at insertion time. Informational only: it goes
   * stale when entries are back-dated, so balances must be computed by
   * aggregating debit/credit instead.
   */
  runningBalance: number;
  entryType?: number; // Denormalized JournalEntryType
  isClosingEntry?: boolean; // Denormalized from the journal entry
  createdAt: Date;
}

/**
 * Ledger Document (Mongoose)
 */
export interface ILedgerDocument extends Omit<ILedger, "_id">, Document {}
