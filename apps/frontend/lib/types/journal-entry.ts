/**
 * Journal Entry Types
 */
export enum JournalEntryType {
  MANUAL = 1,
  AUTO_INVOICE = 2,
  AUTO_PAYMENT = 3,
  AUTO_BILL = 4,
}

export enum JournalEntryStatus {
  DRAFT = "Draft",
  POSTED = "Posted",
  VOID = "Void",
}

export interface JournalEntryLine {
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface JournalEntry {
  _id: string;
  companyId: string;
  entryNumber: string;
  entryDate: string;
  referenceNumber?: string;
  description?: string;
  entryType: JournalEntryType;
  status: JournalEntryStatus;
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  postedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  voidedAt?: string;
  voidedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateJournalEntryInput {
  entryDate: string;
  referenceNumber?: string;
  description?: string;
  lines: JournalEntryLine[];
}

export interface UpdateJournalEntryInput {
  entryDate?: string;
  referenceNumber?: string;
  description?: string;
  lines?: JournalEntryLine[];
}

/**
 * Ledger Types
 */
export interface LedgerEntry {
  _id: string;
  companyId: string;
  accountId: string;
  accountName: string;
  journalEntryId: string;
  entryNumber: string;
  transactionDate: string;
  description: string;
  debit: string;
  credit: string;
  runningBalance: number;
  createdAt: string;
}

export interface AccountLedger {
  account: {
    _id: string;
    accountCode: string;
    accountName: string;
    accountType: string;
    subType?: string;
  };
  entries: LedgerEntry[];
  summary: {
    totalDebit: number;
    totalCredit: number;
    currentBalance: number;
    entryCount: number;
  };
}

export interface GeneralLedgerAccount {
  account: {
    _id: string;
    accountCode: string;
    accountName: string;
    accountType: string;
  };
  entries: LedgerEntry[];
  summary: {
    totalDebit: number;
    totalCredit: number;
    balance: number;
    entryCount: number;
  };
}

export interface AccountBalance {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  balance: number;
  asOfDate: string;
}

export interface TrialBalanceAccount {
  accountCode: string;
  accountName: string;
  accountType: string;
  debit: number;
  credit: number;
}

export interface TrialBalance {
  asOfDate: string;
  accounts: TrialBalanceAccount[];
  totals: {
    debits: number;
    credits: number;
    difference: number;
    balanced: boolean;
  };
}
