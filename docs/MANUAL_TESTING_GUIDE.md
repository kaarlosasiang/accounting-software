# Manual Testing Guide — "Kusina ni Maria" Business Journey

> **You are Maria Santos**, a Filipino entrepreneur opening a small restaurant and catering business in Makati City.
> This guide walks you through setting up your accounting system from Day 1 as a new business owner.

---

## Prerequisites

- Backend running on `http://localhost:4000`
- Frontend running on `http://localhost:3000`
- Start both with: `pnpm run dev:app` from the project root

---

## The Business Story

**Kusina ni Maria** is a small Filipino restaurant in Poblacion, Makati. Maria also offers catering services for corporate events. Her first big client is **Mabuhay Events Corporation** — an events company that regularly orders catering for office lunches and corporate functions.

Maria buys her ingredients from **Fresh Harvest Market** in Quezon City. She needs to track her inventory (rice, vegetables, meat), send invoices to her catering clients, pay her suppliers, and see if she's actually making money.

---

## Phase 1: Opening Day — Register & Set Up Your Business

> _"I just registered my business with the DTI. Time to set up my books!"_

### Step 1.1 — Create Your Account

| Step | Action                                                      | Expected Result                                        |
| ---- | ----------------------------------------------------------- | ------------------------------------------------------ |
| 1    | Navigate to `http://localhost:3000/signup`                  | Registration form appears                              |
| 2    | Fill in: **Maria** Santos, email, phone, username, password | All fields accept input                                |
| 3    | Click **Sign Up**                                           | Email OTP verification screen appears                  |
| 4    | Enter the 6-digit OTP from your email                       | Verification succeeds — redirected to `/company-setup` |

### Step 1.2 — Set Up Your Company

> The form is pre-filled with "Kusina ni Maria" details. Review and submit.

| Step | Action                                                                               | Expected Result                                                          |
| ---- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| 1    | You land on `/company-setup`                                                         | Company setup form appears — **pre-filled** with Kusina ni Maria details |
| 2    | Review: Name = "Kusina ni Maria", Type = Sole Proprietorship, Industry = Hospitality | All fields pre-populated correctly                                       |
| 3    | Review: Address = Poblacion Makati, Currency = PESO, Fiscal Year = Jan 1 2026        | Location and financial settings correct                                  |
| 4    | Click **Create Company**                                                             | Organization created — redirected to `/plans`                            |

### Step 1.3 — Choose a Plan

| Step | Action                                                     | Expected Result                         |
| ---- | ---------------------------------------------------------- | --------------------------------------- |
| 1    | Three plan cards appear: Starter, Professional, Enterprise | Plans page loads with pricing           |
| 2    | Click **Get Started** on any plan                          | Subscription activated                  |
| 3    | Redirected to `/dashboard`                                 | Dashboard loads with sidebar navigation |

---

## Phase 2: Setting Up Your Books — Chart of Accounts & Starting Balances

> _"My accountant said I need to set up my chart of accounts first. These are the 'buckets' where all my money transactions go."_

### Step 2.1 — Create Your Essential Accounts

Create these accounts **one at a time** (the form pre-fills with "Cash on Hand" — change the values for each):

| Step | Navigate to        | Account Code | Account Name        | Type      | Normal Balance | Description                                                  |
| ---- | ------------------ | ------------ | ------------------- | --------- | -------------- | ------------------------------------------------------------ |
| 1    | `/accounts/create` | `1000`       | Cash on Hand        | Asset     | Debit          | Cash register and petty cash for daily restaurant operations |
| 2    | `/accounts/create` | `1010`       | BDO Savings Account | Asset     | Debit          | Business bank account at BDO Makati branch                   |
| 3    | `/accounts/create` | `1100`       | Accounts Receivable | Asset     | Debit          | Money owed by catering clients                               |
| 4    | `/accounts/create` | `1200`       | Inventory           | Asset     | Debit          | Value of ingredients and supplies on hand                    |
| 5    | `/accounts/create` | `2000`       | Accounts Payable    | Liability | Credit         | Money we owe to suppliers for ingredients                    |
| 6    | `/accounts/create` | `3000`       | Owner's Equity      | Equity    | Credit         | Maria's capital investment in the business                   |
| 7    | `/accounts/create` | `4000`       | Catering Revenue    | Revenue   | Credit         | Income from catering services                                |
| 8    | `/accounts/create` | `4010`       | Dine-in Revenue     | Revenue   | Credit         | Income from dine-in restaurant sales                         |
| 9    | `/accounts/create` | `5000`       | Cost of Goods Sold  | Expense   | Debit          | Cost of ingredients used in cooking                          |
| 10   | `/accounts/create` | `5010`       | Rent Expense        | Expense   | Debit          | Monthly restaurant rent                                      |
| 11   | `/accounts/create` | `5020`       | Utilities Expense   | Expense   | Debit          | Electric, water, gas bills                                   |
| 12   | `/accounts/create` | `5030`       | Salaries Expense    | Expense   | Debit          | Kitchen staff and server wages                               |

**Expected Result after each**: Success toast "Account created successfully" → redirected to accounts list.

### Step 2.2 — Verify Your Chart of Accounts

| Step | Action                                                      | Expected Result                                                                              |
| ---- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1    | Navigate to **Chart of Accounts → All Accounts** in sidebar | All 12 accounts visible in the table                                                         |
| 2    | Click the **Assets** filter tab                             | Shows: Cash on Hand (1000), BDO Savings (1010), Accounts Receivable (1100), Inventory (1200) |
| 3    | Click the **Expense** filter tab                            | Shows: COGS (5000), Rent (5010), Utilities (5020), Salaries (5030)                           |
| 4    | Click the **Revenue** filter tab                            | Shows: Catering Revenue (4000), Dine-in Revenue (4010)                                       |

### Step 2.3 — Enter Starting Balances (Opening Balances)

> _"I need my Day 1 balances in the system so reports and ledgers start correctly."_

Use your **account opening balance** flow (or one opening journal entry, depending on your current UI):

| Step | Account                    | Starting Balance | Side   | Expected Effect                               |
| ---- | -------------------------- | ---------------- | ------ | --------------------------------------------- |
| 1    | Cash on Hand (1000)        | ₱50,000          | Debit  | Cash asset starts with opening amount         |
| 2    | BDO Savings Account (1010) | ₱150,000         | Debit  | Bank asset starts with opening amount         |
| 3    | Inventory (1200)           | ₱40,000          | Debit  | Beginning stock value reflected               |
| 4    | Accounts Payable (2000)    | ₱15,000          | Credit | Existing supplier obligations carried forward |
| 5    | Owner's Equity (3000)      | ₱225,000         | Credit | Opening capital balances debits and credits   |

**Expected Result**:

- Opening balances save successfully
- Total Debits = Total Credits (₱240,000 each)
- No validation error about unbalanced entry

### Step 2.4 — Validate Opening Balances in Journals and Ledger

| Step | Action                                              | Expected Result                                                            |
| ---- | --------------------------------------------------- | -------------------------------------------------------------------------- |
| 1    | Go to **General Ledger → Journal Entries**          | One opening entry (or grouped opening entries) exists for Day 1            |
| 2    | Open that entry                                     | Lines match opening balances and entry is balanced (debits = credits)      |
| 3    | Go to **General Ledger → Ledger**                   | Each account shows opening balance as the first movement/beginning balance |
| 4    | Check Cash on Hand (1000) and Owner's Equity (3000) | Cash shows +₱50,000 debit; Equity shows +₱225,000 credit                   |
| 5    | Check Inventory (1200) and Accounts Payable (2000)  | Inventory debit and A/P credit appear correctly                            |

> **Control point**: If opening balances do not appear in ledger, month-end reports will be wrong even if later transactions are correct.

---

## Phase 3: Know Your People — Customers & Suppliers

> _"I need to add my first catering client and my ingredient supplier."_

### Step 3.1 — Add Your First Customer (Catering Client)

| Step | Action                                                                   | Expected Result                                                      |
| ---- | ------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| 1    | Click **Sales & Receivables → Customers** in sidebar                     | Customers page loads (empty table)                                   |
| 2    | Click **Add Customer**                                                   | Customer form opens — **pre-filled** with Mabuhay Events Corporation |
| 3    | Review: Code = `CUST-001`, Name = "Mabuhay Events Corporation"           | Corporate catering client details shown                              |
| 4    | Review: Email = `events@mabuhayevents.ph`, Address = Ayala Tower, Makati | Contact details correct                                              |
| 5    | Review: Payment Terms = Net 30, Credit Limit = ₱100,000                  | They pay within 30 days, up to ₱100k outstanding                     |
| 6    | Click **Create**                                                         | Success toast — customer appears in table with "Active" status       |

> **Why Net 30?** Corporate clients typically pay invoices within 30 days, not immediately.

### Step 3.2 — Add a Second Customer

| Step | Action                                                    | Expected Result                           |
| ---- | --------------------------------------------------------- | ----------------------------------------- |
| 1    | Click **Add Customer** again                              | Fresh form opens with pre-filled defaults |
| 2    | Change to: Code = `CUST-002`, Name = "BPO Solutions Inc." | —                                         |
| 3    | Email = `admin@bposolutions.ph`, Credit Limit = `75000`   | —                                         |
| 4    | Click **Create**                                          | Second customer appears in table          |

### Step 3.3 — Add Your Ingredient Supplier

| Step | Action                                                     | Expected Result                                                  |
| ---- | ---------------------------------------------------------- | ---------------------------------------------------------------- |
| 1    | Click **Purchases & Payables → Vendors** in sidebar        | Suppliers page loads (empty table)                               |
| 2    | Click **Add Supplier**                                     | Slide-over form opens — **pre-filled** with Fresh Harvest Market |
| 3    | Review: Code = `SUP-001`, Name = "Fresh Harvest Market"    | Quezon City vegetable/meat supplier                              |
| 4    | Review: Payment Terms = Net 15, Tax ID = `789-012-345-000` | Supplier expects payment in 15 days                              |
| 5    | Click **Save**                                             | Success toast — supplier appears in table                        |

> **Why Net 15?** Fresh food suppliers need faster payment than corporate clients pay you (Net 30). This is normal cash flow pressure for restaurants.

### Step 3.4 — Add a Second Supplier

| Step | Action                                                              | Expected Result                     |
| ---- | ------------------------------------------------------------------- | ----------------------------------- |
| 1    | Click **Add Supplier** again                                        | Fresh form with pre-filled defaults |
| 2    | Change to: Code = `SUP-002`, Name = "Manila Rice Trading Co."       | —                                   |
| 3    | Email = `sales@manilarice.ph`, Notes = "Rice supplier, bulk orders" | —                                   |
| 4    | Click **Save**                                                      | Second supplier appears in table    |

---

## Phase 4: Stock Your Kitchen — Inventory

> _"I need to track what ingredients I have so I know when to reorder."_

### Step 4.1 — Add Your Main Ingredient (Product)

| Step | Action                                                                        | Expected Result                                                     |
| ---- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 1    | Click **Inventory → Products** in sidebar                                     | Inventory page loads                                                |
| 2    | Click **Add Product**                                                         | Inventory form opens — **pre-filled** with "Premium Rice 25kg Sack" |
| 3    | Review: SKU = `RICE-25KG`, Cost = ₱1,400/sack, Qty on Hand = 10               | Your current rice stock                                             |
| 4    | Review: Reorder Level = 5                                                     | System alerts you when you drop below 5 sacks                       |
| 5    | Select **Inventory Account** = Inventory (1200)                               | Where inventory value is tracked on your balance sheet              |
| 6    | Select **COGS Account** = Cost of Goods Sold (5000)                           | Expense when you use the rice                                       |
| 7    | Select **Income Account** = Catering Revenue (4000) or Dine-in Revenue (4010) | Revenue account when you sell dishes using this ingredient          |
| 8    | Click **Save**                                                                | Success toast — rice appears in inventory list                      |

### Step 4.2 — Add a Catering Service

| Step | Action                                                                    | Expected Result                                                        |
| ---- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1    | Click **Inventory → Services** or **Add Service**                         | Service form opens — **pre-filled** with "Catering Service (per head)" |
| 2    | Review: SKU = `SVC-CATERING`, Price = ₱450/head                           | What you charge clients per person                                     |
| 3    | Review: Description includes food prep, delivery, setup, serving, cleanup | Full service package                                                   |
| 4    | Select **Income Account** = Catering Revenue (4000)                       | Revenue goes to the right account                                      |
| 5    | Click **Save**                                                            | Success toast — service appears in list                                |

> **Business insight**: Your catering costs about ₱180/head in ingredients. At ₱450/head, your gross margin is ~60%. That's healthy for food service.

---

## Phase 5: Your First Sale — Create an Invoice

> _"Mabuhay Events just ordered catering for their office party — 50 people! Time to send them an invoice."_

### Step 5.1 — Create the Catering Invoice

| Step | Action                                                                                        | Expected Result                                                                      |
| ---- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 1    | Click **Sales & Receivables → Create Invoice** in sidebar                                     | Invoice form loads with empty line items                                             |
| 2    | **Select Customer**: Choose "Mabuhay Events Corporation" from dropdown                        | Customer email auto-populates                                                        |
| 3    | **Line Item 1**: Type "Catering Service - 50 pax Corporate Lunch Buffet" in description field | Custom text entry                                                                    |
| 4    | **Or** click the 📦 button to select "Catering Service (per head)" from inventory             | Auto-fills description and rate (₱450)                                               |
| 5    | Set Quantity = 50, Rate = ₱450 (if not auto-filled) → **₱22,500**                             | Main catering charge                                                                 |
| 6    | Click **Add Line** for Line Item 2                                                            | New row appears                                                                      |
| 7    | **Line Item 2**: Type "Venue Setup & Event Coordination" × 1 @ ₱5,000 = **₱5,000**            | Custom item not in inventory                                                         |
| 8    | **Tax Rate**: Select "VAT (12%)" from dropdown (default)                                      | BIR-compliant Philippine VAT rate                                                    |
| 9    | Subtotal = ₱27,500, Tax (12%) = ₱3,300, **Total = ₱30,800**                                   | Automatically calculated with 12% VAT                                                |
| 10   | Click **Create** / **Save as Draft**                                                          | Invoice created with status **Draft**, number auto-generated (e.g., `INV-2026-0001`) |

> **Feature highlight**: You can type any description freely OR click the package icon (📦) to quickly select items from your inventory. This lets you add custom line items like "Venue Setup" that aren't tracked inventory items.

> **Tax rates (BIR-compliant)**: The system supports Philippine tax rates:
>
> - **VAT (12%)** - Standard rate for VAT-registered businesses (default)
> - **Percentage Tax (1-3%)** - For non-VAT registered businesses
> - **No Tax (0%)** - For VAT-exempt or zero-rated transactions

### Step 5.2 — Send the Invoice

| Step | Action                                   | Expected Result                                                       |
| ---- | ---------------------------------------- | --------------------------------------------------------------------- |
| 1    | Click on the invoice in the list         | Invoice detail page opens                                             |
| 2    | Click **Send Invoice**                   | Status changes from **Draft** → **Sent**                              |
| 3    | A journal entry is automatically created | Debit: Accounts Receivable ₱30,800 / Credit: Catering Revenue ₱30,800 |

> **Accounting principle**: When you send an invoice, you haven't received cash yet — but you've _earned_ the revenue. That's why AR (what they owe you) increases.

### Step 5.3 — Later: Receive Payment on the Invoice

> _"2 weeks later, Mabuhay Events pays half now."_

| Step | Action                                          | Expected Result                                     |
| ---- | ----------------------------------------------- | --------------------------------------------------- |
| 1    | On the invoice detail, click **Record Payment** | Payment form appears                                |
| 2    | Enter amount: `15400`, Method: Bank Transfer    | Partial payment (half of ₱30,800)                   |
| 3    | Click **Save**                                  | Invoice status → **Partial**, Balance due = ₱15,400 |
| 4    | Record another payment for `15400`              | Invoice status → **Paid**, Balance = ₱0             |

> **Cash flow reality**: Clients rarely pay all at once. Partial payments are normal.

---

## Phase 6: Buying Ingredients — Create a Bill

> _"I need to order this week's ingredients from Fresh Harvest Market."_

### Step 6.1 — Create the Purchase Bill

| Step | Action                                                                   | Expected Result                                           |
| ---- | ------------------------------------------------------------------------ | --------------------------------------------------------- |
| 1    | Click **Purchases & Payables → Purchase Bills** in sidebar               | Bills page loads                                          |
| 2    | Click **Create Bill**                                                    | Bill form opens — **pre-filled** with 3 line items        |
| 3    | **Select Supplier**: Choose "Fresh Harvest Market" from dropdown         | Supplier details populate                                 |
| 4    | Review Line Item 1: "Premium Rice 25kg Sack" × 5 @ ₱1,400 = **₱7,000**   | Rice stock                                                |
| 5    | Review Line Item 2: "Fresh Vegetables Assorted" × 10 @ ₱350 = **₱3,500** | Vegetables                                                |
| 6    | Review Line Item 3: "Pork Belly 5kg" × 4 @ ₱650 = **₱2,600**             | Meat                                                      |
| 7    | Select an **Expense Account** for each line item (e.g., COGS 5000)       | Links purchases to correct expense                        |
| 8    | Total = **₱13,100**                                                      | Weekly supplies cost                                      |
| 9    | Click **Create**                                                         | Bill created with status **Draft**, number auto-generated |

### Step 6.2 — Approve the Bill

| Step | Action                                | Expected Result                                                |
| ---- | ------------------------------------- | -------------------------------------------------------------- |
| 1    | On the bill detail, click **Approve** | Status changes from **Draft** → **Sent** (approved)            |
| 2    | Journal entry auto-created            | Debit: COGS/Expense ₱13,100 / Credit: Accounts Payable ₱13,100 |
| 3    | Supplier balance increases            | Fresh Harvest now shows ₱13,100 owed                           |

> **Accounting principle**: Approving a bill means you acknowledge you owe this money. AP (what you owe) increases.

### Step 6.3 — Pay the Supplier

> _"It's been 2 weeks, time to pay Fresh Harvest."_

| Step | Action                                            | Expected Result                      |
| ---- | ------------------------------------------------- | ------------------------------------ |
| 1    | On the bill, click **Record Payment**             | Payment form appears                 |
| 2    | Enter full amount: `13100`, Method: Bank Transfer | Full payment                         |
| 3    | Click **Save**                                    | Bill status → **Paid**, Balance = ₱0 |

---

## Phase 7: Record Your Monthly Expenses — Journal Entries

> _"I need to record my February rent and utilities."_

### Step 7.1 — Record Rent Payment

| Step | Action                                                              | Expected Result                                       |
| ---- | ------------------------------------------------------------------- | ----------------------------------------------------- |
| 1    | Click **General Ledger → Journal Entries** in sidebar               | Journal entries page loads                            |
| 2    | Click **Create Journal Entry**                                      | Form loads with date, description, debit/credit lines |
| 3    | Date: today, Description: `"February 2026 restaurant rent payment"` | Fields accept values                                  |
| 4    | **Debit**: Rent Expense (5010) — Amount: `18000`                    | Expense increases                                     |
| 5    | **Credit**: Cash on Hand (1000) — Amount: `18000`                   | Cash decreases                                        |
| 6    | Verify: Debits (₱18,000) = Credits (₱18,000) — **Balanced**         | Green "Balanced" indicator                            |
| 7    | Click **Save as Draft**                                             | Entry created with status Draft                       |
| 8    | Click **Post** on the draft entry                                   | Status → **Posted**, account balances update          |

### Step 7.2 — Record Utilities Payment

| Step | Action                                                      | Expected Result               |
| ---- | ----------------------------------------------------------- | ----------------------------- |
| 1    | Create another journal entry                                | —                             |
| 2    | Description: `"February utilities - Meralco electric bill"` | —                             |
| 3    | **Debit**: Utilities Expense (5020) — `8500`                | —                             |
| 4    | **Credit**: BDO Savings Account (1010) — `8500`             | Paid from bank account        |
| 5    | Save and Post                                               | Entry posted, balances update |

### Step 7.3 — Record Staff Salaries

| Step | Action                                                 | Expected Result   |
| ---- | ------------------------------------------------------ | ----------------- |
| 1    | Create another journal entry                           | —                 |
| 2    | Description: `"February salaries - 2 cooks, 1 server"` | —                 |
| 3    | **Debit**: Salaries Expense (5030) — `45000`           | 3 staff × ₱15,000 |
| 4    | **Credit**: Cash on Hand (1000) — `45000`              | Paid in cash      |
| 5    | Save and Post                                          | Entry posted      |

> **Why journal entries?** Every transaction must have equal debits and credits — this is the fundamental rule of double-entry bookkeeping. The system enforces this.

---

## Phase 8: Check Your Books — General Ledger & Reports

> _"End of the month. Let me see how the business did."_

### Step 8.1 — View the General Ledger

| Step | Action                                       | Expected Result                                                                   |
| ---- | -------------------------------------------- | --------------------------------------------------------------------------------- |
| 1    | Click **General Ledger → Ledger** in sidebar | Ledger page loads with account-by-account transaction details                     |
| 2    | Select "Cash on Hand (1000)"                 | Shows all cash transactions: rent paid (-₱18,000), salaries paid (-₱45,000), etc. |
| 3    | Select "Accounts Receivable (1100)"          | Shows: Invoice sent (+₱30,800), payments received (-₱30,800)                      |
| 4    | Select "Catering Revenue (4000)"             | Shows: Invoice income ₱30,800 (includes 12% VAT)                                  |

### Step 8.2 — Run Financial Reports

| Step | Action                                                     | Expected Result                                                                                   |
| ---- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1    | Navigate to **Reports → Trial Balance**                    | All accounts with their debit/credit balances — must be balanced (total debits = total credits)   |
| 2    | Navigate to **Reports → Income Statement** (Profit & Loss) | Revenue: ₱30,800 vs. Expenses (COGS + Rent + Utilities + Salaries) — shows **Net Profit or Loss** |
| 3    | Navigate to **Reports → Balance Sheet**                    | Assets = Liabilities + Equity (the accounting equation)                                           |
| 4    | Navigate to **Reports → Cash Flow Statement**              | Shows where cash came in (customer payments) and went out (rent, salaries, suppliers)             |

> **The big question**: _Is Kusina ni Maria profitable?_
>
> - Revenue: ₱30,800 (catering with 12% VAT)
> - Expenses: ₱13,100 (ingredients) + ₱18,000 (rent) + ₱8,500 (utilities) + ₱45,000 (salaries) = **₱84,600**
> - **Net Loss: -₱53,800** 😟
>
> _Don't panic!_ This is Month 1. You only had one catering event. As you get more clients and dine-in revenue comes in, the numbers will improve. This is exactly what the accounting system is for — to show you the truth about your business.

---

## Phase 9: Day-to-Day Operations — Ongoing Workflow

> _"Now that everything is set up, here's what I do every day/week/month."_

### Daily

| Task                        | Where                                             |
| --------------------------- | ------------------------------------------------- |
| Record cash sales (dine-in) | Journal Entry: Debit Cash, Credit Dine-in Revenue |
| Check low inventory alerts  | Inventory → Products (reorder level warnings)     |

### Weekly

| Task                                  | Where                  |
| ------------------------------------- | ---------------------- |
| Create bills for ingredient purchases | Bills → Create Bill    |
| Pay suppliers when due                | Bills → Record Payment |

### Monthly

| Task                              | Where                                |
| --------------------------------- | ------------------------------------ |
| Send catering invoices            | Invoices → Create Invoice → Send     |
| Record rent, utilities, salaries  | Journal Entries                      |
| Run Trial Balance to verify books | Reports → Trial Balance              |
| Review Income Statement           | Reports → P&L                        |
| Follow up on unpaid invoices      | Invoices → filter by Pending/Overdue |

---

## Phase 10: Advanced Scenarios

### 10.1 — Void a Mistake

> _"I sent an invoice to the wrong client!"_

| Step | Action                       | Expected Result                                                 |
| ---- | ---------------------------- | --------------------------------------------------------------- |
| 1    | Go to the incorrect invoice  | Invoice detail page                                             |
| 2    | Click **Void** → Confirm     | Invoice status → **Void**, journal entry reversed, AR decreases |
| 3    | Create a new correct invoice | Fresh invoice with proper details                               |

### 10.2 — Archive an Old Account

| Step | Action                                          | Expected Result                              |
| ---- | ----------------------------------------------- | -------------------------------------------- |
| 1    | Go to Chart of Accounts                         | List of all accounts                         |
| 2    | Click ⋯ menu on an unused account → **Archive** | Account deactivated, hidden from active list |
| 3    | Later, **Restore** if needed                    | Account becomes active again                 |

### 10.3 — Deactivate a Customer

> _"Mabuhay Events stopped ordering. I'll mark them inactive."_

| Step | Action                                            | Expected Result                |
| ---- | ------------------------------------------------- | ------------------------------ |
| 1    | Go to Customers list                              | All customers shown            |
| 2    | Click **Toggle Status** on Mabuhay Events         | Status → Inactive (grey badge) |
| 3    | They won't appear in invoice customer dropdowns   | Prevents accidental invoicing  |
| 4    | Click **Toggle Status** again to reactivate later | Status → Active                |

### 10.4 — Adjust Inventory After Spoilage

> _"2 sacks of rice got wet and spoiled."_

| Step | Action                                          | Expected Result                          |
| ---- | ----------------------------------------------- | ---------------------------------------- |
| 1    | Go to Inventory → find "Premium Rice 25kg Sack" | Current qty shown                        |
| 2    | Click **Adjust Quantity**                       | Adjustment form appears                  |
| 3    | Reduce by 2, Reason: "Spoilage - water damage"  | Quantity decreases, transaction recorded |

---

## Quick Reference: The Accounting Cycle

```
  ┌─────────────────────────────────────────────────────┐
  │                  THE ACCOUNTING CYCLE                │
  │                                                     │
  │  1. 📝 Record Transactions (Journal Entries)        │
  │         ↓                                           │
  │  2. 📒 Post to Ledger (automatic)                  │
  │         ↓                                           │
  │  3. ⚖️  Trial Balance (verify debits = credits)     │
  │         ↓                                           │
  │  4. 📊 Financial Statements                         │
  │      • Income Statement (are you profitable?)       │
  │      • Balance Sheet (what do you own vs owe?)      │
  │      • Cash Flow (where did the money go?)          │
  │         ↓                                           │
  │  5. 🔒 Close Period (lock the month)                │
  │         ↓                                           │
  │  6. 🔄 Start Next Period                            │
  └─────────────────────────────────────────────────────┘
```

---

## Form Default Values Summary

All forms come **pre-filled** so you can just review and submit:

| Form              | Pre-filled As                                | Just Hit Submit?                           |
| ----------------- | -------------------------------------------- | ------------------------------------------ |
| Company Setup     | Kusina ni Maria, Sole Proprietorship, Makati | ✅ Yes                                     |
| Account           | Cash on Hand (1000), ₱50,000 balance         | ⚠️ Change for each account                 |
| Customer          | Mabuhay Events Corporation (CUST-001)        | ✅ Yes                                     |
| Supplier          | Fresh Harvest Market (SUP-001)               | ✅ Yes                                     |
| Invoice           | 50-pax catering + setup = ₱27,500            | ⚠️ Select customer first                   |
| Bill              | Rice + Veggies + Pork = ₱13,100              | ⚠️ Select supplier & expense account first |
| Inventory Product | Premium Rice 25kg, 10 sacks @ ₱1,400         | ⚠️ Select accounts from dropdowns          |
| Service           | Catering Service, ₱450/head                  | ⚠️ Select income account                   |
| Transaction       | Restaurant Rent ₱18,000                      | ✅ Yes                                     |
| Journal Entry     | _(Manual — no defaults, you build it)_       | ❌ Fill in manually                        |

---

## Known Limitations

1. **Dashboard**: Uses hardcoded sample data — does not reflect your actual transactions
2. **Dropdowns require existing data**: Invoice needs customers first, Bill needs suppliers first, Inventory needs accounts first — follow the phases in order
3. **Some sidebar links will 404**: Banking/reconciliation, inventory adjustments, tax pages are not yet implemented
4. **Invoice/Bill numbers**: Use global unique indexes — may conflict if testing with multiple organizations
