# Core Accounting Modules - Testing & Alignment Plan

**Date:** February 7, 2026
**Goal:** Verify all core accounting modules work correctly and maintain proper accounting principles

---

## Core Accounting Workflow

```
Chart of Accounts
    ↓
Customers/Suppliers → Invoices/Bills → Payments → Journal Entries → Ledger → Reports
    ↓                      ↓              ↓              ↓            ↓         ↓
Inventory          (Auto J/E)      (Auto J/E)    (Double-entry)  (Balances)  (Analysis)
```

---

## Testing Checklist

### 1. Chart of Accounts ✅

**Purpose:** Foundation for all accounting

**Tests:**

- [ ] Create new account
- [ ] Edit account details
- [ ] Deactivate account
- [ ] View chart of accounts (grouped by type)
- [ ] Verify account types: Asset, Liability, Equity, Revenue, Expense
- [ ] Verify normal balances (Asset/Expense = Debit, others = Credit)

**Accounting Validation:**

- [ ] Account codes follow numbering convention
- [ ] All account types represented
- [ ] Seed accounts loaded properly

---

### 2. Customers & Suppliers ✅

**Purpose:** Master data for transactions

**Tests:**

- [ ] Create customer
- [ ] Create supplier
- [ ] Edit customer/supplier
- [ ] View customer/supplier list
- [ ] Search/filter functionality

**Data Validation:**

- [ ] Required fields enforced
- [ ] Email format validation
- [ ] Phone format validation

---

### 3. Invoice Workflow 🔄

**Purpose:** Record sales and accounts receivable

**Full Workflow Test:**

```
Step 1: Create Invoice
  → Invoice #INV-001
  → Customer: Acme Corp
  → Line items with revenue accounts
  → Total: $1,000

Step 2: Verify Auto Journal Entry Created
  → Debit: Accounts Receivable $1,000
  → Credit: Sales Revenue $1,000
  → Status: Posted

Step 3: Record Payment
  → Payment received: $1,000
  → Payment method: Bank Transfer

Step 4: Verify Payment Journal Entry
  → Debit: Cash/Bank $1,000
  → Credit: Accounts Receivable $1,000

Step 5: Check Ledger
  → AR balance: $0 (debited $1k, credited $1k)
  → Revenue balance: $1,000 credit
  → Cash balance: $1,000 debit

Step 6: Verify Reports
  → Income Statement: Revenue $1,000
  → Balance Sheet: Cash $1,000, AR $0
  → Cash Flow: Operating inflow $1,000
```

**Tests:**

- [ ] Create invoice with single line item
- [ ] Create invoice with multiple line items
- [ ] Create invoice with tax
- [ ] Generate invoice PDF
- [ ] Record full payment
- [ ] Record partial payment
- [ ] Verify invoice status changes (Draft → Sent → Paid)
- [ ] Check overdue invoices functionality

**Accounting Validation:**

- [ ] Auto journal entry created on invoice finalization
- [ ] Debits Accounts Receivable
- [ ] Credits correct revenue accounts
- [ ] Tax properly credited to tax liability account
- [ ] Payment reduces AR correctly
- [ ] Invoice total = line items + tax

---

### 4. Bill Workflow 🔄

**Purpose:** Record purchases and accounts payable

**Full Workflow Test:**

```
Step 1: Create Bill
  → Bill #BILL-001
  → Supplier: Office Supplies Inc
  → Line items with expense accounts
  → Total: $500

Step 2: Verify Auto Journal Entry
  → Debit: Office Supplies Expense $500
  → Credit: Accounts Payable $500

Step 3: Record Payment
  → Payment made: $500
  → Payment method: Check

Step 4: Verify Payment Journal Entry
  → Debit: Accounts Payable $500
  → Credit: Cash/Bank $500

Step 5: Check Ledger
  → AP balance: $0
  → Expense balance: $500 debit
  → Cash balance: -$500 (payment out)

Step 6: Verify Reports
  → Income Statement: Expense $500
  → Balance Sheet: Cash -$500, AP $0
  → Cash Flow: Operating outflow $500
```

**Tests:**

- [ ] Create bill with expense items
- [ ] Create bill with inventory items
- [ ] Create bill with tax
- [ ] Record full payment
- [ ] Record partial payment
- [ ] Check bill status changes
- [ ] Verify overdue bills

**Accounting Validation:**

- [ ] Auto journal entry created
- [ ] Credits Accounts Payable correctly
- [ ] Debits correct expense accounts
- [ ] Payment reduces AP correctly
- [ ] Bill total matches line items + tax

---

### 5. Payment Workflow 🔄

**Purpose:** Track cash movements

**Tests:**

- [ ] Record payment received (customer)
- [ ] Allocate payment to specific invoice(s)
- [ ] Record payment made (supplier)
- [ ] Allocate payment to specific bill(s)
- [ ] Record payment without invoice/bill (general payment)

**Accounting Validation:**

- [ ] Payment received increases cash, decreases AR
- [ ] Payment made decreases cash, decreases AP
- [ ] Allocations match invoice/bill amounts
- [ ] Can't over-allocate payment

---

### 6. Journal Entry Workflow 🔄

**Purpose:** Manual accounting entries & adjustments

**Tests:**

- [ ] Create manual journal entry (2+ lines)
- [ ] Verify debits = credits validation
- [ ] Save as draft
- [ ] Post journal entry
- [ ] Verify ledger entries created
- [ ] Void posted entry
- [ ] Verify reversing entries created
- [ ] Cannot edit posted entry
- [ ] Cannot delete posted entry
- [ ] Can edit draft entry
- [ ] Can delete draft entry

**Accounting Validation:**

- [ ] Total debits = total credits (balanced)
- [ ] Cannot post unbalanced entry
- [ ] Posting creates ledger entries
- [ ] Voiding creates reversing entries
- [ ] Account balances update correctly
- [ ] Auto-numbering works (JE-2026-001)

---

### 7. Ledger Verification 🔄

**Purpose:** Double-entry bookkeeping foundation

**Tests:**

- [ ] View ledger for specific account
- [ ] Verify running balance calculation
- [ ] Filter by date range
- [ ] Check all entry types appear (invoice, bill, payment, manual)

**Accounting Validation:**

- [ ] Every debit has corresponding credit
- [ ] Running balance calculates correctly
- [ ] Asset/Expense: increases with debit
- [ ] Liability/Equity/Revenue: increases with credit
- [ ] All transactions have journal entry reference

---

### 8. Financial Reports 🔄

**Purpose:** Financial analysis and compliance

**Balance Sheet Tests:**

```
Starting Point: Empty company

Transaction 1: Owner invests $10,000
  J/E: Debit Cash $10k, Credit Owner's Equity $10k

Balance Sheet should show:
  Assets: Cash $10,000
  Equity: Owner's Equity $10,000
  BALANCED: Assets ($10k) = Liabilities ($0) + Equity ($10k)

Transaction 2: Buy inventory on credit for $2,000
  J/E: Debit Inventory $2k, Credit AP $2k

Balance Sheet should show:
  Assets: Cash $10k + Inventory $2k = $12k
  Liabilities: AP $2k
  Equity: Owner's Equity $10k
  BALANCED: Assets ($12k) = Liabilities ($2k) + Equity ($10k)

Transaction 3: Sell inventory for $3,000 (cost was $2,000)
  J/E 1: Debit AR $3k, Credit Revenue $3k
  J/E 2: Debit COGS $2k, Credit Inventory $2k

Balance Sheet should show:
  Assets: Cash $10k + AR $3k + Inventory $0 = $13k
  Liabilities: AP $2k
  Equity: Owner's Equity $10k + Net Income $1k = $11k
  BALANCED: $13k = $2k + $11k

Income Statement should show:
  Revenue: $3,000
  COGS: $2,000
  Net Income: $1,000
```

**Tests:**

- [ ] Balance Sheet equation validates: Assets = Liabilities + Equity
- [ ] Income Statement calculates: Revenue - Expenses = Net Income
- [ ] Cash Flow shows: Operating + Investing + Financing activities
- [ ] Trial Balance: Total Debits = Total Credits
- [ ] Reports filter by date range correctly
- [ ] Reports show company ID data only

**Accounting Validation:**

- [ ] Balance Sheet balances (within $0.01 tolerance)
- [ ] Trial Balance balances
- [ ] Net Income flows to equity correctly
- [ ] Cash Flow reconciles cash account changes

---

### 9. Integration Testing 🔄

**Purpose:** Verify modules work together

**Complete Workflow:**

```
Day 1: Setup
1. Create company
2. Load chart of accounts
3. Create customers (2)
4. Create suppliers (2)

Day 2: Sales
5. Create invoice #1 for Customer A: $5,000
6. Verify journal entry: DR AR, CR Revenue
7. Record payment: $5,000
8. Verify journal entry: DR Cash, CR AR

Day 3: Purchases
9. Create bill #1 for Supplier A: $2,000
10. Verify journal entry: DR Expense, CR AP
11. Record payment: $2,000
12. Verify journal entry: DR AP, CR Cash

Day 4: Manual Entry
13. Record depreciation: DR Depreciation Expense $500, CR Accumulated Depreciation $500

Day 5: Verify Reports
14. Income Statement: Revenue $5k - Expenses $2.5k = Net Income $2.5k
15. Balance Sheet: Assets = Liabilities + Equity
16. Trial Balance: Debits = Credits
17. Cash Flow: Net cash $3k ($5k in - $2k out)
```

**Tests:**

- [ ] Complete workflow from setup to reports
- [ ] All auto journal entries created
- [ ] All ledger balances correct
- [ ] All reports accurate
- [ ] No orphaned data
- [ ] No accounting equation violations

---

## Issues to Check For

### Data Integrity

- [ ] Orphaned records (invoices without customers)
- [ ] Missing journal entries
- [ ] Unbalanced entries
- [ ] Negative cash without overdraft permission
- [ ] Deleted records with active references

### Business Logic

- [ ] Can't delete account with transactions
- [ ] Can't delete customer with unpaid invoices
- [ ] Can't overpay invoice
- [ ] Payment allocation doesn't exceed invoice total
- [ ] Invoice status reflects payment state

### Accounting Accuracy

- [ ] Account normal balances respected
- [ ] Debits = Credits in all journal entries
- [ ] Running balances calculate correctly
- [ ] Financial statements balance
- [ ] Fiscal year boundaries respected

---

## Test Data Setup

### Minimal Test Dataset

```
Accounts:
- 1000: Cash
- 1200: Accounts Receivable
- 2000: Accounts Payable
- 3000: Owner's Equity
- 4000: Sales Revenue
- 5000: Cost of Goods Sold
- 6000: Operating Expenses

Customers:
- Acme Corp
- XYZ Company

Suppliers:
- Office Depot
- Tech Supplies Inc

Transactions:
- Invoice: $1,000 to Acme Corp
- Payment Received: $1,000 from Acme
- Bill: $500 from Office Depot
- Payment Made: $500 to Office Depot
- Manual J/E: Opening balance
```

---

## Success Criteria

### Functional

- [ ] All CRUD operations work
- [ ] All workflows complete successfully
- [ ] No errors in console/logs
- [ ] Data persists correctly

### Accounting

- [ ] All journal entries balanced
- [ ] Ledger maintains double-entry
- [ ] Financial statements balance
- [ ] Account balances accurate

### User Experience

- [ ] Forms validate properly
- [ ] Error messages are clear
- [ ] Loading states show
- [ ] Success confirmations appear

---

## Next Steps After Validation

1. **Document Issues Found** - List all bugs/gaps
2. **Prioritize Fixes** - Critical vs nice-to-have
3. **Fix Critical Issues** - Blocking problems first
4. **Retest** - Verify fixes work
5. **Document Working Flows** - User guide

---

## Timeline

**Phase 1: Manual Testing** (4-6 hours)

- Test each workflow manually
- Document any issues
- Take screenshots of working flows

**Phase 2: Fix Issues** (2-4 hours)

- Fix bugs found
- Improve validations
- Enhance error handling

**Phase 3: Retest** (2-3 hours)

- Verify fixes
- Complete integration test
- Validate accounting accuracy

**Total:** ~10-13 hours to fully validate and fix

---

**Status:** Ready to begin systematic testing
