# Comprehensive Testing Guide — TechServe Solutions Inc.

> **Version:** 1.0 | **Date:** April 19, 2026 | **Coverage:** All 19 backend modules + frontend UI

This guide runs as a **single continuous scenario**. Every piece of data created in an earlier phase is used and verified in later phases. Complete the phases in order. By the end, the entire accounting lifecycle — from company setup through period close — has been tested and every core accounting equation has been verified.

---

## Business Scenario

| Field              | Value                                |
| ------------------ | ------------------------------------ |
| **Company**        | TechServe Solutions Inc.             |
| **Owner / Tester** | Adrian Reyes                         |
| **Email**          | adrian@techserve.ph                  |
| **Currency**       | PHP — Philippine Peso                |
| **Test Period**    | April 2026 (2026-04-01 → 2026-04-30) |
| **Industry**       | Technology                           |
| **Business Type**  | Corporation                          |

---

## Master Test Data Reference

### Accounts to Create

| Code | Name                  | Type      | Normal Balance |
| ---- | --------------------- | --------- | -------------- |
| 1000 | Cash on Hand          | Asset     | Debit          |
| 1010 | BPI Business Account  | Asset     | Debit          |
| 1100 | Accounts Receivable   | Asset     | Debit          |
| 1200 | Inventory             | Asset     | Debit          |
| 2000 | Accounts Payable      | Liability | Credit         |
| 3000 | Owner's Equity        | Equity    | Credit         |
| 4000 | IT Services Revenue   | Revenue   | Credit         |
| 4010 | Product Sales Revenue | Revenue   | Credit         |
| 5000 | Cost of Goods Sold    | Expense   | Debit          |
| 5010 | Rent Expense          | Expense   | Debit          |
| 5020 | Utilities Expense     | Expense   | Debit          |
| 5030 | Salaries Expense      | Expense   | Debit          |

### Transaction Summary

| #        | Document         | Party                | Amount  | Status at End |
| -------- | ---------------- | -------------------- | ------- | ------------- |
| INV-001  | Invoice          | Mabuhay Events Corp  | ₱14,700 | Paid          |
| INV-002  | Invoice          | Starlight Media Inc. | ₱17,500 | Paid          |
| BILL-001 | Bill             | TechParts Depot      | ₱12,000 | Paid          |
| PAY-001a | Payment Received | Mabuhay Events Corp  | ₱7,000  | Completed     |
| PAY-001b | Payment Received | Mabuhay Events Corp  | ₱7,700  | Completed     |
| PAY-003  | Payment Received | Starlight Media Inc. | ₱17,500 | Completed     |
| PAY-002  | Payment Made     | TechParts Depot      | ₱12,000 | Completed     |
| JE-RENT  | Manual JE        | —                    | ₱25,000 | Posted        |

### Expected Final Balances (April 2026, after all transactions)

| Account               | Expected Balance                               | Direction |
| --------------------- | ---------------------------------------------- | --------- |
| Cash on Hand          | ₱0 (₱25,000 rent paid out)                     | —         |
| BPI Business Account  | +₱32,200 received − ₱12,000 paid = **₱20,200** | Debit     |
| Accounts Receivable   | ₱0 (all invoices paid)                         | —         |
| Inventory             | +₱12,000 (restocked) − COGS on items sold      | Debit     |
| Accounts Payable      | ₱0 (BILL-001 paid)                             | —         |
| IT Services Revenue   | ₱10,500 (INV-001 line 3)                       | Credit    |
| Product Sales Revenue | ₱4,200 (INV-001 lines 1+2)                     | Credit    |

> Note: INV-002 (₱17,500 IT Services Revenue) is paid via PAY-003. After Phase 10, total IT Services Revenue = ₱10,500 + ₱17,500 = **₱28,000**.

---

## Phase 1 — Authentication & Onboarding

### 1.1 — Sign Up

Navigate to `http://localhost:3000/signup`

**Input:**

| Field     | Value                 |
| --------- | --------------------- |
| Full Name | `Adrian Reyes`        |
| Email     | `adrian@techserve.ph` |
| Password  | `TechServe@2026!`     |

**Steps:**

1. Fill in all fields and click **Create Account**
2. Check your inbox for the OTP email
3. Enter the 6-digit OTP code on the verification screen

**Expected result:**

- Verification succeeds
- Redirect to `/company-setup` (or `/onboarding`)
- No error messages shown

---

### 1.2 — Company Setup

Fill in the company form:

| Field             | Value                          |
| ----------------- | ------------------------------ |
| Company Name      | `TechServe Solutions Inc.`     |
| Company Slug      | `techserve-solutions`          |
| Business Type     | `Corporation`                  |
| Industry          | `Technology`                   |
| Company Size      | `1-10 employees`               |
| Currency          | `PHP - Philippine Peso`        |
| Address           | `Unit 5B, Picadilly Star, BGC` |
| City              | `Taguig`                       |
| Country           | `Philippines`                  |
| Postal Code       | `1634`                         |
| Phone             | `+63 917 000 1234`             |
| Email             | `info@techserve.ph`            |
| Tax ID (TIN)      | `987-654-321-000`              |
| Fiscal Year Start | `January 1, 2026`              |

Click **Create Company**.

**Expected result:**

- Organization created in the database
- Redirect to `/plans` (plan selection page)

**Expected API response (network tab):**

```
POST /api/v1/auth/organization/create
{ success: true, data: { id: "<orgId>", name: "TechServe Solutions Inc.", slug: "techserve-solutions" } }
```

---

### 1.3 — Plan Selection

1. Three plan cards appear: **Starter**, **Professional**, **Enterprise**
2. Click **Get Started** on any plan

**Expected result:**

- Subscription activated
- Redirect to `/dashboard`
- Sidebar navigation visible with: Dashboard, Accounts, Customers, Suppliers, Invoices, Bills, Payments, Inventory, Journal Entries, Ledger, Reports, Periods, Settings

---

## Phase 2 — Chart of Accounts

Navigate to `/accounts`

### 2.1 — Create All 12 Accounts

Click **+ New Account** for each row in the table below. Fill in exactly the values shown.

| Code   | Name                    | Type      | Normal Balance | Description                        |
| ------ | ----------------------- | --------- | -------------- | ---------------------------------- |
| `1000` | `Cash on Hand`          | Asset     | Debit          | Petty cash and register            |
| `1010` | `BPI Business Account`  | Asset     | Debit          | Main business bank account         |
| `1100` | `Accounts Receivable`   | Asset     | Debit          | Money owed by clients              |
| `1200` | `Inventory`             | Asset     | Debit          | Value of stock on hand             |
| `2000` | `Accounts Payable`      | Liability | Credit         | Money owed to suppliers            |
| `3000` | `Owner's Equity`        | Equity    | Credit         | Adrian's capital investment        |
| `4000` | `IT Services Revenue`   | Revenue   | Credit         | Income from IT consulting          |
| `4010` | `Product Sales Revenue` | Revenue   | Credit         | Income from hardware/product sales |
| `5000` | `Cost of Goods Sold`    | Expense   | Debit          | Cost of inventory sold             |
| `5010` | `Rent Expense`          | Expense   | Debit          | Monthly office rent                |
| `5020` | `Utilities Expense`     | Expense   | Debit          | Electricity, internet, water       |
| `5030` | `Salaries Expense`      | Expense   | Debit          | Employee wages                     |

**Expected result after each creation:**

**UI:** Toast: "Account created successfully" → form closes → new row appears in the accounts table sorted by code number, with the correct type badge (e.g., "Asset") and status showing **Active**.

**API (Network tab):** `{ success: true, data: { accountCode: "1000", accountName: "Cash on Hand", accountType: "Asset", normalBalance: "Debit", isActive: true } }`

**Verify tab filtering:**

- Click the **Assets** tab → only accounts 1000, 1010, 1100, 1200 appear
- Click **Liabilities** → only 2000 appears
- Click **Equity** → only 3000 appears
- Click **Revenue** → only 4000, 4010 appear
- Click **Expenses** → only 5000, 5010, 5020, 5030 appear

---

### 2.2 — Archive & Restore Account

1. Find account `5020 — Utilities Expense` in the list
2. Click **Archive** (or the archive action in the row menu)

**Expected result:**

**UI:** Toast: "Account archived" → the account row either disappears from the active list or is visibly grayed out with an "Inactive" badge → switching to an "Archived" or "Inactive" filter shows the account.

**API (Network tab):** `{ success: true, data: { isActive: false } }`

3. Click **Restore** on the archived account

**Expected result:**

**UI:** Toast: "Account restored" → the account reappears in the active accounts list with its original active styling.

**API (Network tab):** `{ success: true, data: { isActive: true } }`

---

### 2.3 — Account Balance (baseline)

Click on account `1100 — Accounts Receivable` → view balance.

**Expected result:**

**UI:** The account detail page shows a balance display of **₱0.00** with no transaction rows in the ledger section (or a "No transactions yet" empty state message).

**API (Network tab):** `{ success: true, data: { balance: 0 } }`

---

## Phase 3 — Company Settings

Navigate to `/settings`

### 3.1 — Update General Settings

Go to `/settings/general`:

| Field           | Value         |
| --------------- | ------------- |
| Date Format     | `MM/DD/YYYY`  |
| Timezone        | `Asia/Manila` |
| Language        | `English`     |
| Fiscal Year End | `December 31` |

Click **Save**.

**Expected result:**

- Toast: "Settings updated successfully"
- Reload page → all values persist

---

### 3.2 — Add Bank Account

Go to `/settings/banking`, click **+ Add Bank Account**:

| Field             | Value                                  |
| ----------------- | -------------------------------------- |
| Bank Name         | `BPI (Bank of the Philippine Islands)` |
| Account Name      | `TechServe Solutions Inc.`             |
| Account Number    | `1234-5678-90`                         |
| Account Type      | `Checking`                             |
| Linked GL Account | `1010 — BPI Business Account`          |

Click **Save**.

**Expected result:**

**UI:** Toast: "Bank account saved" → a new card for "BPI (Bank of the Philippine Islands)" appears in the banking settings section, showing the account number and linked GL account (BPI Business Account).

**API (Network tab):** `{ success: true, data: { bankName: "BPI (Bank of the Philippine Islands)", accountNumber: "1234-5678-90" } }`

---

## Phase 4 — Accounting Periods

Navigate to `/periods`

### 4.1 — Create the April 2026 Period

Click **+ New Period**:

| Field       | Value        |
| ----------- | ------------ |
| Period Name | `April 2026` |
| Period Type | `Monthly`    |
| Fiscal Year | `2026`       |
| Start Date  | `2026-04-01` |
| End Date    | `2026-04-30` |

Click **Create**.

**Expected result:**

**UI:** Toast: "Period created successfully" → a new row for "April 2026" appears in the periods table with a green **Open** status badge, start date `Apr 1, 2026`, and end date `Apr 30, 2026`.

**API (Network tab):** `{ success: true, data: { periodName: "April 2026", status: "Open", periodType: "Monthly", fiscalYear: 2026 } }`

---

### 4.2 — Verify Check-Date (baseline)

Use the **Check Date** feature, enter `2026-04-15`:

**Expected result:**

**UI:** The check-date response displays: "✓ This date falls within the **April 2026** period (Open)" — no error banner is shown.

**API (Network tab):** `{ success: true, data: { isOpen: true, periodName: "April 2026" } }`

---

## Phase 5 — Customers

Navigate to `/customers`

### 5.1 — Create Mabuhay Events Corp

Click **+ Add Customer**:

| Field           | Value                         |
| --------------- | ----------------------------- |
| Customer Code   | `CUST-001`                    |
| Customer Name   | `Mabuhay Events Corporation`  |
| Display Name    | `Mabuhay Events Corp`         |
| Email           | `billing@mabuhay.ph`          |
| Phone           | `+63 917 111 2222`            |
| Tax ID          | `111-222-333-000`             |
| Payment Terms   | `Net 30`                      |
| Credit Limit    | `200000`                      |
| Opening Balance | `0`                           |
| Billing Street  | `2F Mabuhay Tower, Ayala Ave` |
| Billing City    | `Makati`                      |
| Billing State   | `Metro Manila`                |
| Billing Zip     | `1226`                        |
| Billing Country | `Philippines`                 |

Click **Save**.

**Expected result:**

**UI:** Toast: "Customer created successfully" → form closes → "Mabuhay Events Corp" appears as a new row in the customers table showing code **CUST-001**, credit limit **₱200,000**, balance **₱0.00**, and status **Active**.

**API (Network tab):** `{ success: true, data: { customerCode: "CUST-001", customerName: "Mabuhay Events Corporation", creditLimit: 200000, currentBalance: 0, isActive: true } }`

---

### 5.2 — Create Starlight Media Inc.

Click **+ Add Customer**:

| Field           | Value                     |
| --------------- | ------------------------- |
| Customer Code   | `CUST-002`                |
| Customer Name   | `Starlight Media Inc.`    |
| Display Name    | `Starlight Media`         |
| Email           | `ap@starlightmedia.ph`    |
| Phone           | `+63 918 333 4444`        |
| Tax ID          | `444-555-666-000`         |
| Payment Terms   | `Net 15`                  |
| Credit Limit    | `100000`                  |
| Opening Balance | `0`                       |
| Billing Street  | `8F One World Place, BGC` |
| Billing City    | `Taguig`                  |
| Billing State   | `Metro Manila`            |
| Billing Zip     | `1634`                    |
| Billing Country | `Philippines`             |

Click **Save**.

**Expected result:**

**UI:** Toast: "Customer created successfully" → "Starlight Media" appears as a new row in the customers table. Total customer count in the list is now **2**.

**API (Network tab):** `{ success: true, data: { customerCode: "CUST-002", customerName: "Starlight Media Inc.", creditLimit: 100000, isActive: true } }`

---

### 5.3 — Check Credit Availability

Click on **Mabuhay Events Corp** → **Check Credit**:

**Expected result:**

**UI:** A credit summary panel or modal displays: Credit Limit **₱200,000** | Amount Used **₱0.00** | Available Credit **₱200,000** — available credit shown at 100%.

**API (Network tab):** `{ success: true, data: { creditLimit: 200000, currentBalance: 0, availableCredit: 200000 } }`

---

## Phase 6 — Suppliers

Navigate to `/suppliers`

### 6.1 — Create TechParts Depot

Click **+ Add Supplier**:

| Field           | Value                     |
| --------------- | ------------------------- |
| Supplier Code   | `SUPP-001`                |
| Supplier Name   | `TechParts Depot`         |
| Display Name    | `TechParts Depot`         |
| Email           | `orders@techparts.ph`     |
| Phone           | `+63 919 555 6666`        |
| Tax ID          | `777-888-999-000`         |
| Payment Terms   | `Net 30`                  |
| Opening Balance | `0`                       |
| Address Street  | `Quezon Ave, Quezon City` |
| Address City    | `Quezon City`             |
| Address State   | `Metro Manila`            |
| Address Zip     | `1100`                    |
| Address Country | `Philippines`             |

Click **Save**.

**Expected result:**

**UI:** Toast: "Supplier created successfully" → "TechParts Depot" appears as a new row in the suppliers table showing code **SUPP-001** and status **Active**.

**API (Network tab):** `{ success: true, data: { supplierCode: "SUPP-001", supplierName: "TechParts Depot", isActive: true } }`

---

### 6.2 — Create CloudHost PH

| Field           | Value                          |
| --------------- | ------------------------------ |
| Supplier Code   | `SUPP-002`                     |
| Supplier Name   | `CloudHost PH`                 |
| Display Name    | `CloudHost PH`                 |
| Email           | `billing@cloudhost.ph`         |
| Phone           | `+63 920 777 8888`             |
| Tax ID          | `321-654-987-000`              |
| Payment Terms   | `Net 15`                       |
| Opening Balance | `0`                            |
| Address Street  | `Cyber One Building, Eastwood` |
| Address City    | `Quezon City`                  |
| Address State   | `Metro Manila`                 |
| Address Zip     | `1110`                         |
| Address Country | `Philippines`                  |

Click **Save**.

**Expected result:**

**UI:** Toast: "Supplier created successfully" → "CloudHost PH" appears as a new row. Total supplier count in the list is now **2**.

**API (Network tab):** `{ success: true, data: { supplierCode: "SUPP-002", supplierName: "CloudHost PH", isActive: true } }`

---

## Phase 7 — Inventory

Navigate to `/inventory`

### 7.1 — Create Laptop Stand (Product)

Click **+ Add Item** → select **Product**:

| Field            | Value                              |
| ---------------- | ---------------------------------- |
| Item Type        | `Product`                          |
| SKU              | `LS-001`                           |
| Item Name        | `Laptop Stand`                     |
| Description      | `Adjustable aluminum laptop stand` |
| Category         | `Non-Food`                         |
| Unit             | `pcs`                              |
| Quantity on Hand | `50`                               |
| Reorder Level    | `10`                               |
| Unit Cost        | `800`                              |
| Selling Price    | `1200`                             |

Click **Save**.

**Expected result:**

**UI:** Toast: "Inventory item created" → "Laptop Stand (LS-001)" appears in the inventory list with type badge **Product**, quantity **50 pcs**, unit cost **₱800**, and selling price **₱1,200**.

**API (Network tab):** `{ success: true, data: { sku: "LS-001", itemName: "Laptop Stand", quantityOnHand: 50, unitCost: 800, sellingPrice: 1200, isActive: true } }`

---

### 7.2 — Create HDMI Cable (Product)

| Field            | Value                                 |
| ---------------- | ------------------------------------- |
| Item Type        | `Product`                             |
| SKU              | `HC-002`                              |
| Item Name        | `HDMI Cable 2m`                       |
| Description      | `High-speed HDMI 2.0 cable, 2 meters` |
| Category         | `Non-Food`                            |
| Unit             | `pcs`                                 |
| Quantity on Hand | `100`                                 |
| Reorder Level    | `20`                                  |
| Unit Cost        | `200`                                 |
| Selling Price    | `450`                                 |

Click **Save**.

**Expected result:**

**UI:** Toast: "Inventory item created" → "HDMI Cable 2m (HC-002)" appears in the inventory list with type badge **Product**, quantity **100 pcs**, unit cost **₱200**, and selling price **₱450**.

**API (Network tab):** `{ success: true, data: { sku: "HC-002", itemName: "HDMI Cable 2m", quantityOnHand: 100, unitCost: 200, sellingPrice: 450 } }`

---

### 7.3 — Create IT Consultation (Service)

| Field         | Value                                        |
| ------------- | -------------------------------------------- |
| Item Type     | `Service`                                    |
| SKU           | `SVC-001`                                    |
| Item Name     | `IT Consultation`                            |
| Description   | `Hourly IT consulting and advisory services` |
| Category      | `Service`                                    |
| Unit          | `hour`                                       |
| Unit Cost     | `0`                                          |
| Selling Price | `3500`                                       |

> Note: Services have no `quantityOnHand` or `reorderLevel`.

Click **Save**.

**Expected result:**

**UI:** Toast: "Inventory item created" → "IT Consultation (SVC-001)" appears in the inventory list with type badge **Service**. No quantity column value is shown (services are not stocked).

**API (Network tab):** `{ success: true, data: { sku: "SVC-001", itemType: "Service", itemName: "IT Consultation", sellingPrice: 3500 } }`

---

### 7.4 — Stock Adjustment (Laptop Stand +10 units)

Find **Laptop Stand (LS-001)** → click **Adjust Stock**:

| Field           | Value                               |
| --------------- | ----------------------------------- |
| Adjustment Type | `Addition`                          |
| Quantity        | `10`                                |
| Reason          | `Additional opening stock received` |

Click **Submit**.

**Expected result:**

**UI:** Toast: "Stock adjusted successfully" → the Laptop Stand row in the inventory list updates to show quantity **60 pcs** (was 50). The movement history for this item gains one new row showing `+10` adjustment.

**API (Network tab):**

- `quantityOnHand` updates from 50 → **60**
- `{ success: true, data: { quantityOnHand: 60 } }`

---

### 7.5 — Verify Movement Summary

Click on **Laptop Stand (LS-001)** → **Movement Summary**:

**Expected result:**

- One transaction row: Type `Adjustment`, Quantity `+10`, Running Balance `60`

---

### 7.6 — Check Reorder Needed

Navigate to `/inventory/reorder/needed` or use the **Reorder** filter tab.

**Expected result:**

- No items listed (current stock 60 Laptop Stands > reorder level 10; 100 HDMI Cables > reorder level 20)

---

## Phase 8 — Invoices

Navigate to `/invoices`

### 8.1 — Create INV-001 (Mabuhay Events Corp)

Click **+ Create Invoice**:

**Header:**

| Field          | Value                 |
| -------------- | --------------------- |
| Customer       | `Mabuhay Events Corp` |
| Invoice Number | `INV-001`             |
| Invoice Date   | `2026-04-05`          |
| Due Date       | `2026-05-05`          |
| Tax Rate       | `0`                   |
| Discount       | `0`                   |

**Line Items:**

| #   | Description             | Quantity | Unit Price | Account                        | Inventory Item            | Amount         |
| --- | ----------------------- | -------- | ---------- | ------------------------------ | ------------------------- | -------------- |
| 1   | Laptop Stand            | 2        | 1,200.00   | `4010 — Product Sales Revenue` | Laptop Stand (LS-001)     | **₱2,400.00**  |
| 2   | HDMI Cable 2m           | 4        | 450.00     | `4010 — Product Sales Revenue` | HDMI Cable 2m (HC-002)    | **₱1,800.00**  |
| 3   | IT Consultation (3 hrs) | 3        | 3,500.00   | `4000 — IT Services Revenue`   | IT Consultation (SVC-001) | **₱10,500.00** |

**Totals verification:**

| Field            | Expected Value |
| ---------------- | -------------- |
| Subtotal         | ₱14,700.00     |
| Tax Amount       | ₱0.00          |
| Discount         | ₱0.00          |
| **Total Amount** | **₱14,700.00** |

Click **Save** (creates as Draft) then **Post** (or Save & Post directly).

**Expected result:**

**UI:** Toast: "Invoice created successfully" → INV-001 appears in the invoices list with status badge **Draft**, customer "Mabuhay Events Corp", total amount **₱14,700.00**, amount paid **₱0.00**, and balance due **₱14,700.00**.

**API (Network tab):** `{ success: true, data: { invoiceNumber: "INV-001", status: "Draft", totalAmount: 14700, amountPaid: 0, balanceDue: 14700 } }`

---

### 8.2 — Verify Auto-Generated Journal Entry for INV-001

Navigate to `/journal-entries` and find the most recent entry with reference `INV-001`.

**Expected Journal Entry:**

| Field        | Value                 |
| ------------ | --------------------- |
| Entry Type   | AUTO_INVOICE (type 2) |
| Status       | `Posted`              |
| Reference    | `INV-001`             |
| Total Debit  | ₱14,700.00            |
| Total Credit | ₱14,700.00            |

**Lines:**

| Account Code | Account Name          | Debit      | Credit     |
| ------------ | --------------------- | ---------- | ---------- |
| 1100         | Accounts Receivable   | ₱14,700.00 | ₱0.00      |
| 4010         | Product Sales Revenue | ₱0.00      | ₱4,200.00  |
| 4000         | IT Services Revenue   | ₱0.00      | ₱10,500.00 |

> Verify `totalDebit (14,700) === totalCredit (14,700)` ✓

---

### 8.3 — Verify Inventory Deduction from INV-001

Navigate to `/inventory`:

- **Laptop Stand (LS-001):** quantity was 60 → now **58** (sold 2)
- **HDMI Cable 2m (HC-002):** quantity was 100 → now **96** (sold 4)
- **IT Consultation (SVC-001):** quantity unchanged (service item)

---

### 8.4 — Create INV-002 (Starlight Media Inc.)

Click **+ Create Invoice**:

**Header:**

| Field          | Value             |
| -------------- | ----------------- |
| Customer       | `Starlight Media` |
| Invoice Number | `INV-002`         |
| Invoice Date   | `2026-04-08`      |
| Due Date       | `2026-05-08`      |
| Tax Rate       | `0`               |
| Discount       | `0`               |

**Line Items:**

| #   | Description             | Quantity | Unit Price | Account                      | Inventory Item            | Amount         |
| --- | ----------------------- | -------- | ---------- | ---------------------------- | ------------------------- | -------------- |
| 1   | IT Consultation (5 hrs) | 5        | 3,500.00   | `4000 — IT Services Revenue` | IT Consultation (SVC-001) | **₱17,500.00** |

**Totals:**

| Field            | Expected Value |
| ---------------- | -------------- |
| Subtotal         | ₱17,500.00     |
| **Total Amount** | **₱17,500.00** |

Click **Save**.

**Expected result:**

**UI:** Toast: "Invoice created successfully" → INV-002 appears in the invoices list with status badge **Draft**, customer "Starlight Media", total **₱17,500.00**, balance due **₱17,500.00**.

**API (Network tab):** `{ success: true, data: { invoiceNumber: "INV-002", totalAmount: 17500, amountPaid: 0, balanceDue: 17500, status: "Draft" } }`

---

### 8.5 — Verify Auto-Generated Journal Entry for INV-002

Navigate to `/journal-entries`, find entry referencing `INV-002`:

**Lines:**

| Account Code | Account Name        | Debit      | Credit     |
| ------------ | ------------------- | ---------- | ---------- |
| 1100         | Accounts Receivable | ₱17,500.00 | ₱0.00      |
| 4000         | IT Services Revenue | ₱0.00      | ₱17,500.00 |

> `totalDebit (17,500) === totalCredit (17,500)` ✓

---

### 8.6 — Send INV-001

Find INV-001 → click **Send Invoice**.

**Expected result:**

**UI:** Toast: "Invoice sent" → the status badge on INV-001 updates from grey **Draft** → blue **Sent**. The "Send Invoice" button is no longer available (or is replaced with a "Mark as Paid" action).

**API (Network tab):** `{ success: true, data: { status: "Sent" } }`

---

## Phase 9 — Bills

Navigate to `/bills`

### 9.1 — Create BILL-001 (TechParts Depot)

Click **+ Create Bill**:

**Header:**

| Field       | Value             |
| ----------- | ----------------- |
| Supplier    | `TechParts Depot` |
| Bill Number | `BILL-001`        |
| Bill Date   | `2026-04-10`      |
| Due Date    | `2026-05-10`      |
| Tax Rate    | `0`               |
| Discount    | `0`               |

**Line Items:**

| #   | Description             | Quantity | Unit Price | Account            | Inventory Item         | Amount        |
| --- | ----------------------- | -------- | ---------- | ------------------ | ---------------------- | ------------- |
| 1   | Laptop Stand (restock)  | 10       | 800.00     | `1200 — Inventory` | Laptop Stand (LS-001)  | **₱8,000.00** |
| 2   | HDMI Cable 2m (restock) | 20       | 200.00     | `1200 — Inventory` | HDMI Cable 2m (HC-002) | **₱4,000.00** |

**Totals:**

| Field            | Expected Value |
| ---------------- | -------------- |
| Subtotal         | ₱12,000.00     |
| **Total Amount** | **₱12,000.00** |

Click **Save**.

**Expected result:**

**UI:** Toast: "Bill created successfully" → BILL-001 appears in the bills list with status badge **Draft**, supplier "TechParts Depot", total **₱12,000.00**, and balance due **₱12,000.00**.

**API (Network tab):** `{ success: true, data: { billNumber: "BILL-001", status: "Draft", totalAmount: 12000, amountPaid: 0, balanceDue: 12000 } }`

---

### 9.2 — Verify Auto-Generated Journal Entry for BILL-001

Navigate to `/journal-entries`, find entry referencing `BILL-001`:

**Expected Journal Entry:**

| Field        | Value              |
| ------------ | ------------------ |
| Entry Type   | AUTO_BILL (type 4) |
| Status       | `Posted`           |
| Reference    | `BILL-001`         |
| Total Debit  | ₱12,000.00         |
| Total Credit | ₱12,000.00         |

**Lines:**

| Account Code | Account Name     | Debit      | Credit     |
| ------------ | ---------------- | ---------- | ---------- |
| 1200         | Inventory        | ₱12,000.00 | ₱0.00      |
| 2000         | Accounts Payable | ₱0.00      | ₱12,000.00 |

> `totalDebit (12,000) === totalCredit (12,000)` ✓

---

### 9.3 — Verify Inventory Restocked from BILL-001

Navigate to `/inventory`:

- **Laptop Stand (LS-001):** was 58 → now **68** (restocked 10)
- **HDMI Cable 2m (HC-002):** was 96 → now **116** (restocked 20)

---

### 9.4 — Approve BILL-001

Find BILL-001 → click **Approve**.

**Expected result:**

**UI:** Toast: "Bill approved" → the status badge on BILL-001 updates from grey **Draft** → blue **Sent** (or **Approved**, depending on UI label). The **Approve** button is no longer visible.

**API (Network tab):** `{ success: true, data: { status: "Sent" } }`

---

## Phase 10 — Payments Received

Navigate to `/payments` → **Received** tab

### 10.1 — Partial Payment PAY-001a (₱7,000 on INV-001)

Click **+ Record Payment Received**:

| Field            | Value                         |
| ---------------- | ----------------------------- |
| Customer         | `Mabuhay Events Corp`         |
| Payment Date     | `2026-04-12`                  |
| Payment Method   | `Bank Transfer`               |
| Reference Number | `BPI-TXN-001`                 |
| Amount           | `7000`                        |
| Bank Account     | `1010 — BPI Business Account` |
| Allocations      | INV-001 → ₱7,000              |

Click **Save**.

**Expected result:**

**UI:** Toast: "Payment recorded successfully" → new payment row appears in the Received Payments list showing amount **₱7,000.00**, method "Bank Transfer", reference "BPI-TXN-001", and status badge **COMPLETED**.

**API (Network tab):** `{ success: true, data: { paymentNumber: "PAY-001", amount: 7000, paymentType: "Received", status: "COMPLETED", allocations: [{ documentNumber: "INV-001", allocatedAmount: 7000, documentType: "INVOICE" }] } }`

**Verify INV-001 updated:**

- Navigate to INV-001 detail
- **UI:** Status badge changes from **Sent** → orange **Partial**, amount paid shows **₱7,000.00**, balance due shows **₱7,700.00**
- **API:** `{ status: "Partial", amountPaid: 7000, balanceDue: 7700 }`

**Auto-generated Journal Entry for PAY-001a:**

| Account Code | Account Name         | Debit     | Credit    |
| ------------ | -------------------- | --------- | --------- |
| 1010         | BPI Business Account | ₱7,000.00 | ₱0.00     |
| 1100         | Accounts Receivable  | ₱0.00     | ₱7,000.00 |

> `totalDebit (7,000) === totalCredit (7,000)` ✓

---

### 10.2 — Remaining Payment PAY-001b (₱7,700 on INV-001)

Click **+ Record Payment Received**:

| Field            | Value                         |
| ---------------- | ----------------------------- |
| Customer         | `Mabuhay Events Corp`         |
| Payment Date     | `2026-04-14`                  |
| Payment Method   | `Bank Transfer`               |
| Reference Number | `BPI-TXN-002`                 |
| Amount           | `7700`                        |
| Bank Account     | `1010 — BPI Business Account` |
| Allocations      | INV-001 → ₱7,700              |

Click **Save**.

**Expected result:**

**UI:** Toast: "Payment recorded successfully" → new payment row appears with amount **₱7,700.00**, status badge **COMPLETED**.

**API (Network tab):** `{ success: true, data: { amount: 7700, status: "COMPLETED", allocations: [{ documentNumber: "INV-001", allocatedAmount: 7700 }] } }`

**Verify INV-001 fully paid:**

- **UI:** Status badge updates to green **Paid**, amount paid **₱14,700.00**, balance due **₱0.00**. The "Record Payment" button on the invoice is disabled or hidden.
- **API:** `{ status: "Paid", amountPaid: 14700, balanceDue: 0 }`

**Auto-generated Journal Entry for PAY-001b:**

| Account Code | Account Name         | Debit     | Credit    |
| ------------ | -------------------- | --------- | --------- |
| 1010         | BPI Business Account | ₱7,700.00 | ₱0.00     |
| 1100         | Accounts Receivable  | ₱0.00     | ₱7,700.00 |

---

### 10.3 — Multi-Invoice Payment PAY-003 (₱17,500 on INV-002)

Click **+ Record Payment Received**:

| Field            | Value                         |
| ---------------- | ----------------------------- |
| Customer         | `Starlight Media`             |
| Payment Date     | `2026-04-16`                  |
| Payment Method   | `Bank Transfer`               |
| Reference Number | `BPI-TXN-003`                 |
| Amount           | `17500`                       |
| Bank Account     | `1010 — BPI Business Account` |
| Allocations      | INV-002 → ₱17,500             |

Click **Save**.

**Expected result:**

**UI:** Toast: "Payment recorded successfully" → new payment row appears with amount **₱17,500.00**, status badge **COMPLETED**.

**API (Network tab):** `{ success: true, data: { amount: 17500, status: "COMPLETED", allocations: [{ documentNumber: "INV-002", allocatedAmount: 17500, documentType: "INVOICE" }] } }`

**Verify INV-002:**

- **UI:** INV-002 status badge updates to green **Paid**, balance due **₱0.00**.
- **API:** `{ status: "Paid", amountPaid: 17500, balanceDue: 0 }`

**Auto-generated Journal Entry for PAY-003:**

| Account Code | Account Name         | Debit      | Credit     |
| ------------ | -------------------- | ---------- | ---------- |
| 1010         | BPI Business Account | ₱17,500.00 | ₱0.00      |
| 1100         | Accounts Receivable  | ₱0.00      | ₱17,500.00 |

---

### 10.4 — Verify Suggest Allocations

Navigate to `POST /api/v1/payments/suggest-allocations` (or via DevTools):

**Request body:**

```
{ "customerId": "<mabuhay-id>", "amount": 14700 }
```

**Expected result:**

- Returns INV-001 as a suggested allocation (before it was paid)
- After INV-001 is paid, no open invoices are suggested for Mabuhay

---

### 10.5 — Void Payment PAY-001b (then restore)

Find PAY-001b in the received payments list → click **Void**.

**Expected result:**

**UI:** Toast: "Payment voided" → PAY-001b row in the payments list shows status badge **VOIDED** (with strikethrough styling). Navigate to INV-001 — status badge reverts from **Paid** → orange **Partial**, amount paid shows **₱7,000.00**, balance due shows **₱7,700.00**.

**API:**

- PAY-001b status → `VOIDED`
- INV-001 reverts to `{ status: "Partial", amountPaid: 7000, balanceDue: 7700 }`
- Reversing journal entry auto-created: `Dr AR ₱7,700 / Cr BPI Business Account ₱7,700`

**Re-record PAY-001b** (repeat step 10.2 exactly) to restore full-paid state.

**Verify INV-001 final state:**

- `{ status: "Paid", amountPaid: 14700, balanceDue: 0 }`

---

### 10.6 — Verify Customer Credit After Full Payment

Navigate to Mabuhay Events Corp → **Check Credit**:

**Expected result:**

- `{ creditLimit: 200000, currentBalance: 0, availableCredit: 200000 }`

---

## Phase 11 — Payments Made

Navigate to `/payments` → **Made** tab

### 11.1 — Record PAY-002 (Pay BILL-001 in Full)

Click **+ Record Payment Made**:

| Field            | Value                         |
| ---------------- | ----------------------------- |
| Supplier         | `TechParts Depot`             |
| Payment Date     | `2026-04-18`                  |
| Payment Method   | `Bank Transfer`               |
| Reference Number | `BPI-OUT-001`                 |
| Amount           | `12000`                       |
| Bank Account     | `1010 — BPI Business Account` |
| Allocations      | BILL-001 → ₱12,000            |

Click **Save**.

**Expected result:**

**UI:** Toast: "Payment recorded successfully" → new payment row appears in the Made Payments list showing amount **₱12,000.00**, supplier "TechParts Depot", method "Bank Transfer", status badge **COMPLETED**.

**API (Network tab):** `{ success: true, data: { amount: 12000, paymentType: "Made", status: "COMPLETED", allocations: [{ documentNumber: "BILL-001", allocatedAmount: 12000, documentType: "BILL" }] } }`

**Verify BILL-001:**

- **UI:** BILL-001 status badge updates to green **Paid**, amount paid **₱12,000.00**, balance due **₱0.00**. The "Record Payment" button on the bill is disabled or hidden.
- **API:** `{ status: "Paid", amountPaid: 12000, balanceDue: 0 }`

**Auto-generated Journal Entry for PAY-002:**

| Account Code | Account Name         | Debit      | Credit     |
| ------------ | -------------------- | ---------- | ---------- |
| 2000         | Accounts Payable     | ₱12,000.00 | ₱0.00      |
| 1010         | BPI Business Account | ₱0.00      | ₱12,000.00 |

> `totalDebit (12,000) === totalCredit (12,000)` ✓

---

## Phase 12 — Manual Journal Entries

Navigate to `/journal-entries`

### 12.1 — Create Unbalanced Entry (Error Test)

Click **+ New Journal Entry**:

| Field       | Value             |
| ----------- | ----------------- |
| Entry Date  | `2026-04-20`      |
| Description | `April 2026 Rent` |

**Lines (intentionally unbalanced):**

| Account             | Debit      | Credit     |
| ------------------- | ---------- | ---------- |
| 5010 — Rent Expense | ₱25,000.00 | ₱0.00      |
| 1000 — Cash on Hand | ₱0.00      | ₱20,000.00 |

Click **Save** or **Post**.

**Expected error:**

**UI:** A red error toast appears: _"Journal entry must balance. Total debits (25,000) do not equal total credits (20,000)."_ — the form stays open with all entered data intact and no entry appears in the journal entries list.

**API (Network tab):** HTTP 422 Unprocessable Entity

---

### 12.2 — Create Valid Draft JE (April Rent)

Correct the entry:

| Field       | Value                              |
| ----------- | ---------------------------------- |
| Entry Date  | `2026-04-20`                       |
| Description | `April 2026 — Office Rent Payment` |

**Lines:**

| Account             | Debit      | Credit     |
| ------------------- | ---------- | ---------- |
| 5010 — Rent Expense | ₱25,000.00 | ₱0.00      |
| 1000 — Cash on Hand | ₱0.00      | ₱25,000.00 |

Click **Save as Draft**.

**Expected result:**

**UI:** Toast: "Journal entry saved" → the new entry appears in the journal entries list with status badge **Draft**, description "April 2026 — Office Rent Payment", total debit/credit both showing **₱25,000.00**.

**API (Network tab):** `{ success: true, data: { status: "Draft", totalDebit: 25000, totalCredit: 25000 } }`

---

### 12.3 — Edit a Draft Entry

With the rent JE still in **Draft** status, click **Edit**. Change the description to:
`April 2026 — Office Rent (BGC)`

Click **Save**.

**Expected result:**

**UI:** Toast: "Journal entry updated" → the entry detail page now shows the updated description "April 2026 — Office Rent (BGC)". Status badge still shows **Draft**.

**API (Network tab):** `{ success: true, data: { description: "April 2026 — Office Rent (BGC)" } }`

---

### 12.4 — Post the Draft JE

Click **Post** on the rent journal entry.

**Expected result:**

**UI:** Toast: "Journal entry posted" → status badge changes from grey **Draft** → green **Posted**. The **Edit** button disappears or is disabled — posted entries are read-only.

**API (Network tab):** `{ success: true, data: { status: "Posted" } }`

**Try to edit the posted entry:**

- Click Edit (if button still shown) → **Expected error:** HTTP 400, `"Cannot edit a posted journal entry"`

---

### 12.5 — Void the Posted JE

Click **Void** on the posted rent JE.

**Expected result:**

**UI:** Toast: "Journal entry voided" → the original entry's status badge updates to red **Void**. A new journal entry row appears automatically in the list (the reversing entry) with status **Posted** and a reference back to the original entry. Editing the voided entry is blocked.

**API:**

- Status changes to **`Void`**
- A reversing entry is auto-created:

| Account             | Debit      | Credit     |
| ------------------- | ---------- | ---------- |
| 1000 — Cash on Hand | ₱25,000.00 | ₱0.00      |
| 5010 — Rent Expense | ₱0.00      | ₱25,000.00 |

- Reversing entry status: `Posted`
- `{ success: true, data: { status: "Void" } }`

---

### 12.6 — Re-create and Post the Rent JE

Repeat steps 12.2 and 12.4 to re-create and post the rent JE so it remains as **Posted** for the report phases:

| Account             | Debit      | Credit     |
| ------------------- | ---------- | ---------- |
| 5010 — Rent Expense | ₱25,000.00 | ₱0.00      |
| 1000 — Cash on Hand | ₱0.00      | ₱25,000.00 |

**Final state:** Posted rent JE for ₱25,000.

---

## Phase 13 — Ledger

Navigate to `/ledger`

### 13.1 — General Ledger Overview

Click **General Ledger** tab (or `/ledger/general`).

**Expected result:**

- All accounts with posted transactions are listed
- Each account shows its total debits, total credits, and net balance
- Accounts with zero activity may or may not appear (implementation-dependent)

---

### 13.2 — Filter by Account: Accounts Receivable (1100)

Navigate to `/ledger/account/<1100-account-id>` or use the account filter.

**Expected ledger lines (in date order):**

| Date       | Description    | Debit      | Credit     | Running Balance |
| ---------- | -------------- | ---------- | ---------- | --------------- |
| 2026-04-05 | Auto: INV-001  | ₱14,700.00 | ₱0.00      | ₱14,700.00      |
| 2026-04-08 | Auto: INV-002  | ₱17,500.00 | ₱0.00      | ₱32,200.00      |
| 2026-04-12 | Auto: PAY-001a | ₱0.00      | ₱7,000.00  | ₱25,200.00      |
| 2026-04-14 | Auto: PAY-001b | ₱0.00      | ₱7,700.00  | ₱17,500.00      |
| 2026-04-16 | Auto: PAY-003  | ₱0.00      | ₱17,500.00 | **₱0.00**       |

**Final balance: ₱0.00** (all AR cleared)

---

### 13.3 — Filter by Account: BPI Business Account (1010)

**Expected ledger lines:**

| Date       | Description    | Debit      | Credit     | Running Balance |
| ---------- | -------------- | ---------- | ---------- | --------------- |
| 2026-04-12 | Auto: PAY-001a | ₱7,000.00  | ₱0.00      | ₱7,000.00       |
| 2026-04-14 | Auto: PAY-001b | ₱7,700.00  | ₱0.00      | ₱14,700.00      |
| 2026-04-16 | Auto: PAY-003  | ₱17,500.00 | ₱0.00      | ₱32,200.00      |
| 2026-04-18 | Auto: PAY-002  | ₱0.00      | ₱12,000.00 | **₱20,200.00**  |

**Final balance: ₱20,200.00** ✓

---

### 13.4 — Filter by Date Range

Use date range: `2026-04-01` → `2026-04-30`.

**Expected result:**

- Only entries dated within April 2026 appear
- Count matches the total number of posted JE lines created in this guide

---

### 13.5 — Trial Balance

Navigate to `/ledger/trial-balance` or Reports → Trial Balance.

**Expected result (partial — key accounts):**

| Account                      | Total Debits | Total Credits | Net Balance               |
| ---------------------------- | ------------ | ------------- | ------------------------- |
| 1000 — Cash on Hand          | ₱0.00        | ₱25,000.00    | ₱-25,000.00 (Dr side = 0) |
| 1010 — BPI Business Account  | ₱32,200.00   | ₱12,000.00    | ₱20,200.00 Dr             |
| 1100 — Accounts Receivable   | ₱32,200.00   | ₱32,200.00    | ₱0.00                     |
| 1200 — Inventory             | ₱12,000.00   | ₱0.00         | ₱12,000.00 Dr             |
| 2000 — Accounts Payable      | ₱12,000.00   | ₱12,000.00    | ₱0.00                     |
| 4000 — IT Services Revenue   | ₱0.00        | ₱28,000.00    | ₱28,000.00 Cr             |
| 4010 — Product Sales Revenue | ₱0.00        | ₱4,200.00     | ₱4,200.00 Cr              |
| 5010 — Rent Expense          | ₱25,000.00   | ₱0.00         | ₱25,000.00 Dr             |

> **Grand total check:** Sum of all debit balances must equal sum of all credit balances.

---

## Phase 14 — Reports

Navigate to `/reports`

### 14.1 — Trial Balance Report

Click **Trial Balance** → set date range to `2026-04-01` → `2026-04-30`.

**Expected result:**

**UI:** Report renders a table of all accounts with debit and credit columns. The footer row shows **Grand Total Debits = Grand Total Credits** in bold. No red error banner is shown.

**API (Network tab):** `{ success: true, data: { totalDebits: <X>, totalCredits: <X> } }` — both values equal

---

### 14.2 — Income Statement (Profit & Loss)

Click **Income Statement** → set period `2026-04-01` → `2026-04-30`.

**Expected values:**

| Section            | Account               | Amount         |
| ------------------ | --------------------- | -------------- |
| **Revenue**        | IT Services Revenue   | ₱28,000.00     |
| **Revenue**        | Product Sales Revenue | ₱4,200.00      |
| **Total Revenue**  |                       | **₱32,200.00** |
| **Expenses**       | Rent Expense          | ₱25,000.00     |
| **Total Expenses** |                       | **₱25,000.00** |
| **Net Income**     |                       | **₱7,200.00**  |

> Formula: Net Income = Total Revenue − Total Expenses = ₱32,200 − ₱25,000 = **₱7,200** ✓

---

### 14.3 — Balance Sheet

Click **Balance Sheet** → set as of date `2026-04-30`.

**Expected structure:**

| Section                         | Account              | Amount           |
| ------------------------------- | -------------------- | ---------------- |
| **Assets**                      | Cash on Hand         | ₱0.00            |
| **Assets**                      | BPI Business Account | ₱20,200.00       |
| **Assets**                      | Accounts Receivable  | ₱0.00            |
| **Assets**                      | Inventory            | ₱12,000.00\*     |
| **Total Assets**                |                      | **≥ ₱32,200.00** |
| **Liabilities**                 | Accounts Payable     | ₱0.00            |
| **Total Liabilities**           |                      | **₱0.00**        |
| **Equity**                      | Owner's Equity       | ₱0.00            |
| **Net Income (Current Period)** |                      | ₱7,200.00        |
| **Total Equity**                |                      | **₱7,200.00**    |

> **Accounting Equation:** Total Assets = Total Liabilities + Total Equity ✓
>
> \*Inventory balance reflects ₱12,000 purchased (BILL-001) minus the cost of items sold via INV-001. The exact COGS depends on unit cost × quantity sold:
>
> - 2 × ₱800 = ₱1,600 (Laptop Stands)
> - 4 × ₱200 = ₱800 (HDMI Cables)
> - **Total COGS: ₱2,400**
> - **Net Inventory: ₱12,000 − ₱2,400 = ₱9,600**

---

### 14.4 — Cash Flow Statement

Click **Cash Flow** → set period `2026-04-01` → `2026-04-30`.

**Expected operating activities:**

| Description                                                  | Amount         |
| ------------------------------------------------------------ | -------------- |
| Cash received from customers (PAY-001a + PAY-001b + PAY-003) | +₱32,200.00    |
| Cash paid to suppliers (PAY-002)                             | −₱12,000.00    |
| Cash paid for rent (JE-RENT)                                 | −₱25,000.00    |
| **Net Cash from Operations**                                 | **−₱4,800.00** |

> BPI Business Account reflects cash in/out. Cash on Hand was reduced by ₱25,000 (rent).

---

### 14.5 — AR Aging Report

Click **AR Aging** → set as of date `2026-04-30`.

**Expected result:**

**UI:** Report renders with all invoices showing **₱0** across every aging bucket (Current, 1–30 days, 31–60 days, 61–90 days, 90+ days). The Total Outstanding row shows **₱0.00**. No red "Overdue" badges are displayed.

**API (Network tab):** `{ success: true, data: { totalOutstanding: 0 } }`

---

### 14.6 — AP Aging Report

Click **AP Aging** → set as of date `2026-04-30`.

**Expected result:**

**UI:** Report renders with BILL-001 showing **₱0** across all aging buckets. Total Outstanding row shows **₱0.00**. No overdue entries.

**API (Network tab):** `{ success: true, data: { totalOutstanding: 0 } }`

---

## Phase 15 — Dashboard

Navigate to `/dashboard`

### 15.1 — KPI Cards

**Expected KPI card values:**

| KPI Card                   | Expected Value                                  |
| -------------------------- | ----------------------------------------------- |
| Total Revenue (April 2026) | ₱32,200.00                                      |
| Outstanding Invoices       | ₱0.00 (all paid)                                |
| Outstanding Bills          | ₱0.00 (BILL-001 paid)                           |
| Cash Balance               | ₱20,200.00 (BPI) + ₱0 (Cash on Hand after rent) |
| Pending Invoice Count      | 0                                               |
| Pending Bill Count         | 0                                               |

---

### 15.2 — Analytics (Year 2026)

Navigate to `/dashboard` → Analytics tab → year `2026`.

**Expected:**

- The April 2026 bar/column shows revenue activity
- Revenue: ₱32,200 for April
- Expenses: ₱25,000 for April
- Other months show ₱0 (no transactions)

---

## Phase 16 — Roles & Permissions

Navigate to `/settings/team` or `/roles`

### 16.1 — View Default Roles

**Expected result:**

- Five system roles listed: `owner`, `admin`, `accountant`, `staff`, `viewer`
- Each role shows its permission matrix
- System roles cannot be deleted (no delete button shown, or button disabled)

---

### 16.2 — Create Custom Role

Click **+ New Role**:

| Field       | Value                                            |
| ----------- | ------------------------------------------------ |
| Role Name   | `Billing Staff`                                  |
| Description | `Can create and view invoices and payments only` |

**Permissions to assign:**

| Resource   | Actions          |
| ---------- | ---------------- |
| `invoice`  | `read`, `create` |
| `payment`  | `read`           |
| `customer` | `read`           |

Click **Save**.

**Expected result:**

**UI:** Toast: "Role created" → "Billing Staff" appears in the roles list. Clicking into the role shows the assigned permissions with the correct checkboxes ticked.

**API (Network tab):** `{ success: true, data: { name: "Billing Staff", permissions: [{ resource: "invoice", actions: ["read", "create"] }, { resource: "payment", actions: ["read"] }, { resource: "customer", actions: ["read"] }] } }`

---

### 16.3 — Update the Custom Role

Find **Billing Staff** → click **Edit**. Add `customer: update` permission.

Click **Save**.

**Expected result:**

**UI:** Toast: "Role updated" → the Billing Staff role detail now shows the `customer: update` permission checkbox as checked.

**API (Network tab):** `{ success: true, data: { permissions: [..., { resource: "customer", actions: ["read", "update"] }] } }`

---

### 16.4 — Delete the Custom Role

Click **Delete** on the **Billing Staff** role → confirm.

**Expected result:**

- Role removed from the list
- `{ success: true }`

Re-create the **Billing Staff** role (repeat 16.2) — it will be needed in Phase 17.

---

### 16.5 — Get Default Permission Matrix

Via DevTools or `/api/v1/roles/defaults`:

**Expected result:**

- Returns a map of all 5 `OrgRole` values with their default allowed resources and actions
- `owner` has all resources with all actions
- `viewer` has only `read` on most resources

---

## Phase 17 — Team Management & Members

Navigate to `/settings/team`

### 17.1 — Invite a Team Member

Click **Invite Member**:

| Field | Value               |
| ----- | ------------------- |
| Email | `rosa@techserve.ph` |
| Role  | `Staff`             |

Click **Send Invite**.

**Expected result:**

- Invite sent notification appears
- Pending invite visible in the team list with status `Pending`

---

### 17.2 — Pre-configure Permissions for Pending Invite

Via DevTools → `POST /api/v1/members/pending-permissions`:

```
{
  "email": "rosa@techserve.ph",
  "roleId": "<billing-staff-role-id>",
  "grants": [],
  "revocations": []
}
```

**Expected result:**

- `{ success: true }` — permissions stored for when invite is accepted

---

### 17.3 — Provision Member (simulate accept)

Via DevTools → `POST /api/v1/members/provision`:

```
{
  "userId": "<rosa-user-id>",
  "roleId": "<billing-staff-role-id>"
}
```

**Expected result:**

- `{ success: true, data: { userId: "<rosa-user-id>", roleId: "<billing-staff-role-id>" } }`
- MemberPermission record created

---

### 17.4 — Check Effective Permissions

Via DevTools → `GET /api/v1/members/<rosa-user-id>/permissions/effective`:

**Expected result:**

- Only `invoice: [read, create]`, `payment: [read]`, `customer: [read, update]` returned
- No access to `accounts`, `reports`, `journalEntry`, etc.

---

### 17.5 — View Own Permissions (as Rosa)

`GET /api/v1/members/me/permissions/effective`

**Expected result:**

- Same permissions as above if logged in as Rosa

---

## Phase 18 — Audit Logs

Navigate to `/audit-logs`

### 18.1 — Full Audit Log List

**Expected result:**

- A long list of audit entries covering all actions performed in this guide
- Entries include: accounts created, invoices created, payments recorded, JEs posted, settings updated
- Columns: Timestamp, User, Action, Module, Record ID

---

### 18.2 — Filter by Module: invoice

Apply module filter `invoice`:

**Expected entries:**

- INV-001 created
- INV-001 sent
- INV-002 created
- (Any void operations if performed)

---

### 18.3 — Filter by User: Adrian Reyes

Apply user filter for `Adrian Reyes` (the owner):

**Expected result:**

- All actions performed by Adrian throughout this guide appear
- No entries for other users (Rosa hasn't performed any actions yet)

---

### 18.4 — Record History for INV-001

Navigate to `/audit-logs/record/<inv-001-id>` or filter by record ID:

**Expected audit trail (in order):**

| Timestamp  | Action | Description                                        |
| ---------- | ------ | -------------------------------------------------- |
| 2026-04-05 | CREATE | Invoice INV-001 created                            |
| 2026-04-05 | UPDATE | Status changed to `Sent`                           |
| 2026-04-12 | UPDATE | `amountPaid` updated to ₱7,000, status → `Partial` |
| 2026-04-14 | UPDATE | `amountPaid` updated to ₱14,700, status → `Paid`   |

---

## Phase 19 — Subscriptions

> **Note:** The subscription endpoints have no auth middleware. These tests verify the API directly. Use browser DevTools → Network tab, or the frontend billing settings at `/settings/billing`.

### 19.1 — Activate Subscription

`POST /api/v1/subscriptions/activate`

**Request body:**

```
{ "userId": "<adrian-user-id>", "planId": "pro-monthly" }
```

**Expected result:**

- HTTP 200/201
- `{ success: true, data: { userId: "<adrian-user-id>", planType: "PRO", status: "Active", billingCycle: "monthly" } }`

---

### 19.2 — Get Subscription

`GET /api/v1/subscriptions/<adrian-user-id>`

**Expected result:**

- `{ success: true, data: { status: "Active", planType: "PRO" } }`

---

### 19.3 — Cancel Subscription

`DELETE /api/v1/subscriptions/<adrian-user-id>`

**Expected result:**

- `{ success: true, data: { status: "Cancelled" } }`

**Re-activate** (repeat 19.1) to restore the active subscription for the test environment.

---

## Phase 20 — Period Close & Lock

Navigate to `/periods`

### 20.1 — Close April 2026

Find the **April 2026** period → click **Close Period**.

**Expected result:**

**UI:** Toast: "Period closed" → April 2026 row status badge updates from green **Open** → amber **Closed**. A confirmation dialog may appear first. Navigate to Journal Entries to confirm a new closing entry (AUTO type) was created automatically.

**Closing journal entry (auto-created):** transfers net income to Owner's Equity:

- `Dr IT Services Revenue ₱28,000 / Dr Product Sales Revenue ₱4,200 / Cr Rent Expense ₱25,000 / Cr Owner's Equity ₱7,200`

**API (Network tab):** `{ success: true, data: { status: "Closed", closingJournalEntryId: "<je-id>", closedAt: "2026-04-..." } }`

---

### 20.2 — Verify Closed Period Blocks New Transactions

Try to create a new invoice dated `2026-04-25` (within the closed period):

**Expected error:**

**UI:** A red error toast appears: _"Cannot post to a closed or locked period"_ — the invoice form stays open and no new invoice is saved.

**API (Network tab):** HTTP 400 or 422

---

### 20.3 — Reopen the Period

Click **Reopen** on the closed April 2026 period.

**Expected result:**

**UI:** Toast: "Period reopened" → status badge on April 2026 returns to green **Open**. Test by attempting to create a new invoice dated April 25 — it should succeed without a period error.

**API (Network tab):** `{ success: true, data: { status: "Open" } }`

---

### 20.4 — Lock the Period

Click **Lock** on April 2026 (after re-closing if needed, or lock directly).

**Expected result:**

**UI:** Toast: "Period locked" → status badge updates to red **Locked**. Both the **Reopen** and **Close** buttons are gone or disabled — a locked period cannot be changed through the UI.

**API (Network tab):** `{ success: true, data: { status: "Locked" } }`

---

### 20.5 — Verify Locked Period Cannot Be Reopened

Click **Reopen** on the locked period.

**Expected error:**

- Toast: `"A locked period cannot be reopened"`
- HTTP 400

---

### 20.6 — Check Date Against Closed/Locked Period

`GET /api/v1/periods/check-date?date=2026-04-15`

**Expected result:**

- `{ success: true, data: { isOpen: false, status: "Locked", periodName: "April 2026" } }`

---

## Phase 21 — Error Cases Appendix

This appendix documents all key error scenarios, organized by module. Use these to verify the API rejects invalid input correctly.

---

### Accounts

| Test                              | Input                                                        | Expected HTTP | Expected Error                                            |
| --------------------------------- | ------------------------------------------------------------ | ------------- | --------------------------------------------------------- |
| Duplicate account code            | `POST /accounts` with `accountCode: "1000"` (already exists) | 409           | `"Account code already exists"`                           |
| Missing required field            | `POST /accounts` without `accountName`                       | 422           | `"Account name is required"`                              |
| Invalid account type              | `POST /accounts` with `accountType: "Snacks"`                | 422           | `"Invalid account type"`                                  |
| Delete non-existent account       | `DELETE /accounts/000000000000000000000000`                  | 404           | `"Account not found"`                                     |
| Archive account with transactions | Archive an account linked to posted JE lines                 | 400           | `"Cannot archive account with transactions"` (or similar) |

---

### Customers

| Test                    | Input                                             | Expected HTTP | Expected Error                   |
| ----------------------- | ------------------------------------------------- | ------------- | -------------------------------- |
| Invalid email format    | `POST /customers` with `email: "not-an-email"`    | 422           | `"Please enter a valid email"`   |
| Duplicate customer code | `POST /customers` with `customerCode: "CUST-001"` | 409           | `"Customer code already exists"` |
| Missing billing address | `POST /customers` without `billingAddress`        | 422           | `"Billing address is required"`  |

---

### Suppliers

| Test                    | Input                                             | Expected HTTP | Expected Error                    |
| ----------------------- | ------------------------------------------------- | ------------- | --------------------------------- |
| Duplicate supplier code | `POST /suppliers` with `supplierCode: "SUPP-001"` | 409           | `"Supplier code already exists"`  |
| Missing address         | `POST /suppliers` without `address`               | 422           | Validation error on address field |

---

### Inventory

| Test                         | Input                                            | Expected HTTP | Expected Error                                            |
| ---------------------------- | ------------------------------------------------ | ------------- | --------------------------------------------------------- |
| Duplicate SKU                | `POST /inventory` with `sku: "LS-001"`           | 409           | `"SKU already exists"`                                    |
| Invalid category             | `POST /inventory` with `category: "Electronics"` | 422           | `"Invalid category"` (must be Food, Non-Food, or Service) |
| Invalid unit                 | `POST /inventory` with `unit: "dozen"`           | 422           | `"Invalid unit"`                                          |
| Negative quantity adjustment | Adjust stock by `-999` when only 68 on hand      | 400           | `"Insufficient stock"`                                    |

---

### Invoices

| Test                           | Input                                                | Expected HTTP | Expected Error                               |
| ------------------------------ | ---------------------------------------------------- | ------------- | -------------------------------------------- |
| No line items                  | `POST /invoices` with empty `lineItems: []`          | 422           | `"Invoice must have at least one line item"` |
| Due date before invoice date   | `dueDate: "2026-04-01"`, `invoiceDate: "2026-04-10"` | 422           | `"Due date must be after invoice date"`      |
| Edit a posted invoice          | `PUT /invoices/<posted-id>`                          | 400           | `"Cannot edit a posted invoice"`             |
| Void an already-voided invoice | `POST /invoices/<void-id>/void`                      | 400           | `"Invoice is already voided"`                |

---

### Bills

| Test                          | Input                                    | Expected HTTP | Expected Error                             |
| ----------------------------- | ---------------------------------------- | ------------- | ------------------------------------------ |
| No line items                 | `POST /bills` with empty `lineItems: []` | 422           | `"Bill must have at least one line item"`  |
| Due date before bill date     | `dueDate` before bill creation date      | 422           | `"Due date must be on or after bill date"` |
| Approve already-approved bill | `POST /bills/<approved-id>/approve`      | 400           | `"Bill is already approved"`               |

---

### Payments

| Test                               | Input                                               | Expected HTTP | Expected Error                                  |
| ---------------------------------- | --------------------------------------------------- | ------------- | ----------------------------------------------- |
| Allocation exceeds invoice balance | Allocate ₱20,000 to an invoice with ₱14,700 balance | 422           | `"Allocated amount exceeds invoice balance"`    |
| Zero amount payment                | `amount: 0`                                         | 422           | `"Amount must be greater than zero"`            |
| Void an already-voided payment     | `POST /payments/<voided-id>/void`                   | 400           | `"Payment is already voided"`                   |
| Allocations don't match total      | `amount: 14700`, allocations sum to ₱10,000         | 422           | `"Total allocations must equal payment amount"` |

---

### Journal Entries

| Test                  | Input                                 | Expected HTTP | Expected Error                                     |
| --------------------- | ------------------------------------- | ------------- | -------------------------------------------------- |
| Unbalanced entry      | `totalDebit ≠ totalCredit`            | 422           | `"Journal entry must balance"`                     |
| Edit a posted entry   | `PUT /journal-entries/<posted-id>`    | 400           | `"Cannot edit a posted journal entry"`             |
| Delete a posted entry | `DELETE /journal-entries/<posted-id>` | 400           | `"Cannot delete a posted journal entry"`           |
| No lines              | `lines: []`                           | 422           | `"Journal entry must have at least one line item"` |

---

### Accounting Periods

| Test                              | Input                                           | Expected HTTP | Expected Error                                   |
| --------------------------------- | ----------------------------------------------- | ------------- | ------------------------------------------------ |
| Overlapping date range            | Create period with dates overlapping April 2026 | 409/422       | `"Period dates overlap with an existing period"` |
| Invalid period type               | `periodType: "Weekly"`                          | 422           | `"Invalid period type"`                          |
| Reopen a locked period            | `POST /periods/<locked-id>/reopen`              | 400           | `"A locked period cannot be reopened"`           |
| Post transaction to closed period | Create invoice dated in a closed period         | 400/422       | `"Cannot post to a closed or locked period"`     |

---

### Roles

| Test                              | Input                              | Expected HTTP | Expected Error                  |
| --------------------------------- | ---------------------------------- | ------------- | ------------------------------- |
| Delete a system role              | `DELETE /roles/<system-role-id>`   | 403           | `"Cannot delete a system role"` |
| Create role with invalid resource | `resource: "magic"` in permissions | 422           | `"Invalid resource"`            |
| Create role with invalid action   | `action: "fly"` in permissions     | 422           | `"Invalid action"`              |

---

### RBAC / Permission Guard

| Test                                        | Action                  | Expected                                   |
| ------------------------------------------- | ----------------------- | ------------------------------------------ |
| Rosa (Billing Staff) tries to view Accounts | Navigate to `/accounts` | Redirect or empty state — no data returned |
| Rosa tries to create a Journal Entry        | `POST /journal-entries` | HTTP 403, `"Insufficient permissions"`     |
| Rosa views invoices                         | `GET /invoices`         | HTTP 200 — full list returned              |

---

## Quick Verification Checklist

Use this checklist after completing all phases to confirm the full accounting cycle is consistent.

- [ ] All 12 accounts created and appear correctly in each type tab
- [ ] INV-001 total is ₱14,700 (2 × ₱1,200 + 4 × ₱450 + 3 × ₱3,500)
- [ ] INV-002 total is ₱17,500 (5 × ₱3,500)
- [ ] BILL-001 total is ₱12,000 (10 × ₱800 + 20 × ₱200)
- [ ] Inventory: Laptop Stand final qty = 68 (50 + 10 adj + 10 restock − 2 sold)
- [ ] Inventory: HDMI Cable final qty = 116 (100 + 20 restock − 4 sold)
- [ ] INV-001 status = Paid, amountPaid = ₱14,700, balanceDue = ₱0
- [ ] INV-002 status = Paid, amountPaid = ₱17,500, balanceDue = ₱0
- [ ] BILL-001 status = Paid, amountPaid = ₱12,000, balanceDue = ₱0
- [ ] AR ledger balance = ₱0 (all invoices cleared)
- [ ] AP ledger balance = ₱0 (all bills cleared)
- [ ] BPI Business Account balance = ₱20,200
- [ ] Income Statement: Revenue ₱32,200 − Expenses ₱25,000 = Net Income ₱7,200
- [ ] Balance Sheet: Total Assets = Total Liabilities + Total Equity
- [ ] Trial Balance: Total Debits = Total Credits
- [ ] AR Aging total outstanding = ₱0
- [ ] AP Aging total outstanding = ₱0
- [ ] April 2026 period status = Locked (after Phase 20)
- [ ] Audit log shows complete trail for INV-001 (create → sent → partial → paid)
- [ ] Custom role "Billing Staff" exists with correct permissions
- [ ] Rosa's effective permissions match Billing Staff role only
