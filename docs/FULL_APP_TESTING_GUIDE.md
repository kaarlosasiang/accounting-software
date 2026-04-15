# Full App Testing Guide

A step-by-step walkthrough to test every major feature of the accounting software — from first sign-up through final reports and exports.

---

## Prerequisites

- Backend and frontend servers running locally
- A valid email address you can access (for verification)
- A second email address (for team invite test)

---

## Phase 1 — Sign Up & Onboarding

### 1.1 Sign Up

1. Go to `/signup`
2. Fill in:
   - **Name:** `Juan dela Cruz`
   - **Email:** `juan@testcompany.ph`
   - **Password:** `Test@1234!`
3. Click **Create Account**
4. Check your inbox and click the verification link

### 1.2 Onboarding — Profile Step

1. After verification you should land on `/onboarding`
2. **Profile step:** confirm your display name is `Juan dela Cruz`, click **Next**

### 1.3 Onboarding — Company Step

Fill in:

| Field         | Value                   |
| ------------- | ----------------------- |
| Company Name  | `Test Company Inc.`     |
| Company Slug  | `test-company-inc`      |
| Business Type | `Corporation`           |
| Industry      | `Technology`            |
| Company Size  | `1-10 employees`        |
| Currency      | `PHP - Philippine Peso` |
| Address       | `123 Rizal St.`         |
| City          | `Makati`                |
| Country       | `Philippines`           |
| Postal Code   | `1200`                  |
| Phone         | `+63 912 345 6789`      |
| Email         | `info@testcompany.ph`   |
| Tax ID (TIN)  | `123-456-789-000`       |

Click **Continue**.

### 1.4 Onboarding — Invite Team (optional)

- Enter a second email address and role **Staff**, click **Send Invite**, then **Skip** or **Done**

### 1.5 Onboarding — Done

- Click **Go to Dashboard**
- You should land on `/dashboard`

---

## Phase 2 — Chart of Accounts

Navigate to **Accounts** → `/accounts`

### 2.1 Create Accounts

Create the following accounts (click **+ New Account** for each):

| #   | Account Code | Account Name              | Account Type | Normal Balance |
| --- | ------------ | ------------------------- | ------------ | -------------- |
| 1   | `1010`       | `Cash on Hand`            | Asset        | Debit          |
| 2   | `1110`       | `Accounts Receivable`     | Asset        | Debit          |
| 3   | `1310`       | `Inventory`               | Asset        | Debit          |
| 4   | `2010`       | `Accounts Payable`        | Liability    | Credit         |
| 5   | `3010`       | `Owner's Equity`          | Equity       | Credit         |
| 6   | `4010`       | `Service Revenue`         | Revenue      | Credit         |
| 7   | `5010`       | `Cost of Goods Sold`      | Expense      | Debit          |
| 8   | `5110`       | `Office Supplies Expense` | Expense      | Debit          |

> **Verify:** All 8 accounts appear in the list. Check the Assets / Liabilities / Equity / Revenue / Expenses tabs to confirm filtering works.

---

## Phase 3 — Accounting Periods

Navigate to **Periods** → `/periods`

### 3.1 Create a Period

1. Click **+ New Period**
2. Fill in:
   - **Period Name:** `April 2026`
   - **Start Date:** `2026-04-01`
   - **End Date:** `2026-04-30`
   - **Period Type:** `Monthly`
   - **Fiscal Year:** `2026`
3. Click **Create**

> **Verify:** Period appears with status **Open**.

---

## Phase 4 — Customers & Suppliers

### 4.1 Create a Customer

Navigate to **Customers** → `/customers`, click **+ Add Customer**:

| Field         | Value                             |
| ------------- | --------------------------------- |
| Customer Name | `ABC Corporation`                 |
| Display Name  | `ABC Corp`                        |
| Email         | `billing@abccorp.ph`              |
| Phone         | `+63 917 111 2222`                |
| Address       | `456 Ayala Ave, BGC, Taguig 1630` |
| Payment Terms | `Net 30`                          |
| Credit Limit  | `50000`                           |

Click **Save**.

### 4.2 Create a Supplier

Navigate to **Suppliers** → `/suppliers`, click **+ Add Supplier**:

| Field         | Value                        |
| ------------- | ---------------------------- |
| Supplier Name | `XYZ Supplies Co.`           |
| Display Name  | `XYZ Supplies`               |
| Email         | `orders@xyzsupplies.ph`      |
| Phone         | `+63 918 333 4444`           |
| Address       | `789 EDSA, Mandaluyong 1550` |
| Payment Terms | `Net 15`                     |

Click **Save**.

---

## Phase 5 — Inventory

Navigate to **Inventory** → `/inventory`

### 5.1 Create a Product

Click **+ Add Item**, select **Product**:

| Field            | Value                              |
| ---------------- | ---------------------------------- |
| Item Name        | `Laptop Stand`                     |
| SKU              | `LSTND-001`                        |
| Description      | `Adjustable aluminum laptop stand` |
| Unit Price       | `1500`                             |
| Cost Price       | `900`                              |
| Quantity On Hand | `50`                               |
| Reorder Level    | `10`                               |

Click **Save**.

### 5.2 Create a Service

Click **+ Add Item**, select **Service**:

| Field       | Value                           |
| ----------- | ------------------------------- |
| Item Name   | `IT Consulting (hourly)`        |
| SKU         | `ITCNS-001`                     |
| Description | `Hourly IT consulting services` |
| Unit Price  | `2500`                          |

Click **Save**.

### 5.3 Adjust Stock

1. Find **Laptop Stand**, open its **⋯** menu → **Adjust Quantity**
2. **Adjustment:** `+5`, **Reason:** `Initial stock recount`
3. Click **Save** — quantity should update to **55**

---

## Phase 6 — Invoices (Accounts Receivable)

Navigate to **Invoices** → `/invoices`

### 6.1 Create Invoice

Click **+ Create Invoice** → `/invoices/create`:

| Field          | Value                                            |
| -------------- | ------------------------------------------------ |
| Customer       | `ABC Corporation`                                |
| Invoice Number | `INV-2026-001` (auto-generated or type manually) |
| Invoice Date   | `2026-04-01`                                     |
| Due Date       | `2026-05-01`                                     |
| Payment Terms  | `Net 30`                                         |

**Line Items:**

| Item                     | Qty | Unit Price |
| ------------------------ | --- | ---------- |
| `IT Consulting (hourly)` | `4` | `2500`     |
| `Laptop Stand`           | `2` | `1500`     |

- Subtotal: ₱13,000
- Click **Save Draft**

### 6.2 Send Invoice

1. Open **INV-2026-001** from the list
2. Click **Send** — confirm the dialog
3. Status should change to **Sent**

### 6.3 Download PDF

1. On the same invoice detail page, click **Download PDF**
2. Verify the PDF opens/downloads with company name and line items

### 6.4 Record Payment

Still on the invoice detail page:

1. Click **Record Payment**
2. Fill in:
   - **Amount:** `13000`
   - **Payment Date:** `2026-04-10`
   - **Payment Method:** `Bank Transfer`
   - **Reference:** `BT-20260410-001`
3. Click **Save**
4. Status should change to **Paid**

> **Verify in Payments (/payments):** A new payment entry `₱13,000` appears.

---

## Phase 7 — Bills (Accounts Payable)

Navigate to **Bills** → `/bills`

### 7.1 Create a Bill

Click **+ New Bill**:

| Field       | Value              |
| ----------- | ------------------ |
| Supplier    | `XYZ Supplies Co.` |
| Bill Number | `BILL-2026-001`    |
| Bill Date   | `2026-04-03`       |
| Due Date    | `2026-04-18`       |

**Line Items:**

| Description     | Qty  | Unit Price |
| --------------- | ---- | ---------- |
| Office Supplies | `10` | `350`      |

- Total: ₱3,500
- Click **Save as Draft**

### 7.2 Approve Bill

1. Open **BILL-2026-001**
2. Click **Approve** — confirm the dialog
3. Status should change to **Sent** (active/approved)

### 7.3 Record Bill Payment

Still on the bill detail page:

1. Click **Record Payment**
2. Fill in:
   - **Amount:** `3500`
   - **Payment Date:** `2026-04-10`
   - **Payment Method:** `Bank Transfer`
   - **Reference:** `BT-20260410-002`
3. Click **Save**
4. Status should change to **Paid**

---

## Phase 8 — Journal Entries

Navigate to **Journal Entries** → `/journal-entries`

### 8.1 Create a Manual Entry

Click **+ New Entry** → `/journal-entries/create`:

| Field        | Value                                |
| ------------ | ------------------------------------ |
| Entry Number | `JE-2026-001` (auto or manual)       |
| Date         | `2026-04-15`                         |
| Description  | `Purchase of office supplies — cash` |
| Type         | `Manual`                             |

**Lines:**

| Account                          | Debit  | Credit |
| -------------------------------- | ------ | ------ |
| `5110 - Office Supplies Expense` | `1750` | —      |
| `1010 - Cash on Hand`            | —      | `1750` |

Click **Save as Draft**, then **Post**.

> **Verify:** Entry status is **Posted**.

### 8.2 Verify Auto-Generated Entries

1. Go back to the list and filter by type **Auto - Invoice**
2. You should see the auto-created journal entry from the invoice in Phase 6
3. Filter by **Auto - Bill** and verify the bill entry from Phase 7

---

## Phase 9 — General Ledger & Trial Balance

Navigate to **Ledger** → `/ledger`

### 9.1 General Ledger Tab

1. Use the **Account** filter to select `1110 - Accounts Receivable`
2. Verify you can see the debit from INV-2026-001 and the credit from the payment
3. Click **Export CSV** — verify the file downloads with the correct entries

### 9.2 Trial Balance Tab

1. Switch to the **Trial Balance** tab
2. Set the **As Of Date** to `2026-04-30`
3. Verify:
   - Total Debits = Total Credits (Balanced: **Yes**)
   - `4010 - Service Revenue` has a credit balance
   - `5010 - COGS` has a debit balance
4. Click **Export CSV**

---

## Phase 10 — Transactions

Navigate to **Transactions** → `/transactions`

1. Verify the list shows all journal entries (manual + auto)
2. Use the **Type** filter to narrow down to **Invoice** entries
3. Use the **Search** field to search for `INV-2026-001`
4. Click **Export CSV** — verify the download

---

## Phase 11 — Reports

Navigate to **Reports** → `/reports`

### 11.1 Profit & Loss

1. Go to **Reports → Profit & Loss** → `/reports/profit-loss`
2. Set date range: `2026-04-01` to `2026-04-30`
3. Click **Generate** / **Apply**
4. Verify:
   - Revenue section shows `Service Revenue`
   - Expenses section shows entries
5. Click **Export CSV**

### 11.2 Balance Sheet

1. Go to **Reports → Balance Sheet** → `/reports/balance-sheet`
2. Set **As Of Date:** `2026-04-30`
3. Verify Assets = Liabilities + Equity
4. Click **Export CSV**

### 11.3 Cash Flow

1. Go to **Reports → Cash Flow** → `/reports/cash-flow`
2. Set date range: `2026-04-01` to `2026-04-30`
3. Click **Export CSV**

### 11.4 AR Aging

1. Go to **Reports → AR Aging** → `/reports/ar-aging`
2. Set **As Of Date:** `2026-04-30`
3. All invoices should appear as **Current** (paid on time in Phase 6)
4. Click **Export CSV**

### 11.5 AP Aging

1. Go to **Reports → AP Aging** → `/reports/ap-aging`
2. Similar to AR — bill should appear as **Paid/Current**
3. Click **Export CSV**

### 11.6 Tax Summary

1. Go to **Reports → Tax Summary** → `/reports/tax-summary`
2. Select year **2026**
3. Verify:
   - **Total Revenue** reflects the ₱13,000 invoice revenue
   - **Total Expenses** reflects the bills and journal entries
   - **BIR Income Tax** is computed via TRAIN Law graduated rates
   - **3% Percentage Tax** is shown
4. Click **Export CSV**

---

## Phase 12 — Settings

### 12.1 General (Profile)

1. Go to **Settings → General** → `/settings/general`
2. Update **Display Name** to `Juan Cruz`
3. Click **Save** — toast should confirm success

### 12.2 Company Settings

1. Go to **Settings → Company** → `/settings/company`
2. Update **Website** to `https://testcompany.ph`
3. Click **Save**

### 12.3 Banking

1. Go to **Settings → Banking** → `/settings/banking`
2. Click **+ Add Bank Account**:

| Field          | Value               |
| -------------- | ------------------- |
| Bank Name      | `BDO Unibank`       |
| Account Name   | `Test Company Inc.` |
| Account Number | `001234567890`      |
| Account Type   | `Current`           |

3. Click **Save**

### 12.4 Team & Roles

1. Go to **Settings → Team** → `/settings/team`
2. **Members Tab:**
   - Click **Invite Member**
   - Email: _(second email address)_, Role: `Accountant`
   - Click **Send Invite**
3. **Roles Tab:**
   - Verify the default roles exist: `owner`, `admin`, `accountant`, `staff`, `viewer`
   - Click on a role to inspect its permission matrix

---

## Phase 13 — Accounting Period Lifecycle

Navigate to **Periods** → `/periods`

### 13.1 Close the Period

1. Find **April 2026**
2. Click **Close Period** — confirm
3. Status should change to **Closed**

### 13.2 Lock the Period

1. Click **Lock Period** — confirm
2. Status should change to **Locked**

> **Verify:** Try creating a journal entry dated `2026-04-15` — the app should prevent posting into a locked period.

### 13.3 Reopen the Period

1. Click **Reopen** — confirm
2. Status should change back to **Open**

---

## Phase 14 — Edge Cases & Validation

| Scenario                      | Steps                                                                  | Expected Result                                         |
| ----------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------- |
| Invoice without company name  | Remove company name in Settings → Company, then try to send an invoice | `toast.error` — "Company name is required…"             |
| Bill PDF download             | Open any bill, click **Download PDF**                                  | `toast.info` — "PDF download for bills is coming soon." |
| Unbalanced journal entry      | Create a journal entry where Debit ≠ Credit                            | Form validation error, cannot save                      |
| Duplicate invoice number      | Create two invoices with the same number                               | API error or form validation                            |
| Negative inventory            | Adjust **Laptop Stand** quantity by `-100` (exceeds stock)             | Error or warning from API                               |
| Delete a posted journal entry | Open a **Posted** entry and try Delete                                 | Action should be blocked or confirmation required       |
| Void an invoice               | Open a sent/paid invoice, try **Void**                                 | Status changes to **Void**, linked JE also voided       |

---

## Summary Checklist

- [ ] Signed up and verified email
- [ ] Completed onboarding (profile + company + team invite)
- [ ] Created chart of accounts (8 accounts)
- [ ] Created accounting period for April 2026
- [ ] Created customer and supplier
- [ ] Created inventory product + service, adjusted stock
- [ ] Created, sent, and paid an invoice
- [ ] Created, approved, and paid a bill
- [ ] Created and posted a manual journal entry
- [ ] Verified auto-generated journal entries
- [ ] Reviewed General Ledger and exported CSV
- [ ] Reviewed Trial Balance (balanced) and exported CSV
- [ ] Exported P&L, Balance Sheet, Cash Flow, AR Aging, AP Aging, Tax Summary
- [ ] Updated profile and company settings
- [ ] Added a bank account
- [ ] Invited a team member
- [ ] Closed and locked an accounting period
- [ ] Tested edge cases and validation
