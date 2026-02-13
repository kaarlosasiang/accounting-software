# Manual Testing Guide — AM FINTRASS Accounting Software

> **Prerequisites**: Backend running on `http://localhost:4000`, Frontend running on `http://localhost:3000`
>
> Start both with: `pnpm run dev:app` from the project root

---

## Table of Contents

1. [Authentication Flow](#1-authentication-flow)
2. [Company Setup](#2-company-setup)
3. [Subscription / Plans](#3-subscription--plans)
4. [Dashboard](#4-dashboard)
5. [Chart of Accounts](#5-chart-of-accounts)
6. [Customers](#6-customers)
7. [Suppliers (Vendors)](#7-suppliers-vendors)
8. [Invoices (Sales)](#8-invoices-sales)
9. [Bills (Purchases)](#9-bills-purchases)
10. [Payments](#10-payments)
11. [Journal Entries](#11-journal-entries)
12. [General Ledger](#12-general-ledger)
13. [Inventory](#13-inventory)
14. [Accounting Periods](#14-accounting-periods)
15. [Financial Reports](#15-financial-reports)
16. [Settings](#16-settings)

---

## 1. Authentication Flow

### 1.1 — Sign Up (New User Registration)

| Step | Action                                                              | Expected Result                                                                                             |
| ---- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 1    | Navigate to `http://localhost:3000/signup`                          | Registration form appears with fields: First Name, Middle Name, Last Name, Email, Phone, Username, Password |
| 2    | Fill in all required fields with valid data, then click **Sign Up** | Form submits — email OTP verification screen appears                                                        |
| 3    | Check your email inbox for the verification code                    | You receive a 6-digit OTP code via email                                                                    |
| 4    | Enter the OTP code in the verification input                        | Verification succeeds — you are redirected to `/company-setup`                                              |

### 1.2 — Login (Existing User)

| Step | Action                                          | Expected Result                                                              |
| ---- | ----------------------------------------------- | ---------------------------------------------------------------------------- |
| 1    | Navigate to `http://localhost:3000/login`       | Login form with Email and Password fields appears                            |
| 2    | Enter valid credentials and click **Sign In**   | Login succeeds — redirected to `/dashboard` (or `/plans` if no subscription) |
| 3    | Enter invalid credentials and click **Sign In** | Error toast appears: "Invalid email or password"                             |
| 4    | While logged in, navigate to `/login`           | You are automatically redirected to `/dashboard` (guest route guard)         |

### 1.3 — Logout

| Step | Action                                            | Expected Result                               |
| ---- | ------------------------------------------------- | --------------------------------------------- |
| 1    | Click your avatar/name in the bottom-left sidebar | User dropdown menu appears                    |
| 2    | Click **Sign Out**                                | You are logged out and redirected to `/login` |
| 3    | Try navigating to `/dashboard` while logged out   | You are redirected to `/login` (auth guard)   |

---

## 2. Company Setup

| Step | Action                                                             | Expected Result                                             |
| ---- | ------------------------------------------------------------------ | ----------------------------------------------------------- |
| 1    | After signing up, you land on `/company-setup`                     | Company setup form appears (company name, business details) |
| 2    | Fill in company name, address, industry, tax ID, fiscal year start | Form validates all required fields                          |
| 3    | Click **Create Company** / **Submit**                              | Organization is created — you are redirected to `/plans`    |

---

## 3. Subscription / Plans

| Step | Action                                               | Expected Result                                                                                     |
| ---- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 1    | Navigate to `/plans`                                 | Three plan cards appear: **Starter** (₱49/mo), **Professional** (₱129/mo), **Enterprise** (₱399/mo) |
| 2    | Click **Get Started** on any plan                    | Mock checkout processes — subscription is activated                                                 |
| 3    | After activation, you are redirected to `/dashboard` | Dashboard loads with the sidebar and full navigation available                                      |

---

## 4. Dashboard

| Step | Action                                         | Expected Result                                                                                    |
| ---- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 1    | Navigate to `/dashboard`                       | Dashboard loads with KPI summary cards: Total Revenue, Total Expenses, Net Profit, Total Customers |
| 2    | View the charts section                        | Revenue vs Expenses area chart, Income Category pie chart, Cash Flow bar chart are displayed       |
| 3    | View Recent Invoices table                     | Table shows recent invoices with status badges (Paid, Pending, Overdue)                            |
| 4    | View Recent Transactions table                 | Table shows recent transactions with amounts                                                       |
| 5    | Click the period tabs (Month / Quarter / Year) | Charts and KPI cards update to reflect the selected period                                         |
| 6    | Navigate to `/dashboard/analytics`             | Analytics page loads with Revenue Trend line chart, Expense Breakdown bar chart                    |
| 7    | Navigate to `/dashboard/reports`               | Reports Center shows summary cards for P&L, Balance Sheet, Cash Flow                               |

> **Note**: Dashboard currently uses hardcoded sample data. Values shown are static.

---

## 5. Chart of Accounts

### 5.1 — View Accounts

| Step | Action                                                      | Expected Result                                                                                                                   |
| ---- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Click **Chart of Accounts → All Accounts** in sidebar       | Accounts page loads with summary cards per type (Assets, Liabilities, Equity, Revenue, Expenses) and a data table of all accounts |
| 2    | If no accounts exist, table shows an empty state            | "No accounts found" or empty table message                                                                                        |
| 3    | Click the **Assets** / **Liabilities** / etc. sub-nav items | Table filters to show only accounts of that type                                                                                  |

### 5.2 — Create Account

| Step | Action                                                                                                  | Expected Result                                                               |
| ---- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 1    | Click **Create Account** button (top right)                                                             | Navigates to `/accounts/create` with the Account form                         |
| 2    | Fill in: Account Code (`1000`), Account Name (`Cash on Hand`), Type (`Asset`), Normal Balance (`Debit`) | Form accepts all fields                                                       |
| 3    | Click **Save** / **Create**                                                                             | Account is created — success toast appears — redirected back to accounts list |
| 4    | The new account appears in the table                                                                    | Account code `1000`, name `Cash on Hand`, type `Asset` visible in the table   |

### 5.3 — Edit / Delete Account

| Step | Action                                     | Expected Result                                                          |
| ---- | ------------------------------------------ | ------------------------------------------------------------------------ |
| 1    | Click on an account row or the edit icon   | Account detail/edit page opens at `/accounts/[id]`                       |
| 2    | Change the account name and click **Save** | Success toast: "Account updated successfully" — name updates in the list |
| 3    | Click the **Delete** button on an account  | Confirmation dialog appears                                              |
| 4    | Confirm deletion                           | Account is removed from the list — success toast appears                 |

### 5.4 — Archive / Restore / Reconcile

| Step | Action                                       | Expected Result                                                             |
| ---- | -------------------------------------------- | --------------------------------------------------------------------------- |
| 1    | Open account actions menu (⋯ or dropdown)    | Options: Archive, Reconcile Balance appear                                  |
| 2    | Click **Archive**                            | Account status changes to inactive/archived — disappears from active list   |
| 3    | View archived accounts and click **Restore** | Account becomes active again                                                |
| 4    | Click **Reconcile Balance**                  | Account balance is recalculated from ledger entries — updated balance shown |

### Suggested Test Accounts to Create

| Code | Name                | Type      | Normal Balance |
| ---- | ------------------- | --------- | -------------- |
| 1000 | Cash on Hand        | Asset     | Debit          |
| 1010 | Bank Account        | Asset     | Debit          |
| 1100 | Accounts Receivable | Asset     | Debit          |
| 2000 | Accounts Payable    | Liability | Credit         |
| 3000 | Owner's Equity      | Equity    | Credit         |
| 4000 | Sales Revenue       | Revenue   | Credit         |
| 5000 | General Expenses    | Expense   | Debit          |
| 5010 | Office Supplies     | Expense   | Debit          |

---

## 6. Customers

### 6.1 — Create Customer

| Step | Action                                                                                                                                                                                                            | Expected Result                                                                         |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 1    | Click **Sales & Receivables → Customers** in sidebar                                                                                                                                                              | Customers page loads with stats cards (Total, Active, Balance, Credit) and a data table |
| 2    | Click **Add Customer** button                                                                                                                                                                                     | Create Customer dialog/form opens                                                       |
| 3    | Fill in: Code (`CUST-001`), Name (`ABC Trading`), Email (`abc@example.com`), Phone (`09171234567`), Billing Address (street, city, state, zip, country), Tax ID, Payment Terms (`Net 30`), Credit Limit (`50000`) | All fields accept input                                                                 |
| 4    | Click **Create** / **Save**                                                                                                                                                                                       | Success toast — customer appears in the table with status "Active"                      |
| 5    | Create a second customer with Code `CUST-002`                                                                                                                                                                     | Second customer appears in the table                                                    |

### 6.2 — Search / Filter Customers

| Step | Action                                           | Expected Result                               |
| ---- | ------------------------------------------------ | --------------------------------------------- |
| 1    | Type `ABC` in the search bar                     | Table filters to show only matching customers |
| 2    | Type `CUST-001` in the search bar                | Customer with code CUST-001 appears           |
| 3    | Clear search and navigate to `/customers/active` | Only active customers displayed               |

### 6.3 — Edit / Toggle / Delete Customer

| Step | Action                                     | Expected Result                                                 |
| ---- | ------------------------------------------ | --------------------------------------------------------------- |
| 1    | Click edit on a customer                   | Edit form opens with current data pre-filled                    |
| 2    | Change the phone number and save           | Success toast — phone number updates                            |
| 3    | Click **Toggle Status** (deactivate)       | Customer status changes to inactive — badge turns grey          |
| 4    | Click **Toggle Status** again (reactivate) | Customer status changes back to active                          |
| 5    | Click **Delete** on a customer             | Confirmation dialog → Confirm → Customer is permanently removed |

---

## 7. Suppliers (Vendors)

### 7.1 — Create Supplier

| Step | Action                                                                                                                                             | Expected Result                                      |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 1    | Click **Purchases & Payables → Vendors** in sidebar                                                                                                | Suppliers page loads with stats cards and data table |
| 2    | Click **Add Supplier** button                                                                                                                      | Slide-over (Sheet) form opens from the right         |
| 3    | Fill in: Code (`SUP-001`), Name (`Metro Supplies`), Email (`metro@supplies.com`), Phone (`09181234567`), Address, Tax ID, Payment Terms (`Net 30`) | All fields accept input                              |
| 4    | Click **Save**                                                                                                                                     | Success toast — supplier appears in the table        |

### 7.2 — Edit / Delete Supplier

| Step | Action                           | Expected Result                                                   |
| ---- | -------------------------------- | ----------------------------------------------------------------- |
| 1    | Click edit on a supplier         | Edit form opens in a slide-over Sheet                             |
| 2    | Update the phone number and save | Success toast — data updates                                      |
| 3    | Click **Delete** on a supplier   | Supplier is soft-deleted (deactivated) — `isActive` becomes false |

---

## 8. Invoices (Sales)

### 8.1 — Create Invoice

| Step | Action                                                                                   | Expected Result                                                                                               |
| ---- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 1    | Click **Sales & Receivables → Create Invoice** in sidebar                                | Invoice creation form loads at `/invoices/create`                                                             |
| 2    | Select a **Customer** from the dropdown                                                  | Customer details populate (name, email, address)                                                              |
| 3    | Set **Invoice Date** and **Due Date**                                                    | Date fields accept values                                                                                     |
| 4    | Add line items: Description (`Web Design Service`), Quantity (`1`), Unit Price (`15000`) | Line item row appears — subtotal calculates automatically                                                     |
| 5    | Add another line item: Description (`Hosting`), Quantity (`12`), Unit Price (`500`)      | Second row added — subtotal updates to `21000`                                                                |
| 6    | Set Tax Rate to `12` (%)                                                                 | Tax amount calculates (`2520`) — Total becomes `23520`                                                        |
| 7    | Click **Save as Draft** or **Create**                                                    | Success toast — invoice created with status **Draft** — invoice number auto-generated (e.g., `INV-2026-0001`) |
| 8    | You are redirected to the invoice list or detail page                                    | New invoice visible with correct amounts                                                                      |

### 8.2 — View / Send Invoice

| Step | Action                          | Expected Result                                                                                                   |
| ---- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 1    | Click on an invoice in the list | Invoice detail page opens at `/invoices/[id]` showing customer info, line items, totals                           |
| 2    | Click **Send Invoice**          | Status changes from **Draft** to **Sent** — a journal entry is automatically created (Debit: AR, Credit: Revenue) |
| 3    | Click **Download PDF**          | PDF file downloads with invoice details                                                                           |

### 8.3 — Record Payment on Invoice

| Step | Action                                                                                  | Expected Result                                                                           |
| ---- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1    | On the invoice detail page, click **Record Payment**                                    | Payment form appears                                                                      |
| 2    | Enter amount (`10000`), select payment method (`Bank Transfer`), enter reference number | Fields accept input                                                                       |
| 3    | Click **Save Payment**                                                                  | Payment recorded — invoice status changes to **Partial** — balance due updates to `13520` |
| 4    | Record another payment for the remaining `13520`                                        | Invoice status changes to **Paid** — balance due becomes `0`                              |

### 8.4 — Void Invoice

| Step | Action                                   | Expected Result                                                |
| ---- | ---------------------------------------- | -------------------------------------------------------------- |
| 1    | On a sent/unpaid invoice, click **Void** | Confirmation dialog appears                                    |
| 2    | Confirm void                             | Invoice status changes to **Void** — journal entry is reversed |

### 8.5 — Filter / Search Invoices

| Step | Action                                                                      | Expected Result                                              |
| ---- | --------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 1    | Use the status filter dropdown (All / Draft / Sent / Paid / Overdue / Void) | Table filters to show only invoices matching selected status |
| 2    | Type a customer name or invoice number in search                            | Table filters to matching results                            |
| 3    | Navigate to `/invoices/paid`                                                | Shows only paid invoices                                     |
| 4    | Navigate to `/invoices/pending`                                             | Shows only pending (unpaid) invoices                         |

---

## 9. Bills (Purchases)

### 9.1 — Create Bill

| Step | Action                                                                                                                 | Expected Result                                                                                          |
| ---- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 1    | Click **Purchases & Payables → Purchase Bills** in sidebar                                                             | Bills page loads at `/bills` with summary cards and table                                                |
| 2    | Click **Create Bill** button                                                                                           | Bill creation form appears (inline or separate page)                                                     |
| 3    | Select a **Supplier** from the dropdown                                                                                | Supplier details populate                                                                                |
| 4    | Set **Bill Date** and **Due Date**                                                                                     | Dates accepted                                                                                           |
| 5    | Add line items: Description (`Office Supplies`), Quantity (`10`), Unit Price (`250`), Account (`Office Supplies 5010`) | Line total = `2500`                                                                                      |
| 6    | Click **Save** / **Create**                                                                                            | Success toast — bill created with status **Draft** — bill number auto-generated (e.g., `BILL-2026-0001`) |

### 9.2 — Approve Bill

| Step | Action                                       | Expected Result                                                 |
| ---- | -------------------------------------------- | --------------------------------------------------------------- |
| 1    | On a draft bill, click **Approve**           | Bill status changes from **Draft** to **Sent** (approved)       |
| 2    | A journal entry is automatically created     | Journal entry: Debit: Expense account, Credit: Accounts Payable |
| 3    | Supplier balance increases by the bill total | Supplier's `currentBalance` field reflects the new bill amount  |

### 9.3 — Record Payment on Bill

| Step | Action                                        | Expected Result                                  |
| ---- | --------------------------------------------- | ------------------------------------------------ |
| 1    | On an approved bill, click **Record Payment** | Payment form appears                             |
| 2    | Enter payment amount, method, reference       | Fields accept input                              |
| 3    | Submit partial payment                        | Bill status → **Partial**, balance due decreases |
| 4    | Submit remaining payment                      | Bill status → **Paid**, balance due = `0`        |

### 9.4 — Void / Delete Bill

| Step | Action                                         | Expected Result                                                           |
| ---- | ---------------------------------------------- | ------------------------------------------------------------------------- |
| 1    | On an approved (non-paid) bill, click **Void** | Bill status → **Void**, journal entry reversed, supplier balance adjusted |
| 2    | On a draft bill, click **Delete**              | Confirmation dialog → bill permanently removed                            |
| 3    | Attempt to delete a paid bill                  | Error: "Cannot delete a paid bill"                                        |

---

## 10. Payments

### 10.1 — View Payments

| Step | Action                                              | Expected Result                                                                           |
| ---- | --------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1    | Click **Cash Management → All Payments** in sidebar | Payments page loads with summary cards (Total, Received, Made, Net Cash Flow) and a table |
| 2    | Filter by type: **Received**                        | Only received payments (from customers) shown                                             |
| 3    | Filter by type: **Made**                            | Only made payments (to suppliers) shown                                                   |
| 4    | Search by payment number or entity name             | Table filters to matching results                                                         |

### 10.2 — Record a Payment

| Step | Action                                                            | Expected Result                                             |
| ---- | ----------------------------------------------------------------- | ----------------------------------------------------------- |
| 1    | Click **Record Payment** button or navigate to `/payments/create` | Payment creation form loads                                 |
| 2    | Select payment type: **Received**                                 | Customer selector appears with open invoices for allocation |
| 3    | Select a customer                                                 | List of open invoices for that customer appears             |
| 4    | Allocate payment to one or more invoices                          | Amount distributes across selected invoices                 |
| 5    | Select bank account, payment method, enter reference number       | Fields accept input                                         |
| 6    | Click **Save**                                                    | Payment recorded — invoices update their paid amounts       |

### 10.3 — Void a Payment

| Step | Action                                                     | Expected Result                                                               |
| ---- | ---------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 1    | Click the ⋯ menu on a completed payment → **Void Payment** | Confirmation dialog: "Are you sure? This will reverse the journal entry..."   |
| 2    | Click **Void Payment** to confirm                          | Payment status → **VOIDED**, badge turns grey, invoice/bill balances restored |

---

## 11. Journal Entries

### 11.1 — Create Manual Journal Entry

| Step | Action                                                             | Expected Result                                                                              |
| ---- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| 1    | Click **General Ledger → Journal Entries** in sidebar              | Journal entries list page loads with status/type filters                                     |
| 2    | Click **Create Journal Entry**                                     | Form at `/journal-entries/create` loads with date, description, and debit/credit lines table |
| 3    | Set date to today, description: `"Office rent payment"`            | Fields accept values                                                                         |
| 4    | Add Debit line: Account = `Rent Expense (5000)`, Amount = `10000`  | Debit line appears — debit total = `10000`                                                   |
| 5    | Add Credit line: Account = `Cash on Hand (1000)`, Amount = `10000` | Credit line appears — credit total = `10000`                                                 |
| 6    | Verify: Debit total (`10000`) = Credit total (`10000`) — balanced  | Balance indicator shows "Balanced" / green                                                   |
| 7    | Click **Save as Draft**                                            | Journal entry created with status **Draft** — entry number auto-generated                    |

### 11.2 — Post Journal Entry

| Step | Action                                                            | Expected Result                                                                           |
| ---- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1    | Navigate to the journal entry detail page `/journal-entries/[id]` | Entry details with lines displayed                                                        |
| 2    | Click **Post** button                                             | Status changes from **Draft** to **Posted** — ledger entries are created for each account |
| 3    | Check the affected accounts in Chart of Accounts                  | Account balances updated: Rent Expense +10000, Cash on Hand -10000                        |

### 11.3 — Void Journal Entry

| Step | Action                                    | Expected Result                                                    |
| ---- | ----------------------------------------- | ------------------------------------------------------------------ |
| 1    | On a posted journal entry, click **Void** | Confirmation dialog appears                                        |
| 2    | Confirm void                              | Status → **Void** — account balances are reversed back to original |

### 11.4 — Filter / Search

| Step | Action                           | Expected Result                                                         |
| ---- | -------------------------------- | ----------------------------------------------------------------------- |
| 1    | Filter by status: **Posted**     | Only posted entries shown                                               |
| 2    | Filter by type: **Manual**       | Only manual entries shown (excludes auto-generated from invoices/bills) |
| 3    | Filter by type: **Auto-Invoice** | Shows only auto-generated entries from invoice sending                  |

---

## 12. General Ledger

### 12.1 — View Ledger Entries

| Step | Action                                                     | Expected Result                                                 |
| ---- | ---------------------------------------------------------- | --------------------------------------------------------------- |
| 1    | Click **General Ledger → Ledger Entries** in sidebar       | Ledger page loads at `/ledger` with account-grouped entries     |
| 2    | Each account section shows debits and credits posted to it | Opening balance, individual entries with dates, running balance |
| 3    | Set a date range filter                                    | Ledger re-filters to show only entries within the range         |
| 4    | Select a specific account filter                           | Only that account's ledger entries shown                        |
| 5    | Expand/collapse account groups                             | Entries toggle visibility per account                           |

### 12.2 — Trial Balance

| Step | Action                                                                       | Expected Result                                         |
| ---- | ---------------------------------------------------------------------------- | ------------------------------------------------------- |
| 1    | Click the **Trial Balance** tab (or navigate to `/ledger?tab=trial-balance`) | Trial balance report loads                              |
| 2    | Each account shows a debit OR credit balance column                          | Columns populated per account                           |
| 3    | Total Debits = Total Credits at the bottom                                   | The trial balance is in balance (key accounting check!) |

---

## 13. Inventory

### 13.1 — Create Inventory Item

| Step | Action                                                                                                                                                                   | Expected Result                                                                                    |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| 1    | Click **Inventory → Items & Products** in sidebar                                                                                                                        | Inventory page loads with stats cards (Total Items, Total Value, Low Stock, Active) and data table |
| 2    | Click **Add Item** button                                                                                                                                                | Slide-over Sheet form opens                                                                        |
| 3    | Fill in: SKU (`ITEM-001`), Name (`Premium Rice`), Category (`Food`), Unit (`kg`), Quantity on Hand (`100`), Unit Cost (`50`), Selling Price (`75`), Reorder Level (`20`) | Fields accept input                                                                                |
| 4    | Select linked accounts: Inventory Account, COGS Account, Income Account                                                                                                  | Accounts selectable from dropdown (must create accounts first)                                     |
| 5    | Toggle **Sales Tax Enabled** on, set rate to `12%`                                                                                                                       | Tax fields appear and accept values                                                                |
| 6    | Click **Save**                                                                                                                                                           | Success toast — item appears in table — Total Value card updates                                   |

### 13.2 — Adjust Inventory Quantity

| Step | Action                                                  | Expected Result                                                            |
| ---- | ------------------------------------------------------- | -------------------------------------------------------------------------- |
| 1    | Click the ⋯ menu on an item → **Adjust Quantity**       | Adjustment dialog opens                                                    |
| 2    | Enter adjustment: `+50`, reason: `"New stock delivery"` | Fields accept input                                                        |
| 3    | Click **Save**                                          | Quantity updates from `100` to `150`, an inventory transaction is recorded |
| 4    | Enter adjustment: `-10`, reason: `"Damaged goods"`      | Quantity updates from `150` to `140`                                       |
| 5    | Enter adjustment: `-200` (more than available)          | Error: "Insufficient inventory" — quantity unchanged                       |

### 13.3 — Low Stock & Reorder

| Step | Action                                                  | Expected Result                                |
| ---- | ------------------------------------------------------- | ---------------------------------------------- |
| 1    | Create an item with quantity `5` and reorder level `20` | Item is created                                |
| 2    | Check the **Low Stock** stat card                       | Count increases by 1                           |
| 3    | Navigate to `/inventory/low-stock` (or filter)          | Only items at or below reorder level are shown |

### 13.4 — Inventory Transactions

| Step | Action                                                                        | Expected Result                                                          |
| ---- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1    | Navigate to `/inventory/transactions`                                         | All inventory movement history displayed (purchases, sales, adjustments) |
| 2    | Each transaction shows: date, type, quantity in/out, unit cost, balance after | Transaction records are visible                                          |

### 13.5 — Delete (Deactivate) Item

| Step | Action                                                   | Expected Result                                         |
| ---- | -------------------------------------------------------- | ------------------------------------------------------- |
| 1    | Click **Delete** on an inventory item                    | Item is soft-deleted (deactivated) — `isActive` → false |
| 2    | Item disappears from the active items list               | Not visible in active view                              |
| 3    | The item can still be viewed by including inactive items | Item shows with inactive status                         |

---

## 14. Accounting Periods

| Step | Action                                                                                             | Expected Result                                                                       |
| ---- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 1    | Click **Settings → Accounting Periods** in sidebar                                                 | Periods page loads at `/periods` with a table of periods                              |
| 2    | Click **Create Period**                                                                            | Dialog opens with fields: Name, Type (Monthly/Quarterly/Annual), Start Date, End Date |
| 3    | Create period: Name = `"January 2026"`, Type = `Monthly`, Start = `2026-01-01`, End = `2026-01-31` | Period created with status **Open**                                                   |
| 4    | Click **Close Period**                                                                             | Period status → **Closed** — no new transactions can be posted to this period         |
| 5    | Click **Reopen Period**                                                                            | Period status → **Open** again                                                        |
| 6    | Click **Lock Period**                                                                              | Period status → **Locked** — a stricter lock than close                               |
| 7    | Click **Delete** on an open period                                                                 | Period is removed                                                                     |

---

## 15. Financial Reports

### 15.1 — Balance Sheet

| Step | Action                                                      | Expected Result                                                               |
| ---- | ----------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 1    | Navigate to `/reports/balance-sheet`                        | Balance sheet loads from API with three sections: Assets, Liabilities, Equity |
| 2    | Each section shows account names and balances               | Individual accounts listed with amounts                                       |
| 3    | Verify: **Total Assets = Total Liabilities + Total Equity** | The accounting equation balances (balanced indicator shown)                   |

### 15.2 — Income Statement (Profit & Loss)

| Step | Action                                          | Expected Result                                          |
| ---- | ----------------------------------------------- | -------------------------------------------------------- |
| 1    | Navigate to `/reports/profit-loss`              | Income statement loads with Revenue and Expense sections |
| 2    | Revenue accounts listed with totals             | Total Revenue calculated                                 |
| 3    | Expense accounts listed with totals             | Total Expenses calculated                                |
| 4    | **Net Income = Total Revenue - Total Expenses** | Net income/loss displayed at the bottom                  |

### 15.3 — Cash Flow Statement

| Step | Action                                       | Expected Result                                                      |
| ---- | -------------------------------------------- | -------------------------------------------------------------------- |
| 1    | Navigate to `/reports/cash-flow`             | Cash flow report loads with Operating, Investing, Financing sections |
| 2    | Each section shows cash inflows and outflows | Subtotals per section                                                |
| 3    | **Net Change in Cash** displayed             | Total across all sections                                            |

### 15.4 — A/R Aging Report

| Step | Action                                            | Expected Result                                                        |
| ---- | ------------------------------------------------- | ---------------------------------------------------------------------- |
| 1    | Navigate to `/reports/ar-aging`                   | Aging report loads with columns: Current, 1-30, 31-60, 61-90, 90+ days |
| 2    | Each customer with outstanding invoices is listed | Amounts bucketed by aging period                                       |
| 3    | Total row shows aggregate per aging bucket        | Totals calculated correctly                                            |

### 15.5 — A/P Aging Report

| Step | Action                                         | Expected Result                           |
| ---- | ---------------------------------------------- | ----------------------------------------- |
| 1    | Navigate to `/reports/ap-aging`                | Aging report loads with supplier payables |
| 2    | Each supplier with outstanding bills is listed | Amounts bucketed by aging period          |

### 15.6 — Trial Balance

| Step | Action                                  | Expected Result                                            |
| ---- | --------------------------------------- | ---------------------------------------------------------- |
| 1    | Navigate to `/ledger?tab=trial-balance` | Trial balance shows all accounts with debit/credit columns |
| 2    | **Total Debits = Total Credits**        | The trial balance is in balance                            |

---

## 16. Settings

| Step | Action                                 | Expected Result                                                                                                            |
| ---- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 1    | Navigate to `/settings/general`        | General settings page with profile info (name, email), preferences (language, timezone, date format), notification toggles |
| 2    | Update your name and click **Save**    | Success toast — name updates                                                                                               |
| 3    | Navigate to `/settings/company`        | Company settings with business name, email, phone, address, industry, tax ID                                               |
| 4    | Update company name and click **Save** | Success toast — company name updates                                                                                       |
| 5    | Navigate to `/settings/billing`        | Current subscription plan displayed with upgrade options                                                                   |

---

## End-to-End Workflow Test

This tests the full accounting cycle from start to finish:

| #   | Step                       | Action                                                                    | Expected Result                                                                                 |
| --- | -------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 1   | **Setup accounts**         | Create: Cash (1000), AR (1100), AP (2000), Revenue (4000), Expense (5000) | 5 accounts in Chart of Accounts                                                                 |
| 2   | **Create customer**        | Create customer `ABC Corp` with code `CUST-001`                           | Customer appears in customer list                                                               |
| 3   | **Create supplier**        | Create supplier `XYZ Supplies` with code `SUP-001`                        | Supplier appears in supplier list                                                               |
| 4   | **Create invoice**         | Create invoice for ABC Corp: 1 item, qty 1, price ₱10,000, tax 12%        | Invoice created (Draft), total = ₱11,200                                                        |
| 5   | **Send invoice**           | Send the invoice                                                          | Status → Sent, auto journal entry created (DR: AR ₱11,200, CR: Revenue ₱10,000, CR: Tax ₱1,200) |
| 6   | **Check AR balance**       | View AR account in Chart of Accounts                                      | AR balance increases by ₱11,200                                                                 |
| 7   | **Check trial balance**    | View trial balance                                                        | Debits = Credits (balanced)                                                                     |
| 8   | **Record payment**         | Record ₱11,200 payment from ABC Corp                                      | Invoice status → Paid, AR decreases, Cash increases                                             |
| 9   | **Create bill**            | Create bill from XYZ Supplies: Office Supplies, qty 10, unit price ₱250   | Bill created (Draft), total = ₱2,500                                                            |
| 10  | **Approve bill**           | Approve the bill                                                          | Status → Sent, auto journal entry (DR: Expense, CR: AP)                                         |
| 11  | **Check AP balance**       | View AP account                                                           | AP balance increases by ₱2,500                                                                  |
| 12  | **Pay the bill**           | Record ₱2,500 payment to XYZ Supplies                                     | Bill status → Paid, AP decreases, Cash decreases                                                |
| 13  | **Check balance sheet**    | View balance sheet report                                                 | Assets = Liabilities + Equity (balanced)                                                        |
| 14  | **Check income statement** | View income statement                                                     | Revenue = ₱10,000, Expense = ₱2,500, Net Income = ₱7,500                                        |
| 15  | **Create journal entry**   | Manual JE: DR Expense ₱1,000, CR Cash ₱1,000 (rent payment)               | JE created as Draft                                                                             |
| 16  | **Post journal entry**     | Post the JE                                                               | Status → Posted, account balances update                                                        |
| 17  | **Final trial balance**    | View trial balance                                                        | All debits = all credits                                                                        |
| 18  | **Close period**           | Close the accounting period                                               | Period locked — prevents backdated entries                                                      |

---

## Known Limitations

| Area               | Limitation                                                                            |
| ------------------ | ------------------------------------------------------------------------------------- |
| Dashboard          | Uses hardcoded sample data — not connected to real API data                           |
| Transactions page  | Uses mock data — not connected to real API                                            |
| Payments list      | List page uses mock data — create page uses real API                                  |
| Reports main page  | `/reports` uses static data — sub-pages (`/reports/balance-sheet`, etc.) use real API |
| Tax pages          | `/tax/*` routes do not have pages (will 404)                                          |
| Some sidebar links | `/banking/reconciliation`, `/inventory/adjustments`, `/inventory/valuation` may 404   |
| Google Sign-In     | Requires `NEXT_PUBLIC_GOOGLE_CLIENT_ID` env var and non-localhost domain              |
| Email sending      | Invoice "Send" requires SMTP configuration on the backend                             |
