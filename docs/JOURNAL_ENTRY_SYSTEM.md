# Journal Entry System Documentation

This document explains the automatic journal entry system implemented for proper double-entry bookkeeping.

## 🎯 **Overview**

The accounting software now features automatic journal entry creation for all financial transactions, ensuring proper double-entry bookkeeping compliance and audit trail maintenance.

## 📚 **Double-Entry Bookkeeping Principles**

### Fundamental Rule
Every financial transaction must affect at least two accounts with equal debits and credits:
```
Total Debits = Total Credits
Assets = Liabilities + Equity + (Revenue - Expenses)
```

### Account Categories
- **Assets** (Debit Normal): Cash, Accounts Receivable, Inventory, Equipment
- **Liabilities** (Credit Normal): Accounts Payable, Sales Tax Payable, Loans
- **Equity** (Credit Normal): Owner's Equity, Retained Earnings  
- **Revenue** (Credit Normal): Sales Revenue, Service Revenue, Interest Income
- **Expenses** (Debit Normal): Cost of Goods Sold, Operating Expenses, Tax Expenses

---

## 🔧 **Journal Entry Service Implementation**

### Service Location
```typescript
// /apps/backend/src/api/v1/services/journalEntryService.ts
export class JournalEntryService {
  static async createInvoiceJournalEntry(invoice, userId)
  static async createBillJournalEntry(bill, userId)  
  static async createPaymentJournalEntry(...)
  static async getDefaultCashAccount(companyId)
  static async getAccountsReceivableAccount(companyId)
  static async getAccountsPayableAccount(companyId)
}
```

### Automatic Account Detection
```typescript
// Finds appropriate accounts using name patterns
const arAccount = await Account.findOne({
  companyId,
  accountType: "Asset",
  $or: [
    { accountName: /Accounts Receivable/i },
    { accountName: /Trade Debtors/i },
    { subType: "Accounts Receivable" }
  ]
});
```

---

## 🧾 **Invoice Journal Entries**

### When Invoice is Sent/Approved
```
Transaction: Invoice INV-2024-001 for $1,150 (Customer: ABC Corp)

Journal Entry:
-----------------------------------------------------------------
Date        | Account               | Debit   | Credit | Description
2024-01-30 | Accounts Receivable   | $1,150  |        | Invoice INV-2024-001 - ABC Corp
2024-01-30 | Sales Revenue        |          | $1,000  | Invoice INV-2024-001 - Sales revenue
2024-01-30 | Sales Tax Payable   |          | $150    | Invoice INV-2024-001 - Sales tax
-----------------------------------------------------------------
Totals:                          | $1,150  | $1,150  | Balanced ✅
```

### Accounting Logic
```typescript
// Debit Accounts Receivable (Asset ↑)
lines.push({
  accountId: arAccount._id,
  accountCode: arAccount.accountCode,
  accountName: arAccount.accountName,
  debit: invoice.totalAmount,
  credit: 0,
  description: `Invoice ${invoice.invoiceNumber} - ${invoice.customerId?.toString() || 'Customer'}`
});

// Credit Sales Revenue (Revenue ↑)
lines.push({
  accountId: salesAccount._id,
  accountCode: salesAccount.accountCode,
  accountName: salesAccount.accountName,
  debit: 0,
  credit: invoice.subtotal,
  description: `Invoice ${invoice.invoiceNumber} - Sales revenue`
});

// Credit Sales Tax Liability (Liability ↑) - if tax applies
if (invoice.taxAmount > 0 && taxAccount) {
  lines.push({
    accountId: taxAccount._id,
    accountCode: taxAccount.accountCode,
    accountName: taxAccount.accountName,
    debit: 0,
    credit: invoice.taxAmount,
    description: `Invoice ${invoice.invoiceNumber} - Sales tax`
  });
}
```

---

## 🧾 **Bill Journal Entries**

### When Bill is Approved
```
Transaction: Bill BILL-2024-001 for $850 (Supplier: XYZ Supplies)

Journal Entry:
-----------------------------------------------------------------
Date        | Account               | Debit   | Credit | Description
2024-01-30 | Operating Expenses   | $850    |        | Bill BILL-2024-001 - Operating expenses
2024-01-30 | Accounts Payable    |         | $850    | Bill BILL-2024-001 - XYZ Supplies
-----------------------------------------------------------------
Totals:                          | $850    | $850    | Balanced ✅
```

### Accounting Logic
```typescript
// Group line items by account for consolidation
const accountGroups = new Map<string, {
  accountId: mongoose.Types.ObjectId;
  accountCode: string;
  accountName: string;
  totalAmount: number;
}>();

// Process each line item
for (const lineItem of bill.lineItems) {
  let account = await Account.findById(lineItem.accountId);
  
  // Use default expense account if no specific account found
  if (!account || account.accountType !== "Expense") {
    account = expenseAccount;
  }
  
  // Consolidate by account
  const key = account._id.toString();
  if (accountGroups.has(key)) {
    accountGroups.get(key)!.totalAmount += lineItem.amount;
  } else {
    accountGroups.set(key, {
      accountId: account._id,
      accountCode: account.accountCode,
      accountName: account.accountName,
      totalAmount: lineItem.amount
    });
  }
}

// Create debit lines for expense accounts
for (const [_, accountInfo] of accountGroups) {
  lines.push({
    accountId: accountInfo.accountId,
    accountCode: accountInfo.accountCode,
    accountName: accountInfo.accountName,
    debit: accountInfo.totalAmount,
    credit: 0,
    description: `Bill ${bill.billNumber} - ${accountInfo.accountName}`
  });
}

// Credit Accounts Payable (Liability ↑)
lines.push({
  accountId: apAccount._id,
  accountCode: apAccount.accountCode,
  accountName: apAccount.accountName,
  debit: 0,
  credit: bill.totalAmount,
  description: `Bill ${bill.billNumber} - ${bill.supplierId?.toString() || 'Supplier'}`
});
```

---

## 💳 **Payment Journal Entries**

### Invoice Payment (Money Received)
```
Transaction: Payment $1,150 from ABC Corp for invoice INV-2024-001

Journal Entry:
-----------------------------------------------------------------
Date        | Account               | Debit   | Credit | Description
2024-01-30 | Cash/Bank Account     | $1,150  |        | Payment received - ABC Corp - INV-2024-001
2024-01-30 | Accounts Receivable   |          | $1,150  | Payment applied - INV-2024-001
-----------------------------------------------------------------
Totals:                          | $1,150  | $1,150  | Balanced ✅
```

### Bill Payment (Money Paid)
```
Transaction: Payment $850 to XYZ Supplies for bill BILL-2024-001

Journal Entry:
-----------------------------------------------------------------
Date        | Account               | Debit   | Credit | Description
2024-01-30 | Accounts Payable    | $850     |        | Payment made - XYZ Supplies - BILL-2024-001
2024-01-30 | Cash/Bank Account     |          | $850    | Payment applied - BILL-2024-001
-----------------------------------------------------------------
Totals:                          | $850     | $850    | Balanced ✅
```

---

## 🔢 **Transaction Types & Status**

### Journal Entry Types
```typescript
export enum JournalEntryType {
  MANUAL = 1,        // Manual journal entries
  AUTO_INVOICE = 2,   // Automatic invoice entries
  AUTO_PAYMENT = 3,    // Automatic payment entries
  AUTO_BILL = 4       // Automatic bill entries
}
```

### Journal Entry Status
```typescript
export enum JournalEntryStatus {
  DRAFT = "Draft",     // Entry created but not posted
  POSTED = "Posted",   // Entry posted to general ledger
  VOID = "Void"       // Entry voided/reversed
}
```

### Entry Numbers
- **Format**: `JE-YYYY-NNN` (e.g., JE-2024-001)
- **Scope**: Company-specific (yearly sequence)
- **Auto-Generation**: Created automatically when entries are posted

---

## 💾 **Database Schema**

### Journal Entry Model
```typescript
interface IJournalEntry {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  entryNumber: string;              // Auto-generated JE-YYYY-NNN
  entryDate: Date;
  referenceNumber?: string;          // Invoice/Bill number
  description?: string;
  entryType: JournalEntryType;      // AUTO_INVOICE, AUTO_BILL, AUTO_PAYMENT
  status: JournalEntryStatus;        // DRAFT, POSTED, VOID
  lines: IJournalEntryLine[];       // Journal entry lines
  totalDebit: number;              // Must equal totalCredit
  totalCredit: number;             // Must equal totalDebit
  postedBy?: Types.ObjectId;        // User who posted the entry
  createdBy: Types.ObjectId;        // User who created the entry
  voidedAt?: Date;               // Void timestamp
  voidedBy?: Types.ObjectId;        // User who voided the entry
}
```

### Journal Entry Line Model
```typescript
interface IJournalEntryLine {
  accountId: Types.ObjectId;       // Account reference
  accountCode: string;           // Denormalized for quick access
  accountName: string;           // Denormalized for quick access
  debit: number;                // Debit amount (0 if credit)
  credit: number;               // Credit amount (0 if debit)
  description: string;           // Line description
}
```

---

## 🔄 **Integration Points**

### Invoice Service Integration
```typescript
// invoiceService.ts
const journalEntryId = await JournalEntryService.createInvoiceJournalEntry(
  invoice,
  invoice.createdBy
);
invoice.journalEntryId = journalEntryId;
await invoice.save({ session });
```

### Bill Service Integration  
```typescript
// billService.ts
const journalEntryId = await JournalEntryService.createBillJournalEntry(
  bill,
  bill.createdBy
);
bill.journalEntryId = journalEntryId;
await bill.save({ session });
```

### Payment Service Integration
```typescript
// paymentService.ts
const journalEntryId = await JournalEntryService.createPaymentJournalEntry(
  paymentAmount,
  paymentNumber,
  description,
  cashAccountId,
  arApAccountId,
  companyId,
  userId,
  isInvoicePayment
);
payment.journalEntryId = journalEntryId;
```

---

## ✅ **Validation & Error Handling**

### Entry Validation Rules
```typescript
// 1. Debits must equal credits (with tolerance)
const tolerance = 0.01;
if (Math.abs(totalDebit - totalCredit) > tolerance) {
  throw new Error(`Journal entry must be balanced. Debit: ${totalDebit}, Credit: ${totalCredit}`);
}

// 2. Each line must have debit OR credit, not both
for (const line of lines) {
  if (line.debit > 0 && line.credit > 0) {
    throw new Error("Line item cannot have both debit and credit amounts");
  }
}

// 3. Each line must have either debit or credit
for (const line of lines) {
  if (line.debit === 0 && line.credit === 0) {
    throw new Error("Line item must have either debit or credit amount");
  }
}
```

### Account Validation
```typescript
// Required accounts must exist
if (!arAccount) {
  throw new Error("Accounts Receivable account not found. Please set up your chart of accounts.");
}

if (!salesAccount) {
  throw new Error("Sales/Revenue account not found. Please set up your chart of accounts.");
}

if (!cashAccount) {
  throw new Error("Cash/Bank account not found. Please set up your chart of accounts.");
}
```

---

## 📊 **Reporting & Audit Trail**

### General Ledger Integration
- All posted journal entries flow to general ledger automatically
- Account balances updated in real-time
- Trial balance always maintained
- Financial statements generated from journal entries

### Audit Features
- **Complete History**: Every financial transaction recorded
- **User Tracking**: Created by and posted by user information
- **Timestamps**: Creation, posting, and void timestamps
- **Reference Links**: Direct links to source documents
- **Reversal Support**: Proper void functionality with audit trail

---

## 🚀 **Benefits Achieved**

### Compliance
- ✅ **GAAP Compliance**: Proper double-entry bookkeeping
- ✅ **Audit Trail**: Complete transaction history
- ✅ **Financial Controls**: Balanced entries always maintained
- ✅ **Documentation**: Automatic reference tracking

### Efficiency  
- ✅ **Automation**: No manual journal entry required
- ✅ **Speed**: Instant entry creation for all transactions
- ✅ **Accuracy**: Computerized calculations eliminate human error
- ✅ **Consistency**: Standardized entry formats

### Visibility
- ✅ **Real-time**: Account balances update immediately
- ✅ **Traceability**: Direct links from journal to documents
- ✅ **Reporting**: Financial statements from live data
- ✅ **Insights**: Complete financial visibility

---

**This journal entry system ensures professional accounting compliance while providing maximum automation and efficiency for users.**