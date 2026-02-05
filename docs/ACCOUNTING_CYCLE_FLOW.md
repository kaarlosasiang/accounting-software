# Understanding the Complete Accounting Flow (Simple Guide)

**For:** Accountant Consultation  
**Why:** I'm building accounting software and need to understand how transactions flow from start to finish

---

## 📖 How to Use This Guide

Hi! I'm not an accountant, so I've organized these questions in simple scenarios. Just walk me through each scenario step by step, and I'll take notes on:

- What happens in your accounting system
- What records/entries you create
- When things happen (timing)

Feel free to draw it out or use simple examples - that helps me understand better!

---

## 🛒 Scenario 1: Buying Inventory

**Story:** I buy 100 shirts from my supplier for ₱500 each. Total bill is ₱56,000 (₱50,000 + ₱6,000 VAT).

---

### ✅ THE ANSWER:

#### **When I order the shirts:**

❌ **NO accounting entry yet!** This is just a Purchase Order (PO) - a commitment, not an actual transaction.

- Track it in your inventory/order management system, but NOT in accounting books
- Think of it as: "We agreed I'll buy these, but nothing has changed hands yet"

#### **When the shirts arrive at my warehouse:**

✅ **NOW you record!** This is when you "receive" the goods.

**What you record:**

1. **Inventory** (Asset) increases by ₱50,000 (the cost, WITHOUT VAT)
2. **VAT Input** (Asset) increases by ₱6,000 (the VAT you paid - you can claim this back)
3. **Accounts Payable** (Liability) increases by ₱56,000 (total you owe supplier)

**The Journal Entry:**

```
Debit:  Inventory                 ₱50,000  (You got shirts)
Debit:  VAT Input                 ₱6,000   (VAT you can claim back)
Credit: Accounts Payable          ₱56,000  (You owe the supplier)
```

**Why this way?**

- **Debit** = What you GOT (inventory + VAT credit)
- **Credit** = Where it CAME FROM (debt to supplier)
- VAT is separate because it's not part of the inventory cost - it's a temporary holding account until you file your VAT return

**What if only 90 shirts arrive?**
Record only what actually arrived:

```
Debit:  Inventory                 ₱45,000  (90 × ₱500)
Debit:  VAT Input                 ₱5,400   (VAT on ₱45,000)
Credit: Accounts Payable          ₱50,400  (What you actually owe)
```

Then handle the shortage with supplier (either they send remaining 10 or adjust the bill).

#### **When the supplier's bill arrives:**

Most of the time, the bill arrives at the same time as the goods, so the entry above covers it!

**But if the bill differs from what you recorded:**

- **Bill says ₱57,000 but PO said ₱56,000?**
  - You need to record the difference (₱1,000 extra)
  - This could be an additional charge, shipping, or a price change
  - **Adjustment entry:** Debit Inventory (or Expense) ₱893, Debit VAT Input ₱107, Credit Accounts Payable ₱1,000

#### **When I pay the supplier:**

Payment is simple - you're just moving money from one account to another.

**If you pay the full ₱56,000:**

```
Debit:  Accounts Payable          ₱56,000  (You no longer owe them)
Credit: Cash/Bank                 ₱56,000  (Money leaves your account)
```

**If you pay ₱30,000 now, ₱26,000 later:**

```
First payment:
Debit:  Accounts Payable          ₱30,000
Credit: Cash/Bank                 ₱30,000

Second payment (next month):
Debit:  Accounts Payable          ₱26,000
Credit: Cash/Bank                 ₱26,000
```

Your Accounts Payable decreases each time, showing the remaining balance you still owe.

**Early payment discount?**
Let's say you pay within 10 days and get 2% discount (save ₱1,120):

```
Debit:  Accounts Payable          ₱56,000  (Original amount owed)
Credit: Cash/Bank                 ₱54,880  (What you actually paid)
Credit: Purchase Discount         ₱1,120   (Your savings - reduces cost)
```

---

### 📝 Summary for Scenario 1:

- **When:** Goods arrive (or bill arrives if different)
- **Record:** Inventory + VAT Input as debits, Accounts Payable as credit
- **Payment:** Later - just moves from Payable to Cash
- **Key Point:** VAT is SEPARATE from inventory cost

---

## 💰 Scenario 2: Selling to Customer

**Story:** I sell 50 of those shirts to a customer for ₱800 each. I create an invoice for ₱44,800 (₱40,000 + ₱4,800 VAT).

---

### ✅ THE ANSWER:

#### **When I create the invoice:**

✅ **YES, record the sale immediately!** (This is "accrual accounting" - you record when you earn it, not when you get paid)

**TWO entries happen at the same time:**

**Entry 1: Record the Sale**

```
Debit:  Accounts Receivable       ₱44,800  (Customer owes you)
Credit: Sales Revenue             ₱40,000  (You earned this!)
Credit: VAT Output                ₱4,800   (VAT you collected for government)
```

**Entry 2: Record the Cost (Cost of Goods Sold)**

```
Debit:  Cost of Goods Sold        ₱25,000  (50 shirts × ₱500 each)
Credit: Inventory                 ₱25,000  (Shirts leave your warehouse)
```

**Why TWO separate entries?**

- **Entry 1** = Shows your REVENUE (₱40,000) and what customer owes (₱44,800)
- **Entry 2** = Shows your COST (₱25,000) and reduces inventory
- **Profit** = Revenue (₱40,000) - Cost (₱25,000) = **₱15,000**

**Do I count this as "I made ₱40,000" right away?**
✅ YES! Even though they haven't paid yet. In accounting:

- **Revenue** is recorded when you EARN it (deliver the goods/invoice)
- **Cash** is recorded when you RECEIVE it
- These are different moments!

#### **What if I bought shirts at different prices?**

This is a CRITICAL question! You need a costing method:

**FIFO (First In, First Out) - Most Common:**

- Sell the oldest inventory first
- Example: Bought 20 @ ₱500, then 30 @ ₱600
- When you sell 50 shirts, cost = (20 × ₱500) + (30 × ₱600) = ₱28,000

**AVERAGE Cost:**

- Calculate average price of all shirts
- Example: (20 × ₱500) + (30 × ₱600) = ₱28,000 total for 50 shirts
- Average = ₱28,000 ÷ 50 = ₱560 per shirt
- When you sell 50, cost = 50 × ₱560 = ₱28,000

**You must pick ONE method and stick with it!** Most businesses use FIFO in the Philippines.

#### **When customer pays me:**

Payment is separate from the sale (you already recorded revenue when you invoiced).

**When ₱44,800 hits your bank:**

```
Debit:  Cash/Bank                 ₱44,800  (Money received)
Credit: Accounts Receivable       ₱44,800  (Customer no longer owes you)
```

**If they only pay ₱20,000 now:**

```
Debit:  Cash/Bank                 ₱20,000
Credit: Accounts Receivable       ₱20,000
```

Your Accounts Receivable still shows ₱24,800 remaining balance.

**If they pay late and you charge ₱500 interest:**

```
Debit:  Cash/Bank                 ₱45,300  (Original + interest)
Credit: Accounts Receivable       ₱44,800  (Clear the original debt)
Credit: Interest Income           ₱500     (Extra income from late payment)
```

---

### 📝 Summary for Scenario 2:

- **When:** Invoice is created (NOT when paid)
- **Record TWO things:** (1) Sale + VAT + Receivable, (2) Cost + Reduce Inventory
- **Payment:** Later - just moves from Receivable to Cash
- **Key Point:** Revenue ≠ Cash! You can have sales without cash (credit sales)

---

## 📊 Scenario 3: End of Month

**Story:** The month ends. I need to close my books and prepare reports.

---

### ✅ THE ANSWER:

#### **Checking my inventory (Physical Count vs System):**

**Situation:** Computer says 50 shirts, but you physically count only 48 shirts.

**What to do:**
Record an **Inventory Adjustment** to match reality:

```
Debit:  Inventory Loss/Shrinkage  ₱1,000   (2 shirts × ₱500 - this is an expense)
Credit: Inventory                 ₱1,000   (Reduce inventory to actual count)
```

**Why?**

- Your physical count (48) is the TRUTH
- Your system (50) was wrong
- The 2 missing shirts could be: stolen, damaged, given away, miscounted when received, or sold but not recorded
- Either way, they're gone and you need to expense them

**Pro Tip:** Keep a record of WHY they're missing if you can figure it out (helps prevent future losses).

#### **VAT Calculations:**

**Your transactions this month:**

- **Bought from supplier:** Paid ₱6,000 VAT → **VAT Input** (you can claim this)
- **Sold to customer:** Collected ₱4,800 VAT → **VAT Output** (you owe this to government)

**The Math:**

```
VAT Output (collected from customers)     ₱4,800
MINUS VAT Input (paid to suppliers)       ₱6,000
= Net VAT Position                        -₱1,200
```

**What this means:**
✅ **Government owes YOU ₱1,200!** This is called a "VAT Refund" or "Excess Input VAT"

- You paid more VAT on purchases (₱6,000) than you collected on sales (₱4,800)
- You can either: (1) Claim a refund, or (2) Carry forward to next month's VAT return

**Journal Entry at Month-End:**

```
Debit:  VAT Output                ₱4,800   (Clear the output VAT)
Debit:  VAT Refundable            ₱1,200   (Asset - government owes you)
Credit: VAT Input                 ₱6,000   (Clear the input VAT)
```

**IF Output > Input (you owe government):**
Example: Collected ₱10,000 VAT, paid ₱6,000 VAT → You owe ₱4,000

```
Debit:  VAT Output                ₱10,000
Credit: VAT Input                 ₱6,000
Credit: VAT Payable               ₱4,000   (Liability - you owe government)
```

#### **Other Month-End Stuff:**

**1. Depreciation (if you have equipment, computers, vehicles):**

```
Debit:  Depreciation Expense      ₱X,XXX
Credit: Accumulated Depreciation  ₱X,XXX
```

(Your accountant will help calculate this)

**2. Accruals (expenses incurred but not yet billed):**

- Electricity bill not yet received but you used power → estimate and accrue
- Salaries earned by employees but not yet paid → accrue

```
Debit:  Expense                   ₱X,XXX
Credit: Accrued Expenses          ₱X,XXX
```

**3. Prepayments (you paid for something that covers multiple months):**

- Paid ₱12,000 insurance for the year → expense ₱1,000 each month

```
Debit:  Insurance Expense         ₱1,000
Credit: Prepaid Insurance         ₱1,000
```

**4. Bank Reconciliation:**

- Compare your accounting Cash account to your actual bank statement
- Account for any differences (bank fees, deposits in transit, outstanding checks)

---

### 📝 Summary for Scenario 3:

- **Inventory:** Adjust to match physical count, expense the difference
- **VAT:** Net Output minus Input → either you owe or government owes you
- **Other:** Depreciation, accruals, prepayments, bank reconciliation
- **Key Point:** Month-end adjustments ensure your books reflect REALITY

---

## 📈 Scenario 4: Understanding the Big Picture

**Story:** After all those transactions, I want to see my financial reports.

---

### ✅ THE ANSWER:

#### **Balance Sheet (Your Financial Position)**

The Balance Sheet shows what you OWN, what you OWE, and what's left over (equity).

**Based on our transactions above:**

```
ASSETS (What You Own):
  Current Assets:
    Cash/Bank                     ₱X,XXX    (Whatever you started with, minus payments, plus collections)
    Accounts Receivable           ₱44,800   (Customer owes you from Scenario 2)
    Inventory                     ₱24,000   (Bought 100 @ ₱500 = ₱50,000, sold 50 = ₱25,000, lost 2 = ₱1,000)
                                           = ₱50,000 - ₱25,000 - ₱1,000 = ₱24,000 (48 shirts remaining)
    VAT Refundable                ₱1,200    (Government owes you)
  Total Current Assets:           ₱XX,XXX

LIABILITIES (What You Owe):
  Current Liabilities:
    Accounts Payable              ₱56,000   (You owe supplier from Scenario 1)
  Total Liabilities:              ₱56,000

EQUITY (What's Yours):
  Retained Earnings               ₱XX,XXX   (Beginning balance)
  Net Income (this month)         ₱14,000   (See Income Statement below)
  Total Equity:                   ₱XX,XXX

TOTAL LIABILITIES + EQUITY:       ₱XX,XXX   (Must equal Total Assets!)
```

**The Golden Rule:** Assets = Liabilities + Equity (always!)

---

#### **Income Statement (Did You Make Money?)**

The Income Statement shows your REVENUES, COSTS, and PROFIT for the period.

```
INCOME STATEMENT - Month Ending [Date]

REVENUE:
  Sales Revenue                   ₱40,000   (From selling 50 shirts)
Total Revenue:                    ₱40,000

COST OF GOODS SOLD:
  Cost of Goods Sold              ₱25,000   (Cost of the 50 shirts you sold)
Gross Profit:                     ₱15,000   (Revenue minus Cost)

OPERATING EXPENSES:
  Inventory Loss/Shrinkage        ₱1,000    (2 missing shirts)
  [Other expenses]                ₱X,XXX    (Salaries, rent, utilities, etc.)
Total Operating Expenses:         ₱X,XXX

NET INCOME (PROFIT):              ₱14,000   (Gross Profit minus Expenses)
```

**Understanding Profit:**

- **Gross Profit** = Sales minus Cost of what you sold (₱40,000 - ₱25,000 = ₱15,000)
- **Net Income** = Gross Profit minus all other expenses (₱15,000 - ₱1,000 shrinkage = ₱14,000)

**Important Notes:**

- ❌ VAT is NOT part of revenue or cost (it's just pass-through to government)
- ❌ Accounts Receivable doesn't affect profit (you already counted the ₱40,000 revenue when you invoiced)
- ❌ Accounts Payable doesn't affect profit (you already counted the ₱25,000 cost when you sold)
- ✅ Profit is based on EARNED revenue and INCURRED costs, not cash received/paid

---

#### **Reports You Need:**

**For Managing Your Business (Internal):**

1. **Balance Sheet** - Monthly (shows financial position)
2. **Income Statement** - Monthly (shows profitability)
3. **Cash Flow Statement** - Monthly (shows cash movements - different from profit!)
4. **Accounts Receivable Aging** - Weekly (who owes you money and for how long)
5. **Accounts Payable Aging** - Weekly (who you owe and when it's due)
6. **Inventory Report** - Weekly/Monthly (stock levels, reorder points)

**For BIR (Philippines Tax Authority):**

1. **Monthly VAT Return (BIR Form 2550M/2550Q)** - Every month/quarter
   - Due on the 20th day of the month following the taxable quarter
2. **Annual Income Tax Return (BIR Form 1701/1702)** - Yearly
   - Due on April 15 (for calendar year businesses)
3. **Summary List of Sales/Purchases** - Quarterly/Annually
4. **Withholding Tax Returns** - Monthly (if applicable)

**Pro Tip:** Your accountant can prepare the BIR forms, but YOU should understand the numbers in them!

---

### 📝 Summary for Scenario 4:

- **Balance Sheet:** Assets = Liabilities + Equity (snapshot at a point in time)
- **Income Statement:** Revenue - Costs - Expenses = Profit (performance over a period)
- **Cash ≠ Profit:** You can be profitable but have no cash (because of receivables/payables)
- **Reports:** Internal for management, BIR for compliance
- **Key Point:** Your software should generate these reports automatically from your transactions!

---

## 🔧 Scenario 5: Building the Software

**Story:** I'm building software to handle all this. I need to validate my approach.

---

### ✅ THE ANSWER:

#### **Modules You Need:**

**Core Modules:**

1. ✅ **Chart of Accounts** - The foundation! (All account categories)
2. ✅ **Customers** - Who you sell to
3. ✅ **Suppliers** - Who you buy from
4. ✅ **Inventory Items** - Products you buy/sell
5. ✅ **Invoices** - Sales to customers (YES, separate module!)
6. ✅ **Bills** - Purchases from suppliers (YES, separate module!)
7. ✅ **Payments Received** - Customer payments
8. ✅ **Payments Made** - Supplier payments
9. ✅ **Journal Entries** - Manual adjustments (month-end, corrections)
10. ✅ **Reports** - Balance Sheet, Income Statement, etc.

**Why separate Invoices and Bills?**

- Different workflows, different data
- Invoice tracks: customer, due date, payment terms, shipping info
- Bill tracks: supplier, receipt date, payment terms, purchase order reference
- Can't combine them - they're fundamentally different transactions

---

#### **How Things Should Connect (Automation):**

**When you create a BILL (purchase from supplier):**
Your software should AUTOMATICALLY:

1. ✅ Create journal entry:
   - Debit Inventory
   - Debit VAT Input
   - Credit Accounts Payable
2. ✅ Update inventory quantity (increase)
3. ✅ Update supplier balance (increase what you owe)
4. ❌ Do NOT let user manually create the journal entry (error-prone!)

**When you create an INVOICE (sale to customer):**
Your software should AUTOMATICALLY:

1. ✅ Create TWO journal entries:
   - Entry 1: Debit A/R, Credit Sales, Credit VAT Output
   - Entry 2: Debit COGS, Credit Inventory
2. ✅ Update inventory quantity (decrease)
3. ✅ Update customer balance (increase what they owe)
4. ✅ Calculate COGS based on inventory costing method (FIFO/Average)
5. ❌ Do NOT let user manually pick inventory cost (use system cost!)

**When you record a PAYMENT (customer pays you):**
Your software should AUTOMATICALLY:

1. ✅ Create journal entry:
   - Debit Cash/Bank
   - Credit Accounts Receivable
2. ✅ Update customer balance (decrease what they owe)
3. ✅ Mark invoice as "Paid" or "Partially Paid"
4. ✅ Allow applying payment to multiple invoices

**Manual Journal Entries:**
❌ Regular users should NOT create manual journal entries for normal transactions
✅ Only accountants/admins should access this for:

- Month-end adjustments (depreciation, accruals)
- Corrections/reversals
- Non-standard transactions

---

#### **Timing Questions:**

**When does inventory decrease?**
✅ **When you create the INVOICE** (or when you ship, if you track shipping separately)

- This is when you "sell" the goods
- COGS is recorded at this exact moment
- Doesn't matter when customer pays - inventory already left

**When do you count revenue?**
✅ **When you create the INVOICE** (accrual accounting)

- You earned it when you delivered/invoiced
- Customer payment comes later
- This is standard accounting practice in Philippines (and most countries)

**Accrual vs Cash Basis:**

- **Accrual** (RECOMMENDED for most businesses):

  - Record revenue when earned (invoice), not when paid
  - Record expense when incurred (bill), not when paid
  - Gives accurate picture of profitability
  - Required for VAT-registered businesses in Philippines

- **Cash** (Only for very small businesses):
  - Record revenue when you receive cash
  - Record expense when you pay cash
  - Simpler but less accurate
  - NOT recommended if you have inventory or credit sales

**Your software should use ACCRUAL accounting!**

---

#### **What Software Should BLOCK:**

**Hard Blocks (Prevent the transaction):**

1. 🚫 Selling more than available inventory

   - Check: `itemQuantity <= availableStock`
   - Error: "Insufficient stock. Available: 10, Requested: 50"

2. 🚫 Deleting an invoice that has been paid

   - Check: `invoice.status !== 'paid'`
   - Error: "Cannot delete paid invoice. Void it instead."

3. 🚫 Changing invoice amount after it's been partially/fully paid

   - Check: `invoice.totalPaid === 0`
   - Error: "Cannot edit invoice with payments. Create credit note instead."

4. 🚫 Creating transaction without required fields

   - Customer, date, at least one line item, etc.

5. 🚫 Posting to a closed accounting period
   - Check: `transactionDate >= closedPeriodDate`
   - Error: "Period is closed. Contact admin to reopen."

**Soft Warnings (Allow but warn):**

1. ⚠️ Invoice amount unusually high/low for this customer

   - Warning: "This invoice is 5x larger than typical. Confirm?"

2. ⚠️ Selling below cost

   - Warning: "Selling price (₱400) is below cost (₱500). Loss of ₱100 per unit."

3. ⚠️ Customer credit limit exceeded

   - Warning: "Customer owes ₱100,000. Credit limit is ₱80,000. Proceed?"

4. ⚠️ Duplicate invoice/bill detection

   - Warning: "Similar invoice exists for this customer on this date. Is this a duplicate?"

5. ⚠️ Inventory running low
   - Warning: "Stock will be 5 units after this sale. Below reorder point (10 units)."

---

#### **Common Mistakes to Prevent:**

**1. Data Entry Errors:**

- ✅ Validate dates (can't invoice in future or too far in past)
- ✅ Validate amounts (no negative quantities, prices must be positive)
- ✅ Auto-calculate totals (line total, subtotal, VAT, grand total)
- ✅ Default to today's date

**2. Accounting Errors:**

- ✅ Ensure debits = credits in journal entries
- ✅ Prevent unbalanced entries from being saved
- ✅ Auto-generate journal entries from transactions (don't let users create manually)

**3. Inventory Errors:**

- ✅ Use inventory costing method consistently (FIFO or Average, pick one!)
- ✅ Prevent negative inventory (unless you explicitly allow backorders)
- ✅ Require reason for inventory adjustments
- ✅ Track who made adjustments and when

**4. VAT Errors:**

- ✅ Calculate VAT automatically (12% in Philippines)
- ✅ Store VAT amount separately (don't embed in price)
- ✅ Handle VAT-exempt vs VAT-able items correctly
- ✅ Let users override VAT rate for special cases (with permission)

**5. Workflow Errors:**

- ✅ Invoice → Payment (not the other way around)
- ✅ Can't pay more than invoice amount
- ✅ Can't delete entities that have dependencies (e.g., customer with invoices)

---

### 📝 Summary for Scenario 5:

- **Modules:** Need separate modules for Invoices, Bills, Payments - they're different!
- **Automation:** Auto-create journal entries from transactions
- **Timing:** Invoice = Revenue (not payment), Bill = Expense (not payment)
- **Accrual Accounting:** Standard for businesses with inventory
- **Validation:** Block impossible transactions, warn about unusual ones
- **Key Point:** Software should enforce accounting rules automatically - don't make users think about debits/credits!

---

## 🎯 What Would REALLY Help Me

### A Real Example:

Below is a **complete month of transactions** with every journal entry. Use this to test your software!

---

#### **ABC Shirt Company - January 2026**

**Starting Balances (Jan 1):**

- Cash: ₱100,000
- Inventory: 0 shirts
- All other accounts: 0

---

**Transaction 1 - Jan 5: Buy 100 shirts from XYZ Supplier**

- Cost: ₱500 per shirt = ₱50,000
- VAT: ₱6,000
- Total: ₱56,000
- Terms: Pay in 30 days

```
Journal Entry:
Debit:  Inventory                 ₱50,000
Debit:  VAT Input                 ₱6,000
Credit: Accounts Payable          ₱56,000
```

---

**Transaction 2 - Jan 10: Sell 30 shirts to Customer A**

- Price: ₱800 per shirt = ₱24,000
- VAT: ₱2,880
- Total: ₱26,880
- Invoice #001
- Terms: Pay in 15 days

```
Journal Entry 1 (Sale):
Debit:  Accounts Receivable       ₱26,880
Credit: Sales Revenue             ₱24,000
Credit: VAT Output                ₱2,880

Journal Entry 2 (Cost):
Debit:  Cost of Goods Sold        ₱15,000  (30 × ₱500)
Credit: Inventory                 ₱15,000
```

---

**Transaction 3 - Jan 12: Pay rent for January**

- Amount: ₱10,000
- Paid cash

```
Journal Entry:
Debit:  Rent Expense              ₱10,000
Credit: Cash                      ₱10,000
```

---

**Transaction 4 - Jan 15: Buy 50 more shirts from XYZ Supplier**

- Cost: ₱520 per shirt = ₱26,000 (price went up!)
- VAT: ₱3,120
- Total: ₱29,120
- Terms: Pay in 30 days

```
Journal Entry:
Debit:  Inventory                 ₱26,000
Debit:  VAT Input                 ₱3,120
Credit: Accounts Payable          ₱29,120
```

---

**Transaction 5 - Jan 18: Sell 40 shirts to Customer B**

- Price: ₱850 per shirt = ₱34,000
- VAT: ₱4,080
- Total: ₱38,080
- Invoice #002
- Terms: Pay in 15 days

**Note:** Using FIFO costing:

- First 40 shirts from older batch @ ₱500 each

```
Journal Entry 1 (Sale):
Debit:  Accounts Receivable       ₱38,080
Credit: Sales Revenue             ₱34,000
Credit: VAT Output                ₱4,080

Journal Entry 2 (Cost):
Debit:  Cost of Goods Sold        ₱20,000  (40 × ₱500 - all from first batch)
Credit: Inventory                 ₱20,000
```

---

**Transaction 6 - Jan 25: Customer A pays Invoice #001**

- Receives: ₱26,880

```
Journal Entry:
Debit:  Cash                      ₱26,880
Credit: Accounts Receivable       ₱26,880
```

---

**Transaction 7 - Jan 28: Pay XYZ Supplier for first purchase (Jan 5)**

- Amount: ₱56,000

```
Journal Entry:
Debit:  Accounts Payable          ₱56,000
Credit: Cash                      ₱56,000
```

---

**Transaction 8 - Jan 31: Physical inventory count**

- System says: 80 shirts (100 + 50 - 30 - 40 = 80)
- Physical count: 78 shirts
- Missing: 2 shirts @ ₱500 each = ₱1,000

```
Journal Entry:
Debit:  Inventory Loss            ₱1,000
Credit: Inventory                 ₱1,000
```

---

**Transaction 9 - Jan 31: Record salaries (paid on Jan 30)**

- Amount: ₱15,000

```
Journal Entry:
Debit:  Salaries Expense          ₱15,000
Credit: Cash                      ₱15,000
```

---

**Transaction 10 - Jan 31: VAT Settlement**

- VAT Output collected: ₱2,880 + ₱4,080 = ₱6,960
- VAT Input paid: ₱6,000 + ₱3,120 = ₱9,120
- Net: You overpaid ₱2,160 (refundable or carry forward)

```
Journal Entry:
Debit:  VAT Output                ₱6,960
Debit:  VAT Refundable            ₱2,160
Credit: VAT Input                 ₱9,120
```

---

### 📊 **ENDING BALANCES (Jan 31):**

**Balance Sheet:**

```
ASSETS:
  Cash                            ₱45,880   (100K + 26,880 - 10K - 56K - 15K)
  Accounts Receivable             ₱38,080   (Invoice #002 unpaid)
  Inventory                       ₱40,000   (78 shirts: 30@₱500 + 48@₱520)
  VAT Refundable                  ₱2,160
  TOTAL ASSETS                    ₱126,120

LIABILITIES:
  Accounts Payable                ₱29,120   (Second purchase unpaid)
  TOTAL LIABILITIES               ₱29,120

EQUITY:
  Capital                         ₱100,000  (What you started with)
  Net Income                      ₱-3,000   (Loss this month - see below)
  TOTAL EQUITY                    ₱97,000

TOTAL LIABILITIES + EQUITY        ₱126,120  ✅ Balances!
```

**Income Statement:**

```
REVENUE:
  Sales Revenue                   ₱58,000   (24K + 34K)

COST OF GOODS SOLD:
  Cost of Goods Sold              ₱35,000   (15K + 20K)

GROSS PROFIT:                     ₱23,000

EXPENSES:
  Rent Expense                    ₱10,000
  Salaries Expense                ₱15,000
  Inventory Loss                  ₱1,000
  TOTAL EXPENSES                  ₱26,000

NET INCOME (LOSS):                ₱-3,000   (Loss - expenses > gross profit)
```

---

### 💡 **KEY INSIGHTS FROM THIS EXAMPLE:**

1. **You can be profitable on sales (₱23,000 gross profit) but have a net loss due to expenses**
2. **Cash (₱45,880) ≠ Profit (-₱3,000)** - You have cash because customer paid and you started with ₱100K
3. **Inventory value (₱40,000)** uses FIFO: older shirts @ ₱500, newer @ ₱520
4. **VAT is separate** from revenue/costs - it's just pass-through to government
5. **Accrual accounting:** Revenue recorded when invoiced (₱58K), even though only ₱26,880 cash received

This example is PERFECT for testing your software! 🎉

---

### Things I Can Bring to Our Meeting:

1. ✅ Screenshots of what I've built so far
2. ✅ My database structure (how I'm storing the data)
3. ✅ Sample reports I'm generating
4. ✅ This completed example above to validate
5. ✅ You can tell me if I'm on the right track!

---

## ⚠️ Edge Cases I'm Worried About

---

### **Returns & Reversals:**

#### **Customer Returns Something:**

**Scenario:** Customer B returns 5 shirts from Invoice #002 (they were defective)

- Original sale: 5 shirts @ ₱850 = ₱4,250 + ₱510 VAT = ₱4,760 total
- Original cost: 5 shirts @ ₱500 = ₱2,500

**Solution: Create a Credit Note (reverse the sale)**

```
Journal Entry 1 (Reverse the sale):
Debit:  Sales Revenue             ₱4,250
Debit:  VAT Output                ₱510
Credit: Accounts Receivable       ₱4,760

Journal Entry 2 (Return inventory):
Debit:  Inventory                 ₱2,500
Credit: Cost of Goods Sold        ₱2,500
```

**What this does:**

- Reduces the customer's balance owed
- Reduces your revenue (you didn't really earn it)
- Puts inventory back in stock
- Adjusts VAT (you didn't collect that VAT after all)

**If customer already paid:** You now owe them ₱4,760 (refund or credit toward future purchase)

---

#### **You Return Something to Supplier:**

**Scenario:** 10 shirts from second purchase were damaged, returning to XYZ Supplier

- Original cost: 10 shirts @ ₱520 = ₱5,200 + ₱624 VAT = ₱5,824

**Solution: Create a Debit Note**

```
Journal Entry:
Debit:  Accounts Payable          ₱5,824
Credit: Inventory                 ₱5,200
Credit: VAT Input                 ₱624
```

**What this does:**

- Reduces what you owe supplier
- Removes inventory (you don't have it anymore)
- Reverses the VAT input claim

---

### **Discrepancies & Adjustments:**

#### **Bill Amount ≠ Purchase Order Amount:**

**Scenario:** PO says ₱56,000, but bill arrives for ₱57,120 (supplier added ₱1,000 shipping fee + ₱120 VAT)

**Solution: Record the actual bill amount**

```
Journal Entry:
Debit:  Inventory (or Freight-In)  ₱51,000  (Original ₱50K + ₱1K shipping)
Debit:  VAT Input                  ₱6,120   (Original ₱6K + ₱120)
Credit: Accounts Payable           ₱57,120  (What you actually owe)
```

**Alternative:** If shipping is significant, create separate expense account:

```
Debit:  Inventory                 ₱50,000
Debit:  Freight-In Expense        ₱1,000
Debit:  VAT Input                 ₱6,120
Credit: Accounts Payable          ₱57,120
```

**Key:** Always record what you ACTUALLY owe, not what the PO said. Then investigate the difference.

---

#### **Quantity Received ≠ Quantity Ordered:**

**Scenario:** Ordered 100 shirts, but only 85 arrived. Supplier will send remaining 15 next week.

**Solution: Record what you actually received**

```
Journal Entry (85 shirts):
Debit:  Inventory                 ₱42,500  (85 × ₱500)
Debit:  VAT Input                 ₱5,100
Credit: Accounts Payable          ₱47,600
```

**When remaining 15 arrive:**

```
Journal Entry (15 shirts):
Debit:  Inventory                 ₱7,500   (15 × ₱500)
Debit:  VAT Input                 ₱900
Credit: Accounts Payable          ₱8,400
```

**If supplier can't send remaining 15:** They credit your account ₱8,400 (debit A/P, credit the original entry)

---

#### **Physical Count ≠ Computer Records:**

**Scenario:** System says 80 shirts, you count 75 shirts (5 missing)

**Solution: Adjust to reality**

```
Journal Entry:
Debit:  Inventory Loss/Shrinkage  ₱2,500   (5 × ₱500)
Credit: Inventory                 ₱2,500
```

**Best Practice:**

- Investigate WHY (theft, damage, miscounting, unrecorded sales)
- Document the reason in the adjustment
- If you find them later, reverse the adjustment
- Regular cycle counts help catch issues early

---

### **Different Tax Situations:**

#### **VAT-Registered Customer:**

**Normal case** (what we've been doing):

```
Invoice: ₱24,000 + ₱2,880 VAT = ₱26,880
Entry: DR A/R ₱26,880, CR Sales ₱24,000, CR VAT Output ₱2,880
```

---

#### **NON-VAT Customer (or VAT-Exempt Item):**

**Scenario:** Customer is not VAT-registered or item is VAT-exempt

**Solution: No VAT on the sale**

```
Invoice: ₱24,000 (no VAT)
Entry:
Debit:  Accounts Receivable       ₱24,000
Credit: Sales Revenue             ₱24,000
```

**Key:** Your purchase still had VAT input (₱6,000), but you can't pass it on to this customer. You eat the cost or price it in.

---

#### **Zero-Rated Sale (Export):**

**Scenario:** Selling to overseas customer (export)

```
Invoice: ₱24,000 + ₱0 VAT (0%)
Entry:
Debit:  Accounts Receivable       ₱24,000
Credit: Sales Revenue             ₱24,000
```

**But:** You can still claim your VAT Input (₱6,000) as refundable!

- This is different from VAT-exempt
- Zero-rated = 0% VAT but you can claim input VAT
- VAT-exempt = no VAT and you CAN'T claim input VAT

**In your software:**

- Track VAT status: VATable, VAT-Exempt, Zero-Rated
- Calculate accordingly based on status
- BIR has specific forms for each type!

---

#### **Mixed Sales (Some VATable, Some Exempt):**

**Scenario:** Selling both VATable items and exempt items in one invoice

**Solution: Calculate separately**

```
Invoice:
  Item A (VATable): ₱10,000 + ₱1,200 VAT = ₱11,200
  Item B (Exempt):  ₱5,000 + ₱0 VAT = ₱5,000
  Total: ₱16,200

Entry:
Debit:  Accounts Receivable       ₱16,200
Credit: Sales Revenue (VATable)   ₱10,000
Credit: Sales Revenue (Exempt)    ₱5,000
Credit: VAT Output                ₱1,200
```

**Your software should:**

- Track VAT status per item in inventory
- Calculate line-by-line
- Separate on reports (BIR needs this!)

---

### 📝 Summary for Edge Cases:

**Returns:**

- Customer return = Credit Note (reverse sale + return inventory)
- Supplier return = Debit Note (reduce payable + remove inventory)

**Discrepancies:**

- Always record ACTUAL amounts (investigate differences later)
- Adjust inventory to physical count (expense the difference)

**Tax Situations:**

- VATable = Standard (12% VAT)
- VAT-Exempt = No VAT, can't claim input VAT
- Zero-Rated = 0% VAT, CAN claim input VAT
- Track and report each type separately!

**Key Point:** Your software should handle all these scenarios with proper options/flags!

---

## �‍♀️ BONUS: Service-Based Businesses (Salon, Consulting, etc.)

**Story:** What if I'm not selling physical products, but services? Like a salon offering haircuts, coloring, massage?

---

### ✅ THE ANSWER:

Services are **simpler** than inventory in some ways, but different in others!

#### **Key Differences from Product Sales:**

| Aspect             | Product Business      | Service Business           |
| ------------------ | --------------------- | -------------------------- |
| **Inventory**      | Track physical goods  | No inventory of "services" |
| **COGS**           | Cost of products sold | Labor cost + supplies used |
| **When to record** | When goods delivered  | When service performed     |
| **Tracking**       | Quantity in stock     | Service offerings catalog  |

---

### **Scenario: Salon Haircut Service**

**Story:** Customer gets a haircut for ₱500 + ₱60 VAT = ₱560

#### **When the service is performed (and invoiced):**

```
Journal Entry (Revenue only):
Debit:  Accounts Receivable       ₱560
Credit: Service Revenue           ₱500
Credit: VAT Output                ₱60
```

**That's it!** No COGS entry because:

- You didn't "sell" a physical product
- The haircut doesn't come from inventory
- Labor cost is already expensed (stylist salary)

---

### **But What About Supplies?**

**Scenario:** During the haircut, you used ₱50 worth of shampoo/conditioner

**Two approaches:**

#### **Approach 1: Expense Supplies When Purchased (Simple)**

When you buy supplies:

```
Debit:  Supplies Expense          ₱5,000   (Bought shampoo in bulk)
Debit:  VAT Input                 ₱600
Credit: Cash/Accounts Payable     ₱5,600
```

When you perform service:

```
(No additional entry - supplies already expensed)
Debit:  Accounts Receivable       ₱560
Credit: Service Revenue           ₱500
Credit: VAT Output                ₱60
```

**Pro:** Simple, less tracking  
**Con:** Doesn't match revenue to exact cost

---

#### **Approach 2: Track Supplies as Inventory (More Accurate)**

When you buy supplies:

```
Debit:  Supplies Inventory        ₱5,000
Debit:  VAT Input                 ₱600
Credit: Cash/Accounts Payable     ₱5,600
```

When you perform service:

```
Entry 1 (Revenue):
Debit:  Accounts Receivable       ₱560
Credit: Service Revenue           ₱500
Credit: VAT Output                ₱60

Entry 2 (Cost of supplies used):
Debit:  Supplies Expense          ₱50      (Actual cost of shampoo used)
Credit: Supplies Inventory        ₱50
```

**Pro:** Better matching of revenue to cost  
**Con:** More complex, need to track usage

**Most small service businesses use Approach 1.** Use Approach 2 if supplies are significant cost.

---

### **What About Labor (Stylist) Cost?**

**Scenario:** You pay stylist ₱15,000/month salary

**Record when you pay:**

```
Debit:  Salaries Expense          ₱15,000
Credit: Cash                      ₱15,000
```

**This is an Operating Expense, NOT Cost of Goods Sold!**

Your Income Statement looks like:

```
Service Revenue                   ₱50,000   (Monthly revenue)
Cost of Goods Sold                ₱0        (No COGS for services)
Gross Profit                      ₱50,000

Operating Expenses:
  Salaries Expense                ₱15,000
  Rent Expense                    ₱10,000
  Supplies Expense                ₱2,000
  Utilities                       ₱3,000
Total Expenses                    ₱30,000

Net Income                        ₱20,000
```

**Note:** Some accountants DO put labor as COGS for service businesses. Ask your accountant their preference!

---

### **Mixed Business: Products + Services**

**Scenario:** Salon sells both services (haircut) AND products (shampoo bottles)

#### **Service Sale (Haircut):**

```
Debit:  Accounts Receivable       ₱560
Credit: Service Revenue           ₱500
Credit: VAT Output                ₱60
```

#### **Product Sale (Shampoo Bottle):**

```
Entry 1 (Sale):
Debit:  Accounts Receivable       ₱336
Credit: Product Sales Revenue     ₱300
Credit: VAT Output                ₱36

Entry 2 (Cost):
Debit:  Cost of Goods Sold        ₱150     (What you paid for the shampoo)
Credit: Inventory                 ₱150
```

**Your Income Statement:**

```
REVENUE:
  Service Revenue                 ₱50,000
  Product Sales Revenue           ₱10,000
  Total Revenue                   ₱60,000

COST OF GOODS SOLD:
  COGS (Products only)            ₱5,000    (Only for product sales)
Gross Profit                      ₱55,000

OPERATING EXPENSES:
  Salaries                        ₱15,000
  Supplies (for services)         ₱2,000
  Rent, utilities, etc.           ₱13,000
Total Expenses                    ₱30,000

NET INCOME                        ₱25,000
```

---

### **Service Packages & Prepaid Services**

**Scenario:** Customer buys a "10 Haircut Package" for ₱4,480 (₱4,000 + ₱480 VAT) upfront

#### **When customer pays upfront:**

```
Debit:  Cash                      ₱4,480
Credit: Unearned Revenue          ₱4,000   (Liability - you haven't performed yet!)
Credit: VAT Output                ₱480
```

#### **Each time customer uses one haircut:**

```
Debit:  Unearned Revenue          ₱400     (1/10th of ₱4,000)
Credit: Service Revenue           ₱400     (Now you earned it)
```

**After 10 haircuts:** Unearned Revenue = ₱0, Service Revenue = ₱4,000

**Why this way?**

- Cash ≠ Revenue! You got the cash upfront, but haven't EARNED it until you perform the service
- Unearned Revenue is a LIABILITY (you owe them 10 haircuts)
- As you perform services, liability decreases and revenue increases

---

### **Software Implementation for Services:**

**Database Structure:**

**Services Table:**

```
{
  id: "svc_001",
  name: "Haircut",
  description: "Basic haircut service",
  price: 500,
  vatRate: 12,
  category: "Hair Services",
  duration: 30, // minutes
  isActive: true
}
```

**Service Invoice Line Items:**

```
{
  invoiceId: "INV-001",
  serviceId: "svc_001",  // Reference to Services table (not Inventory)
  quantity: 1,           // Usually 1 for services, but could be hours
  unitPrice: 500,
  lineTotal: 500,
  vat: 60,
  totalAmount: 560
}
```

**Key Differences from Product Invoice:**

- Reference `serviceId` instead of `inventoryItemId`
- No inventory deduction
- No automatic COGS entry (unless you track supplies)
- Quantity often = 1 (or hours/time units)

---

### **What Your Software Should Support:**

**For Service Businesses:**

1. ✅ Service catalog (like inventory catalog, but no stock tracking)
2. ✅ Service invoicing (same as product invoicing, just different source)
3. ✅ Time tracking (optional - for billable hours)
4. ✅ Prepaid services / packages (unearned revenue tracking)
5. ✅ Mixed invoices (services + products on same invoice)
6. ✅ Commission tracking (if stylists get % of service revenue)

**Invoice Creation:**

- Let user select: Product OR Service
- If Product: Check stock, create COGS entry
- If Service: No stock check, no COGS entry (or minimal supplies cost)
- Calculate VAT same way for both

**Reports:**

- Separate Service Revenue from Product Revenue
- Show COGS only for products (or separate "Cost of Services" if tracking supplies)
- Service performance reports (which services sold most, revenue per service)

---

### 📝 Summary for Services:

**Key Points:**

- **No inventory** of services (but can track supplies separately)
- **Revenue** recorded when service performed (same as products)
- **COGS** usually ₱0 (labor is Operating Expense, not COGS)
- **Supplies** can be expensed immediately OR tracked as inventory
- **Prepaid services** = Unearned Revenue (liability) until performed
- **Mixed businesses** track both products and services separately

**Software Design:**

- Separate Services table (like Products, but no quantity tracking)
- Invoice line items can reference either Products OR Services
- Auto COGS entry only for products, not services
- Support unearned revenue for prepaid packages

**Ask your accountant:**

- Do you want labor cost as COGS or Operating Expense?
- Should we track supplies as inventory or expense immediately?
- Any special reporting needed for service vs product revenue?

---

## �📝 My Notes Section

**Date:** ****\_\_\_****  
**Accountant:** ****\_\_\_****

### Main Takeaways:

1.
2.
3.

### Things I Need to Change in My Software:

- [ ]
- [ ]
- [ ]

### Things I Need to Research More:

- [ ]
- [ ]

---

## 💡 Remember for the Meeting

- ✅ Bring a notepad and pen
- ✅ Ask them to draw/diagram the flow if it helps
- ✅ Request sample documents (anonymized invoices, reports, etc.)
- ✅ It's okay to ask "why?" or "can you show me an example?"
- ✅ Record the conversation (with permission) for reference later
- ✅ Don't worry about sounding "not smart enough" - you're learning!

**The goal:** Understand the FLOW and LOGIC, not memorize accounting rules.
