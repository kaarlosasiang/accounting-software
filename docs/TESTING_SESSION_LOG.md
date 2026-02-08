# Systematic Testing Session - Core Accounting Modules

**Date:** February 7, 2026
**Tester:** Claude + User
**Goal:** Verify all core accounting workflows and identify issues

---

## Testing Log

### Phase 1: Chart of Accounts ⏳

**Objective:** Verify foundation accounts exist and work properly

**Steps:**
1. Navigate to `/accounts` in frontend
2. Verify key accounts exist:
   - 1000: Cash/Bank (Asset)
   - 1200: Accounts Receivable (Asset)
   - 2000: Accounts Payable (Liability)
   - 3000: Owner's Equity (Equity)
   - 4000: Sales Revenue (Revenue)
   - 5000: Cost of Goods Sold (Expense)
   - 6000: Operating Expenses (Expense)

**Questions to Answer:**
- [ ] Do accounts load without errors?
- [ ] Are accounts grouped by type?
- [ ] Can you create a new account?
- [ ] Can you edit an existing account?

**Test:** Create a new account
- Account Code: 1010
- Account Name: Petty Cash
- Type: Asset
- Subtype: Current Asset

**Expected:** Account saved successfully, appears in account list

**Actual:** _[User to fill in]_

**Issues Found:** _[Document any problems]_

---

### Phase 2: Master Data (Customers & Suppliers) ⏳

**Objective:** Verify you can create customers and suppliers

**Test: Create Customer**
- Customer Name: Test Customer A
- Email: customera@test.com
- Phone: (555) 123-4567
- Payment Terms: Net 30

**Expected:** Customer created successfully

**Actual:** _[User to fill in]_

**Test: Create Supplier**
- Supplier Name: Test Supplier A
- Email: suppliera@test.com
- Phone: (555) 987-6543
- Payment Terms: Net 30

**Expected:** Supplier created successfully

**Actual:** _[User to fill in]_

**Issues Found:** _[Document any problems]_

---

### Phase 3: Invoice Workflow 🔴 CRITICAL

**Objective:** Test complete invoice-to-payment flow

#### Step 3.1: Create Invoice

**Test Data:**
- Customer: Test Customer A
- Invoice Date: Today
- Due Date: 30 days from today
- Line Items:
  1. Description: "Consulting Services"
     Quantity: 10
     Unit Price: 100
     Account: 4000 - Sales Revenue
     Amount: $1,000

**Expected:**
- Invoice created with number (e.g., INV-2026-001)
- Status: Draft or Pending
- Total: $1,000

**Actual:** _[User to fill in]_

#### Step 3.2: Verify Auto Journal Entry

**After creating/posting invoice, check:**

Navigate to Journal Entries page → Find entry for this invoice

**Expected Journal Entry:**
```
Entry Type: AUTO_INVOICE
Description: Invoice #[number]
Lines:
  - Debit: Accounts Receivable (1200) - $1,000
  - Credit: Sales Revenue (4000) - $1,000
Status: Posted
Total Debit: $1,000
Total Credit: $1,000
```

**Actual:** _[User to fill in]_

**❗ If no journal entry created:** This is a CRITICAL BUG

#### Step 3.3: Check Ledger Entries

Navigate to Ledger page → Filter by account

**Expected Ledger Entries:**

**Account: 1200 - Accounts Receivable**
- Debit: $1,000
- Balance: $1,000 (debit)

**Account: 4000 - Sales Revenue**
- Credit: $1,000
- Balance: $1,000 (credit)

**Actual:** _[User to fill in]_

#### Step 3.4: Record Payment

**Test Data:**
- Payment Date: Today
- Amount: $1,000
- Payment Method: Bank Transfer
- Allocate to: Invoice created above

**Expected:**
- Payment recorded successfully
- Invoice status changes to "Paid"
- Payment allocated: $1,000

**Actual:** _[User to fill in]_

#### Step 3.5: Verify Payment Journal Entry

**Expected Journal Entry:**
```
Entry Type: AUTO_PAYMENT
Description: Payment for Invoice #[number]
Lines:
  - Debit: Cash/Bank (1000) - $1,000
  - Credit: Accounts Receivable (1200) - $1,000
Status: Posted
```

**Actual:** _[User to fill in]_

#### Step 3.6: Check Updated Ledger

**Account: 1000 - Cash/Bank**
- Debit: $1,000
- Balance: $1,000 (debit)

**Account: 1200 - Accounts Receivable**
- Previous Debit: $1,000
- Credit: $1,000 (from payment)
- Balance: $0

**Account: 4000 - Sales Revenue**
- Credit: $1,000
- Balance: $1,000 (credit)

**Actual:** _[User to fill in]_

**Issues Found:** _[Document any problems]_

---

### Phase 4: Bill Workflow 🔴 CRITICAL

**Objective:** Test complete bill-to-payment flow

#### Step 4.1: Create Bill

**Test Data:**
- Supplier: Test Supplier A
- Bill Date: Today
- Due Date: 30 days from today
- Line Items:
  1. Description: "Office Supplies"
     Quantity: 1
     Unit Price: 500
     Account: 6000 - Operating Expenses
     Amount: $500

**Expected:**
- Bill created with number (e.g., BILL-2026-001)
- Status: Pending
- Total: $500

**Actual:** _[User to fill in]_

#### Step 4.2: Verify Auto Journal Entry

**Expected Journal Entry:**
```
Entry Type: AUTO_BILL
Description: Bill #[number]
Lines:
  - Debit: Operating Expenses (6000) - $500
  - Credit: Accounts Payable (2000) - $500
Status: Posted
```

**Actual:** _[User to fill in]_

#### Step 4.3: Record Payment

**Test Data:**
- Payment Date: Today
- Amount: $500
- Payment Method: Check
- Allocate to: Bill created above

**Expected:**
- Payment recorded successfully
- Bill status changes to "Paid"

**Actual:** _[User to fill in]_

#### Step 4.4: Verify Payment Journal Entry

**Expected Journal Entry:**
```
Entry Type: AUTO_PAYMENT
Lines:
  - Debit: Accounts Payable (2000) - $500
  - Credit: Cash/Bank (1000) - $500
```

**Actual:** _[User to fill in]_

#### Step 4.5: Check Ledger Balances

**Account: 1000 - Cash/Bank**
- Previous: $1,000 (from invoice payment)
- Credit: $500 (bill payment out)
- Balance: $500 (debit)

**Account: 2000 - Accounts Payable**
- Credit: $500 (from bill)
- Debit: $500 (from payment)
- Balance: $0

**Account: 6000 - Operating Expenses**
- Debit: $500
- Balance: $500 (debit)

**Actual:** _[User to fill in]_

**Issues Found:** _[Document any problems]_

---

### Phase 5: Manual Journal Entry 🔴 CRITICAL

**Objective:** Test manual journal entry creation and posting

#### Step 5.1: Create Manual Entry

**Test Data:**
```
Entry Date: Today
Description: "Test manual entry - Opening balance"
Lines:
  1. Account: 1000 - Cash/Bank
     Debit: $5,000
  2. Account: 3000 - Owner's Equity
     Credit: $5,000
```

**Expected:**
- Entry created as Draft
- Entry number: JE-2026-001
- Total Debit: $5,000
- Total Credit: $5,000
- Balanced: Yes

**Actual:** _[User to fill in]_

#### Step 5.2: Post Entry

**Action:** Click "Post" button

**Expected:**
- Status changes to Posted
- Cannot edit anymore
- Ledger entries created

**Actual:** _[User to fill in]_

#### Step 5.3: Verify Ledger

**Account: 1000 - Cash/Bank**
- Previous: $500
- Debit: $5,000
- New Balance: $5,500 (debit)

**Account: 3000 - Owner's Equity**
- Credit: $5,000
- Balance: $5,000 (credit)

**Actual:** _[User to fill in]_

#### Step 5.4: Test Voiding

**Action:** Click "Void" on the posted entry

**Expected:**
- Status changes to Void
- Reversing journal entry created
- Balances restored to pre-entry state

**Actual:** _[User to fill in]_

**Issues Found:** _[Document any problems]_

---

### Phase 6: Financial Reports 🔴 CRITICAL

**Objective:** Verify reports show accurate data

**Current Balances (if tests above worked):**
- Cash: $5,500 (debit)
- AR: $0
- AP: $0
- Revenue: $1,000 (credit)
- Expenses: $500 (debit)
- Equity: $5,000 (credit)

#### Test 6.1: Balance Sheet

Navigate to Reports → Balance Sheet

**Expected:**
```
ASSETS:
  Current Assets:
    Cash: $5,500
    Accounts Receivable: $0
  Total Assets: $5,500

LIABILITIES:
  Current Liabilities:
    Accounts Payable: $0
  Total Liabilities: $0

EQUITY:
  Owner's Equity: $5,000
  Retained Earnings/Net Income: $500 ($1,000 revenue - $500 expense)
  Total Equity: $5,500

EQUATION: $5,500 = $0 + $5,500 ✓ BALANCED
```

**Actual:** _[User to fill in]_

**Is it balanced?** _[Yes/No]_

#### Test 6.2: Income Statement

Navigate to Reports → Income Statement (P&L)

**Expected:**
```
REVENUE:
  Sales Revenue: $1,000
  Total Revenue: $1,000

EXPENSES:
  Operating Expenses: $500
  Total Expenses: $500

NET INCOME: $500
```

**Actual:** _[User to fill in]_

#### Test 6.3: Cash Flow Statement

Navigate to Reports → Cash Flow

**Expected:**
```
OPERATING ACTIVITIES:
  Net Income: $500
  Changes in AR: $0 (no change)
  Changes in AP: $0 (no change)
  Net Operating Cash Flow: $500

INVESTING ACTIVITIES: $0

FINANCING ACTIVITIES:
  Owner's Equity Investment: $5,000
  Net Financing Cash Flow: $5,000

NET CASH FLOW: $5,500
Beginning Cash: $0
Ending Cash: $5,500 ✓
```

**Actual:** _[User to fill in]_

#### Test 6.4: Trial Balance

Navigate to Reports → Trial Balance

**Expected:**
```
Account                     Debit      Credit
1000 - Cash/Bank           $5,500
1200 - AR                  $0
2000 - AP                             $0
3000 - Owner's Equity                 $5,000
4000 - Sales Revenue                  $1,000
6000 - Operating Expenses  $500
                          ------     ------
TOTALS:                    $6,000     $6,000 ✓ BALANCED
```

**Actual:** _[User to fill in]_

**Is it balanced?** _[Yes/No]_

**Issues Found:** _[Document any problems]_

---

## Summary of Issues

### Critical Issues (Blockers)
_[List issues that prevent core functionality from working]_

### High Priority Issues
_[List issues that affect user experience or data accuracy]_

### Medium Priority Issues
_[List issues that are quality-of-life improvements]_

### Low Priority Issues
_[List cosmetic or minor issues]_

---

## Next Steps

1. Review all issues found
2. Prioritize fixes
3. Create fix plan
4. Implement fixes
5. Retest

---

**Testing Status:** IN PROGRESS
**Start Time:** [To be filled]
**End Time:** [To be filled]
**Duration:** [To be calculated]
