# User Acceptance Testing (UAT) Guide

## TechServe Solutions Inc. — Accounting Software

> This document is for **client review and sign-off**. No technical background is required.
> Please work through each scenario in order, tick the result, and sign the final section.

---

## How to Use This Guide

1. Read each **Scenario** — it describes a real business task you would perform day-to-day
2. Follow the numbered **Steps** exactly as written
3. Compare what you see on screen with the **Expected Result**
4. Mark **PASS** if the screen matches the expected result, or **FAIL** if it does not
5. For any **FAIL**, write a short note in the **Remarks** column describing what you saw instead
6. When all scenarios are complete, sign the **UAT Sign-Off** section at the bottom

---

## Test Environment

| Item             | Value                    |
| ---------------- | ------------------------ |
| Application URL  | `http://localhost:3000`  |
| Test Company     | TechServe Solutions Inc. |
| Test Login       | `adrian@techserve.ph`    |
| Test Password    | `TechServe@2026!`        |
| Testing Period   | April 2026               |
| Document Version | 1.0                      |
| UAT Date         |                          |

---

## UAT Progress Tracker

| Section                  | Scenarios | Passed | Failed | Tester |
| ------------------------ | --------- | ------ | ------ | ------ |
| 1 — Registration & Setup | 3         |        |        |        |
| 2 — Chart of Accounts    | 4         |        |        |        |
| 3 — Company Settings     | 2         |        |        |        |
| 4 — Accounting Period    | 2         |        |        |        |
| 5 — Customers            | 3         |        |        |        |
| 6 — Suppliers            | 2         |        |        |        |
| 7 — Inventory            | 4         |        |        |        |
| 8 — Invoices             | 5         |        |        |        |
| 9 — Bills                | 3         |        |        |        |
| 10 — Receiving Payments  | 5         |        |        |        |
| 11 — Making Payments     | 2         |        |        |        |
| 12 — Journal Entries     | 4         |        |        |        |
| 13 — General Ledger      | 3         |        |        |        |
| 14 — Financial Reports   | 6         |        |        |        |
| 15 — Dashboard           | 2         |        |        |        |
| 16 — User Roles          | 3         |        |        |        |
| 17 — Team Management     | 2         |        |        |        |
| 18 — Audit History       | 2         |        |        |        |
| **Total**                | **57**    |        |        |        |

---

---

## Section 1 — Registration & Company Setup

> **Business context:** You are setting up the accounting system for the first time as a new business owner.

---

### UAT-1.1 — Create Your Account

**Scenario:** Register as a new user and verify your email.

**Steps:**

1. Open the application in your browser
2. Click **Sign Up** or **Create Account**
3. Enter your full name: `Adrian Reyes`
4. Enter your email: `adrian@techserve.ph`
5. Enter a password: `TechServe@2026!`
6. Click **Create Account**
7. Open your email inbox and look for a verification code
8. Enter the 6-digit code on the screen that appears

**Expected Result:**

- Your email is verified successfully
- You are taken to the company setup page
- No error messages appear

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

### UAT-1.2 — Set Up Your Company

**Scenario:** Enter your company's business details.

**Steps:**

1. On the company setup form, fill in the following details:

| Field             | Value to Enter                 |
| ----------------- | ------------------------------ |
| Company Name      | `TechServe Solutions Inc.`     |
| Business Type     | `Corporation`                  |
| Industry          | `Technology`                   |
| Company Size      | `1-10 employees`               |
| Currency          | `PHP - Philippine Peso`        |
| Address           | `Unit 5B, Picadilly Star, BGC` |
| City              | `Taguig`                       |
| Country           | `Philippines`                  |
| Postal Code       | `1634`                         |
| Phone Number      | `+63 917 000 1234`             |
| Company Email     | `info@techserve.ph`            |
| Tax ID (TIN)      | `987-654-321-000`              |
| Fiscal Year Start | `January 1, 2026`              |

2. Click **Create Company**

**Expected Result:**

- Your company is created successfully
- You are taken to the plan selection page
- The company name "TechServe Solutions Inc." is visible on the page

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

### UAT-1.3 — Choose a Plan and Access the Dashboard

**Scenario:** Select a subscription plan and access the main dashboard.

**Steps:**

1. Three plan options are shown (Starter, Professional, Enterprise)
2. Click **Get Started** on any plan
3. Observe the screen that loads next

**Expected Result:**

- You are taken directly to the **Dashboard**
- The left sidebar shows navigation links: Dashboard, Accounts, Customers, Suppliers, Invoices, Bills, Payments, Inventory, Journal Entries, Ledger, Reports, and Settings
- Your company name "TechServe Solutions Inc." is visible in the top navigation

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

---

## Section 2 — Chart of Accounts

> **Business context:** Setting up the Chart of Accounts is like creating the filing system for all your money. Every transaction will be sorted into one of these accounts.

---

### UAT-2.1 — Create Your Accounts

**Scenario:** Set up the accounts needed to track your business finances.

**Steps:**

1. Click **Accounts** in the left sidebar
2. Click **+ New Account** and create each of the following accounts. For each one, fill in the Code, Name, Type, and Normal Balance exactly as shown, then click **Save**:

| Account Code | Account Name          | Type      | Normal Balance |
| ------------ | --------------------- | --------- | -------------- |
| `1000`       | Cash on Hand          | Asset     | Debit          |
| `1010`       | BPI Business Account  | Asset     | Debit          |
| `1100`       | Accounts Receivable   | Asset     | Debit          |
| `1200`       | Inventory             | Asset     | Debit          |
| `2000`       | Accounts Payable      | Liability | Credit         |
| `3000`       | Owner's Equity        | Equity    | Credit         |
| `4000`       | IT Services Revenue   | Revenue   | Credit         |
| `4010`       | Product Sales Revenue | Revenue   | Credit         |
| `5000`       | Cost of Goods Sold    | Expense   | Debit          |
| `5010`       | Rent Expense          | Expense   | Debit          |
| `5020`       | Utilities Expense     | Expense   | Debit          |
| `5030`       | Salaries Expense      | Expense   | Debit          |

**Expected Result:**

- All 12 accounts are created without errors
- Each account appears in the main accounts list sorted by code number (1000, 1010, 1100… 5030)
- A success message appears after each creation

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

### UAT-2.2 — Filter Accounts by Type

**Scenario:** Verify that accounts are correctly grouped by their type.

**Steps:**

1. From the Accounts page, click the **Assets** tab or filter
2. Note which accounts are shown
3. Click the **Liabilities** tab — note which accounts appear
4. Click **Revenue** — note which accounts appear
5. Click **Expenses** — note which accounts appear

**Expected Result:**

| Tab / Filter | Accounts You Should See                                               |
| ------------ | --------------------------------------------------------------------- |
| Assets       | Cash on Hand, BPI Business Account, Accounts Receivable, Inventory    |
| Liabilities  | Accounts Payable                                                      |
| Equity       | Owner's Equity                                                        |
| Revenue      | IT Services Revenue, Product Sales Revenue                            |
| Expenses     | Cost of Goods Sold, Rent Expense, Utilities Expense, Salaries Expense |

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

### UAT-2.3 — Archive and Restore an Account

**Scenario:** Temporarily disable an account you are not yet using, then bring it back.

**Steps:**

1. Find **Utilities Expense** (code 5020) in the accounts list
2. Click the actions menu on that row and select **Archive**
3. Observe the result — the account should become inactive
4. Find the archived account (look for an "Archived" or "Inactive" filter)
5. Click **Restore** on the Utilities Expense account

**Expected Result:**

- After archiving: the account is marked as inactive or hidden from the main list
- A success message appears: "Account archived"
- After restoring: the account reappears in the active accounts list
- A success message appears: "Account restored"

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

### UAT-2.4 — View an Account's Balance

**Scenario:** Check the current balance of an account before any transactions have been entered.

**Steps:**

1. Click on **Accounts Receivable** (code 1100) from the accounts list
2. Look for a balance or summary section on the account detail page

**Expected Result:**

- The balance shows **₱0.00**
- No transactions are listed yet

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

---

## Section 3 — Company Settings

> **Business context:** Before recording any transactions, confirm your company's configuration is correct.

---

### UAT-3.1 — Update General Settings

**Scenario:** Set the correct date format and timezone for your business.

**Steps:**

1. Click **Settings** in the sidebar → select **General**
2. Set the following:

| Setting     | Value         |
| ----------- | ------------- |
| Date Format | `MM/DD/YYYY`  |
| Timezone    | `Asia/Manila` |
| Language    | `English`     |

3. Click **Save**
4. Refresh the page and check that the settings are still showing the values you entered

**Expected Result:**

- A "Settings saved" confirmation message appears
- After refreshing, all three settings retain the values you entered

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

### UAT-3.2 — Add a Bank Account

**Scenario:** Link your BPI business bank account to the system so payments can be tracked.

**Steps:**

1. Go to **Settings** → **Banking**
2. Click **+ Add Bank Account** and fill in:

| Field          | Value                                  |
| -------------- | -------------------------------------- |
| Bank Name      | `BPI (Bank of the Philippine Islands)` |
| Account Name   | `TechServe Solutions Inc.`             |
| Account Number | `1234-5678-90`                         |
| Account Type   | `Checking`                             |
| Linked Account | `1010 — BPI Business Account`          |

3. Click **Save**

**Expected Result:**

- The bank account appears in the banking settings with the name "BPI (Bank of the Philippine Islands)"
- The account number and type are shown correctly

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

---

## Section 4 — Accounting Period

> **Business context:** Accounting periods let you organize transactions by month and eventually close the books at the end of each period.

---

### UAT-4.1 — Create April 2026 Period

**Scenario:** Open the April 2026 accounting period so transactions can be recorded against it.

**Steps:**

1. Click **Periods** in the sidebar
2. Click **+ New Period** and fill in:

| Field       | Value            |
| ----------- | ---------------- |
| Period Name | `April 2026`     |
| Period Type | `Monthly`        |
| Fiscal Year | `2026`           |
| Start Date  | `April 1, 2026`  |
| End Date    | `April 30, 2026` |

3. Click **Create**

**Expected Result:**

- The period "April 2026" appears in the list
- Its status shows as **Open**
- Start and end dates are correct

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

### UAT-4.2 — Verify an Active Period Date

**Scenario:** Confirm the system recognizes April 15, 2026 as falling within an open period.

**Steps:**

1. From the Periods page, use the **Check Date** feature
2. Enter the date `April 15, 2026`
3. Click **Check**

**Expected Result:**

- The system confirms the date belongs to the **April 2026** period
- The period status shown is **Open**

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

---

## Section 5 — Customers

> **Business context:** Your customers are the businesses or people you send invoices to. You need to set them up before you can bill them.

---

### UAT-5.1 — Add Customer: Mabuhay Events Corp

**Scenario:** Register your first client — a corporate events company that regularly orders your IT services.

**Steps:**

1. Click **Customers** in the sidebar
2. Click **+ Add Customer** and fill in the following:

| Field           | Value                                                                  |
| --------------- | ---------------------------------------------------------------------- |
| Customer Code   | `CUST-001`                                                             |
| Customer Name   | `Mabuhay Events Corporation`                                           |
| Display Name    | `Mabuhay Events Corp`                                                  |
| Email           | `billing@mabuhay.ph`                                                   |
| Phone           | `+63 917 111 2222`                                                     |
| Tax ID          | `111-222-333-000`                                                      |
| Payment Terms   | `Net 30`                                                               |
| Credit Limit    | `200,000`                                                              |
| Opening Balance | `0`                                                                    |
| Billing Address | `2F Mabuhay Tower, Ayala Ave, Makati, Metro Manila, 1226, Philippines` |

3. Click **Save**

**Expected Result:**

- Mabuhay Events Corporation appears in the customers list
- Credit limit shows ₱200,000
- Status shows Active

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

### UAT-5.2 — Add Customer: Starlight Media Inc.

**Scenario:** Register a second client — a media company that hires you for IT consultation.

**Steps:**

1. Click **+ Add Customer** again and fill in:

| Field           | Value                                                              |
| --------------- | ------------------------------------------------------------------ |
| Customer Code   | `CUST-002`                                                         |
| Customer Name   | `Starlight Media Inc.`                                             |
| Display Name    | `Starlight Media`                                                  |
| Email           | `ap@starlightmedia.ph`                                             |
| Phone           | `+63 918 333 4444`                                                 |
| Tax ID          | `444-555-666-000`                                                  |
| Payment Terms   | `Net 15`                                                           |
| Credit Limit    | `100,000`                                                          |
| Opening Balance | `0`                                                                |
| Billing Address | `8F One World Place, BGC, Taguig, Metro Manila, 1634, Philippines` |

2. Click **Save**

**Expected Result:**

- Starlight Media Inc. appears in the customers list
- Credit limit shows ₱100,000
- Two customers now appear in the list total

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

### UAT-5.3 — Check Customer Credit Availability

**Scenario:** Before issuing a large invoice, confirm that a customer has sufficient credit available.

**Steps:**

1. Click on **Mabuhay Events Corp** to open the customer detail
2. Look for a **Check Credit** button or credit summary section
3. Click it

**Expected Result:**

- Credit Limit: ₱200,000
- Amount Used: ₱0.00
- Available Credit: **₱200,000**

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

---

## Section 6 — Suppliers

> **Business context:** Suppliers are the vendors you purchase goods and services from. You need them set up before you can record bills.

---

### UAT-6.1 — Add Supplier: TechParts Depot

**Scenario:** Register the hardware supplier you buy stock from.

**Steps:**

1. Click **Suppliers** in the sidebar
2. Click **+ Add Supplier** and fill in:

| Field           | Value                                                      |
| --------------- | ---------------------------------------------------------- |
| Supplier Code   | `SUPP-001`                                                 |
| Supplier Name   | `TechParts Depot`                                          |
| Display Name    | `TechParts Depot`                                          |
| Email           | `orders@techparts.ph`                                      |
| Phone           | `+63 919 555 6666`                                         |
| Tax ID          | `777-888-999-000`                                          |
| Payment Terms   | `Net 30`                                                   |
| Opening Balance | `0`                                                        |
| Address         | `Quezon Ave, Quezon City, Metro Manila, 1100, Philippines` |

3. Click **Save**

**Expected Result:**

- TechParts Depot appears in the suppliers list
- Status shows Active

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

### UAT-6.2 — Add Supplier: CloudHost PH

**Steps:**

1. Click **+ Add Supplier** and fill in:

| Field           | Value                                                                        |
| --------------- | ---------------------------------------------------------------------------- |
| Supplier Code   | `SUPP-002`                                                                   |
| Supplier Name   | `CloudHost PH`                                                               |
| Display Name    | `CloudHost PH`                                                               |
| Email           | `billing@cloudhost.ph`                                                       |
| Phone           | `+63 920 777 8888`                                                           |
| Tax ID          | `321-654-987-000`                                                            |
| Payment Terms   | `Net 15`                                                                     |
| Opening Balance | `0`                                                                          |
| Address         | `Cyber One Building, Eastwood, Quezon City, Metro Manila, 1110, Philippines` |

2. Click **Save**

**Expected Result:**

- CloudHost PH appears in the suppliers list
- Two suppliers now appear in the list total

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

---

## Section 7 — Inventory

> **Business context:** Track the physical products you sell (laptop stands, cables) and the services you offer (IT consultation).

---

### UAT-7.1 — Add Product: Laptop Stand

**Steps:**

1. Click **Inventory** in the sidebar
2. Click **+ Add Item** → select **Product**
3. Fill in:

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
| Selling Price    | `1,200`                            |

4. Click **Save**

**Expected Result:**

- Laptop Stand (LS-001) appears in the inventory list
- Quantity on hand shows **50**
- Cost price ₱800, Selling price ₱1,200

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

### UAT-7.2 — Add Product: HDMI Cable 2m

**Steps:**

1. Click **+ Add Item** → select **Product** and fill in:

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

2. Click **Save**

**Expected Result:**

- HDMI Cable 2m (HC-002) appears in the inventory list
- Quantity on hand shows **100**

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

### UAT-7.3 — Add Service: IT Consultation

**Steps:**

1. Click **+ Add Item** → select **Service** and fill in:

| Field         | Value                                        |
| ------------- | -------------------------------------------- |
| Item Type     | `Service`                                    |
| SKU           | `SVC-001`                                    |
| Item Name     | `IT Consultation`                            |
| Description   | `Hourly IT consulting and advisory services` |
| Category      | `Service`                                    |
| Unit          | `hour`                                       |
| Selling Price | `3,500`                                      |

2. Click **Save**

**Expected Result:**

- IT Consultation (SVC-001) appears as a **Service** type item
- No stock quantity shown (services have no physical inventory)

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

### UAT-7.4 — Adjust Stock Quantity

**Scenario:** You received 10 additional laptop stands that were not part of a supplier bill. Adjust the stock manually.

**Steps:**

1. Find **Laptop Stand (LS-001)** in the inventory list
2. Click **Adjust Stock** (or the adjustment option in the row menu)
3. Fill in:

| Field           | Value                               |
| --------------- | ----------------------------------- |
| Adjustment Type | `Addition` (increase stock)         |
| Quantity to Add | `10`                                |
| Reason          | `Additional opening stock received` |

4. Click **Submit**

**Expected Result:**

- Laptop Stand quantity updates from **50** → **60**
- A confirmation message appears
- The movement history for Laptop Stand shows one adjustment entry of +10

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

---

## Section 8 — Invoices

> **Business context:** Invoices are the bills you send to your clients. When you save an invoice, the system automatically records the accounting entry behind the scenes.

---

### UAT-8.1 — Create Invoice for Mabuhay Events Corp

**Scenario:** Mabuhay Events ordered 2 laptop stands, 4 HDMI cables, and 3 hours of IT consultation. Create their invoice.

**Steps:**

1. Click **Invoices** in the sidebar
2. Click **+ Create Invoice**
3. Fill in the header:

| Field          | Value                 |
| -------------- | --------------------- |
| Customer       | `Mabuhay Events Corp` |
| Invoice Number | `INV-001`             |
| Invoice Date   | `April 5, 2026`       |
| Due Date       | `May 5, 2026`         |

4. Add the following line items one by one (click **+ Add Line** for each):

| Item                    | Quantity | Unit Price | Account               |
| ----------------------- | -------- | ---------- | --------------------- |
| Laptop Stand            | 2        | ₱1,200.00  | Product Sales Revenue |
| HDMI Cable 2m           | 4        | ₱450.00    | Product Sales Revenue |
| IT Consultation (3 hrs) | 3        | ₱3,500.00  | IT Services Revenue   |

5. Verify the totals match before saving:

|           | Amount         |
| --------- | -------------- |
| Subtotal  | **₱14,700.00** |
| Tax       | ₱0.00          |
| Discount  | ₱0.00          |
| **Total** | **₱14,700.00** |

6. Click **Save**

**Expected Result:**

- Invoice INV-001 is created for ₱14,700.00
- Status shows **Draft**
- Amount Paid shows ₱0.00 | Balance Due shows **₱14,700.00**

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

### UAT-8.2 — Verify Inventory Was Automatically Deducted

**Scenario:** When you created the invoice, the system should have automatically reduced your stock for the items sold.

**Steps:**

1. Click **Inventory** in the sidebar
2. Look at the quantities for Laptop Stand and HDMI Cable

**Expected Result:**

| Item                      | Quantity Before | Quantity Sold | Quantity Now        |
| ------------------------- | --------------- | ------------- | ------------------- |
| Laptop Stand (LS-001)     | 60              | 2             | **58**              |
| HDMI Cable 2m (HC-002)    | 100             | 4             | **96**              |
| IT Consultation (SVC-001) | —               | —             | unchanged (service) |

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

### UAT-8.3 — Create Invoice for Starlight Media Inc.

**Scenario:** Starlight Media ordered 5 hours of IT consultation. Create their invoice.

**Steps:**

1. Click **+ Create Invoice** and fill in:

| Field          | Value             |
| -------------- | ----------------- |
| Customer       | `Starlight Media` |
| Invoice Number | `INV-002`         |
| Invoice Date   | `April 8, 2026`   |
| Due Date       | `May 8, 2026`     |

2. Add one line item:

| Item                    | Quantity | Unit Price | Account             |
| ----------------------- | -------- | ---------- | ------------------- |
| IT Consultation (5 hrs) | 5        | ₱3,500.00  | IT Services Revenue |

3. Verify total: **₱17,500.00**
4. Click **Save**

**Expected Result:**

- Invoice INV-002 is created for ₱17,500.00
- Status shows **Draft**
- Balance Due shows **₱17,500.00**

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

### UAT-8.4 — Send Invoice INV-001

**Scenario:** Mark INV-001 as "Sent" to indicate it has been delivered to the client.

**Steps:**

1. Open invoice **INV-001**
2. Click the **Send Invoice** button
3. Confirm the action if a dialog appears

**Expected Result:**

- INV-001 status changes from **Draft** → **Sent**
- The invoice detail page reflects the new status

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

### UAT-8.5 — Check the Accounting Entry Behind the Invoice

**Scenario:** The system automatically created a double-entry accounting record when the invoice was saved. Verify it is correct.

**Steps:**

1. Click **Journal Entries** in the sidebar
2. Find the most recent entry that references **INV-001**
3. Open the entry and review the lines

**Expected Result:**

The journal entry should show:

| Account               | Money In (Debit) | Money Out (Credit) |
| --------------------- | ---------------- | ------------------ |
| Accounts Receivable   | **₱14,700.00**   | —                  |
| Product Sales Revenue | —                | **₱4,200.00**      |
| IT Services Revenue   | —                | **₱10,500.00**     |

- Total debit (₱14,700) equals total credit (₱14,700) ✓
- Entry status shows **Posted**

> **What this means in plain English:** The system has recorded that ₱14,700 is now owed to you (Accounts Receivable), and it came from ₱4,200 in product sales and ₱10,500 in IT services.

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

---

## Section 9 — Bills (Supplier Invoices)

> **Business context:** Bills are invoices that your suppliers send to you. When you enter a bill, the system records what you owe and updates your inventory if you are purchasing stock.

---

### UAT-9.1 — Create Bill from TechParts Depot

**Scenario:** TechParts Depot delivered 10 laptop stands and 20 HDMI cables for restocking. Enter their bill.

**Steps:**

1. Click **Bills** in the sidebar
2. Click **+ Create Bill**
3. Fill in the header:

| Field       | Value             |
| ----------- | ----------------- |
| Supplier    | `TechParts Depot` |
| Bill Number | `BILL-001`        |
| Bill Date   | `April 10, 2026`  |
| Due Date    | `May 10, 2026`    |

4. Add line items:

| Item                    | Quantity | Unit Price | Account   |
| ----------------------- | -------- | ---------- | --------- |
| Laptop Stand (restock)  | 10       | ₱800.00    | Inventory |
| HDMI Cable 2m (restock) | 20       | ₱200.00    | Inventory |

5. Verify total: **₱12,000.00**
6. Click **Save**

**Expected Result:**

- BILL-001 is created for ₱12,000.00
- Status shows **Draft**
- Amount Owed shows **₱12,000.00**

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

### UAT-9.2 — Verify Inventory Was Restocked

**Scenario:** Confirm that creating the bill automatically added the purchased items back to your stock.

**Steps:**

1. Click **Inventory** in the sidebar
2. Check quantities for both products

**Expected Result:**

| Item                   | Before Bill | Restocked | Quantity Now |
| ---------------------- | ----------- | --------- | ------------ |
| Laptop Stand (LS-001)  | 58          | +10       | **68**       |
| HDMI Cable 2m (HC-002) | 96          | +20       | **116**      |

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

### UAT-9.3 — Approve the Bill

**Scenario:** Review and approve BILL-001 to confirm the goods were received.

**Steps:**

1. Open **BILL-001**
2. Click **Approve**

**Expected Result:**

- BILL-001 status changes from **Draft** → **Sent** (or **Approved**)

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

---

## Section 10 — Receiving Payments from Customers

> **Business context:** When a client pays you, you record the payment here. The system will automatically match it to the correct invoice and update the balance owed.

---

### UAT-10.1 — Record a Partial Payment on INV-001

**Scenario:** Mabuhay Events Corp sends a partial payment of ₱7,000 as a down payment on their ₱14,700 invoice.

**Steps:**

1. Click **Payments** in the sidebar → **Received** tab
2. Click **+ Record Payment Received**
3. Fill in:

| Field            | Value                  |
| ---------------- | ---------------------- |
| Customer         | `Mabuhay Events Corp`  |
| Payment Date     | `April 12, 2026`       |
| Payment Method   | `Bank Transfer`        |
| Reference Number | `BPI-TXN-001`          |
| Amount Received  | `7,000`                |
| Bank Account     | `BPI Business Account` |
| Apply to Invoice | INV-001 — ₱7,000       |

4. Click **Save**

**Expected Result:**

- Payment recorded successfully
- Open invoice INV-001 now shows:
  - Status: **Partial**
  - Amount Paid: **₱7,000.00**
  - Balance Due: **₱7,700.00**

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

### UAT-10.2 — Record the Remaining Payment on INV-001

**Scenario:** Mabuhay Events Corp sends the remaining ₱7,700 to fully settle their invoice.

**Steps:**

1. Click **+ Record Payment Received**
2. Fill in:

| Field            | Value                  |
| ---------------- | ---------------------- |
| Customer         | `Mabuhay Events Corp`  |
| Payment Date     | `April 14, 2026`       |
| Payment Method   | `Bank Transfer`        |
| Reference Number | `BPI-TXN-002`          |
| Amount Received  | `7,700`                |
| Bank Account     | `BPI Business Account` |
| Apply to Invoice | INV-001 — ₱7,700       |

3. Click **Save**

**Expected Result:**

- INV-001 is now fully paid:
  - Status: **Paid**
  - Amount Paid: **₱14,700.00**
  - Balance Due: **₱0.00**

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

### UAT-10.3 — Record Payment for Starlight Media (INV-002)

**Scenario:** Starlight Media pays their invoice of ₱17,500 in full.

**Steps:**

1. Click **+ Record Payment Received**
2. Fill in:

| Field            | Value                  |
| ---------------- | ---------------------- |
| Customer         | `Starlight Media`      |
| Payment Date     | `April 16, 2026`       |
| Payment Method   | `Bank Transfer`        |
| Reference Number | `BPI-TXN-003`          |
| Amount Received  | `17,500`               |
| Bank Account     | `BPI Business Account` |
| Apply to Invoice | INV-002 — ₱17,500      |

3. Click **Save**

**Expected Result:**

- INV-002 status: **Paid**
- Balance Due: **₱0.00**

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

### UAT-10.4 — Verify the Bank Account Balance Increased

**Scenario:** After receiving all three payments, confirm the BPI Business Account reflects the correct incoming total.

**Steps:**

1. Click **Accounts** in the sidebar
2. Open **BPI Business Account (1010)**
3. Look at the current balance

**Expected Result:**

- Total received so far: ₱7,000 + ₱7,700 + ₱17,500 = **₱32,200.00**
- Account balance shows **₱32,200.00** (before any outgoing payments)

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

### UAT-10.5 — Void a Payment and Observe the Effect

**Scenario:** You accidentally recorded the wrong payment amount. Void the second Mabuhay payment (₱7,700) and re-record it to see the correction flow.

**Steps:**

1. Go to **Payments → Received** and find the ₱7,700 Mabuhay payment (BPI-TXN-002)
2. Click **Void** and confirm
3. Go back to **Invoices** and open INV-001

**Expected Result after voiding:**

- The payment is marked as **Voided**
- INV-001 reverts to:
  - Status: **Partial**
  - Amount Paid: **₱7,000.00**
  - Balance Due: **₱7,700.00**

4. Re-record the ₱7,700 payment (repeat UAT-10.2 exactly)

**Expected Result after re-recording:**

- INV-001 returns to **Paid**, Balance Due **₱0.00**

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

---

## Section 11 — Making Payments to Suppliers

> **Business context:** When you pay a supplier's bill, record it here. The system updates the bill status and reduces what you owe.

---

### UAT-11.1 — Pay BILL-001 (TechParts Depot)

**Scenario:** Pay TechParts Depot the full ₱12,000 owed for BILL-001.

**Steps:**

1. Go to **Payments** → **Made** tab
2. Click **+ Record Payment Made**
3. Fill in:

| Field            | Value                  |
| ---------------- | ---------------------- |
| Supplier         | `TechParts Depot`      |
| Payment Date     | `April 18, 2026`       |
| Payment Method   | `Bank Transfer`        |
| Reference Number | `BPI-OUT-001`          |
| Amount Paid      | `12,000`               |
| Bank Account     | `BPI Business Account` |
| Apply to Bill    | BILL-001 — ₱12,000     |

4. Click **Save**

**Expected Result:**

- BILL-001 status: **Paid**
- Amount Paid: **₱12,000.00**
- Balance Due: **₱0.00**

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

### UAT-11.2 — Verify Bank Account Balance After Outgoing Payment

**Scenario:** Confirm the bank balance has decreased correctly after paying the supplier.

**Steps:**

1. Click **Accounts** → open **BPI Business Account (1010)**
2. Check the current balance

**Expected Result:**

- Previous balance was ₱32,200
- After paying ₱12,000 to TechParts Depot, balance should be: **₱20,200.00**

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

---

## Section 12 — Journal Entries

> **Business context:** Journal entries are the core accounting records. Most are created automatically when you record invoices and payments. This section lets you verify automatic entries and create a manual one for your rent expense.

---

### UAT-12.1 — Review All Automatic Journal Entries

**Scenario:** Confirm the system has been automatically recording accounting entries for every transaction you've entered so far.

**Steps:**

1. Click **Journal Entries** in the sidebar
2. Look at the list — count the entries that were automatically created

**Expected Result:**

- At minimum the following auto-entries exist, each with status **Posted**:
  - One entry for INV-001 (invoice created)
  - One entry for INV-002 (invoice created)
  - One entry for BILL-001 (bill created)
  - One entry for PAY-001a (partial payment received)
  - One entry for PAY-001b (remaining payment received)
  - One entry for re-recorded PAY-001b (after void)
  - One entry for PAY-003 (Starlight Media payment)
  - One entry for PAY-002 (payment made to TechParts)
- Each entry has a matching debit and credit total (they are balanced)

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

### UAT-12.2 — Record Monthly Rent as a Manual Journal Entry

**Scenario:** Your office rent of ₱25,000 was paid in cash this month. Record this expense manually.

**Steps:**

1. Click **+ New Journal Entry**
2. Fill in the header:

| Field       | Value                            |
| ----------- | -------------------------------- |
| Entry Date  | `April 20, 2026`                 |
| Description | `April 2026 — Office Rent (BGC)` |

3. Add two lines:

| Account             | Enter in Debit Column | Enter in Credit Column |
| ------------------- | --------------------- | ---------------------- |
| Rent Expense (5010) | `25,000`              | —                      |
| Cash on Hand (1000) | —                     | `25,000`               |

4. Click **Save as Draft**

**Expected Result:**

- Entry is saved with status **Draft**
- Total Debit and Total Credit both show **₱25,000.00**
- A success message appears

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

### UAT-12.3 — Post the Journal Entry

**Scenario:** Once you have reviewed the rent entry, post it to make it official.

**Steps:**

1. Open the draft rent journal entry
2. Click **Post**

**Expected Result:**

- Status changes from **Draft** → **Posted**
- The entry can no longer be edited (Edit button is gone or greyed out)

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

### UAT-12.4 — Attempt an Unbalanced Entry (Error Validation)

**Scenario:** Verify the system prevents you from saving a journal entry where debits and credits do not match — which would break your books.

**Steps:**

1. Click **+ New Journal Entry**
2. Add two lines:

| Account             | Debit    | Credit   |
| ------------------- | -------- | -------- |
| Rent Expense (5010) | `25,000` | —        |
| Cash on Hand (1000) | —        | `20,000` |

3. Try to save or post this entry

**Expected Result:**

- The system **does not save** the entry
- An error message appears such as: _"Journal entry must balance. Debits (₱25,000) do not equal Credits (₱20,000)."_

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

---

## Section 13 — General Ledger

> **Business context:** The ledger is the complete, detailed record of every transaction for each account. Think of it as the master log of all your money movements.

---

### UAT-13.1 — View the Accounts Receivable Ledger

**Scenario:** After all invoices and payments are recorded, Accounts Receivable should be fully cleared (zero balance).

**Steps:**

1. Click **Ledger** in the sidebar
2. Filter or select the **Accounts Receivable (1100)** account
3. Review the transaction history

**Expected Result:**

You should see entries in this order:

| Date   | Description      | Added (Debit) | Cleared (Credit) | Running Balance |
| ------ | ---------------- | ------------- | ---------------- | --------------- |
| Apr 5  | Invoice INV-001  | ₱14,700       | —                | ₱14,700         |
| Apr 8  | Invoice INV-002  | ₱17,500       | —                | ₱32,200         |
| Apr 12 | Payment PAY-001a | —             | ₱7,000           | ₱25,200         |
| Apr 14 | Payment PAY-001b | —             | ₱7,700           | ₱17,500         |
| Apr 16 | Payment PAY-003  | —             | ₱17,500          | **₱0.00**       |

- Final balance: **₱0.00** (all amounts collected)

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

### UAT-13.2 — View the BPI Business Account Ledger

**Scenario:** Confirm all cash movements through the bank account are correct.

**Steps:**

1. Filter the ledger for **BPI Business Account (1010)**

**Expected Result:**

| Date   | Description                      | Received (Debit) | Paid Out (Credit) | Running Balance |
| ------ | -------------------------------- | ---------------- | ----------------- | --------------- |
| Apr 12 | Payment from Mabuhay (PAY-001a)  | ₱7,000           | —                 | ₱7,000          |
| Apr 14 | Payment from Mabuhay (PAY-001b)  | ₱7,700           | —                 | ₱14,700         |
| Apr 16 | Payment from Starlight (PAY-003) | ₱17,500          | —                 | ₱32,200         |
| Apr 18 | Payment to TechParts (PAY-002)   | —                | ₱12,000           | **₱20,200**     |

- Final balance: **₱20,200.00**

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

### UAT-13.3 — View the Trial Balance

**Scenario:** The trial balance is a summary that confirms your books are balanced — total debits must equal total credits.

**Steps:**

1. Go to **Ledger** → **Trial Balance** (or **Reports** → **Trial Balance**)
2. Set the date range to April 1–30, 2026
3. Check the grand totals at the bottom

**Expected Result:**

- A table of all accounts with their debit and credit totals is shown
- The **Grand Total row** shows equal totals on both sides
- Example key accounts:

| Account              | Debit Total | Credit Total |
| -------------------- | ----------- | ------------ |
| BPI Business Account | ₱32,200     | ₱12,000      |
| Accounts Receivable  | ₱32,200     | ₱32,200      |
| IT Services Revenue  | —           | ₱28,000      |
| Rent Expense         | ₱25,000     | —            |

- **Grand Total: Debits = Credits** ✓ (books are balanced)

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

---

## Section 14 — Financial Reports

> **Business context:** These are the reports your accountant and management use to understand the financial health of your business.

---

### UAT-14.1 — Income Statement (Profit & Loss)

**Scenario:** Generate the income statement for April 2026 to see if the business made or lost money this month.

**Steps:**

1. Click **Reports** in the sidebar
2. Select **Income Statement** (or **Profit & Loss**)
3. Set the period to `April 1, 2026` → `April 30, 2026`
4. Click **Generate**

**Expected Result:**

| Section            | Item                  | Amount                 |
| ------------------ | --------------------- | ---------------------- |
| **Revenue**        | IT Services Revenue   | ₱28,000.00             |
| **Revenue**        | Product Sales Revenue | ₱4,200.00              |
| **Total Revenue**  |                       | **₱32,200.00**         |
| **Expenses**       | Rent Expense          | ₱25,000.00             |
| **Total Expenses** |                       | **₱25,000.00**         |
| **Net Income**     |                       | **₱7,200.00** (profit) |

> The business made a profit of ₱7,200 this month.

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

### UAT-14.2 — Balance Sheet

**Scenario:** Generate the balance sheet to see what the business owns (assets), owes (liabilities), and the owner's stake (equity).

**Steps:**

1. Go to **Reports** → **Balance Sheet**
2. Set the date to `April 30, 2026`
3. Click **Generate**

**Expected Result:**

| Section               | Account              | Amount           |
| --------------------- | -------------------- | ---------------- |
| **Assets**            | Cash on Hand         | ₱0.00            |
| **Assets**            | BPI Business Account | ₱20,200.00       |
| **Assets**            | Accounts Receivable  | ₱0.00            |
| **Assets**            | Inventory            | ₱9,600.00\*      |
| **Total Assets**      |                      | **≥ ₱29,800.00** |
| **Liabilities**       | Accounts Payable     | ₱0.00            |
| **Total Liabilities** |                      | **₱0.00**        |
| **Equity**            | Net Income (April)   | **₱7,200.00**    |
| **Total Equity**      |                      | **₱7,200.00**    |

- **Assets = Liabilities + Equity** ✓ _(the fundamental accounting equation is satisfied)_

> \*Inventory: ₱12,000 purchased minus ₱2,400 cost of items sold (2 × ₱800 + 4 × ₱200) = ₱9,600

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

### UAT-14.3 — Accounts Receivable Aging Report

**Scenario:** Check if any customers owe you money. After all payments have been received, this should show zero outstanding.

**Steps:**

1. Go to **Reports** → **AR Aging**
2. Set the date to `April 30, 2026`
3. Click **Generate**

**Expected Result:**

- INV-001 (Mabuhay): **Paid** — ₱0 outstanding
- INV-002 (Starlight): **Paid** — ₱0 outstanding
- **Total Outstanding: ₱0.00**
- No overdue items

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

### UAT-14.4 — Accounts Payable Aging Report

**Scenario:** Check if you owe any outstanding amounts to suppliers.

**Steps:**

1. Go to **Reports** → **AP Aging**
2. Set the date to `April 30, 2026`
3. Click **Generate**

**Expected Result:**

- BILL-001 (TechParts Depot): **Paid** — ₱0 outstanding
- **Total Outstanding: ₱0.00**
- No overdue items

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

### UAT-14.5 — Cash Flow Statement

**Scenario:** View the movement of actual cash in and out of the business during April 2026.

**Steps:**

1. Go to **Reports** → **Cash Flow**
2. Set the period to `April 1, 2026` → `April 30, 2026`
3. Click **Generate**

**Expected Result:**

| Activity          | Description                      | Amount      |
| ----------------- | -------------------------------- | ----------- |
| Cash In           | Payments received from customers | +₱32,200    |
| Cash Out          | Payment to TechParts Depot       | −₱12,000    |
| Cash Out          | Office rent paid in cash         | −₱25,000    |
| **Net Cash Flow** |                                  | **−₱4,800** |

> Cash in the bank increased by ₱20,200 (BPI), but cash on hand was reduced by ₱25,000 (rent paid in cash), giving a net change of −₱4,800.

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

### UAT-14.6 — Trial Balance Report

**Scenario:** Generate the formal trial balance report and confirm the books are balanced.

**Steps:**

1. Go to **Reports** → **Trial Balance**
2. Set the date range to `April 1–30, 2026`
3. Click **Generate**

**Expected Result:**

- All accounts with transactions are listed
- The final row shows: **Total Debits = Total Credits**
- No discrepancy message is shown

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

---

## Section 15 — Dashboard

> **Business context:** The dashboard gives you an at-a-glance view of the financial health of your business right now.

---

### UAT-15.1 — Review Dashboard KPIs

**Scenario:** After completing all transactions for April 2026, the dashboard should reflect accurate summary numbers.

**Steps:**

1. Click **Dashboard** in the sidebar
2. Review the summary cards at the top

**Expected Result:**

| Card                       | Expected Value               |
| -------------------------- | ---------------------------- |
| Total Revenue (this month) | **₱32,200.00**               |
| Outstanding Invoices       | **₱0.00** (all paid)         |
| Outstanding Bills          | **₱0.00** (BILL-001 paid)    |
| Cash / Bank Balance        | **₱20,200.00** (BPI account) |
| Pending Invoice Count      | **0**                        |
| Pending Bill Count         | **0**                        |

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

### UAT-15.2 — View Monthly Analytics Chart

**Scenario:** The analytics chart should show April's activity as the only active month this year.

**Steps:**

1. On the Dashboard, click the **Analytics** or **Monthly Trends** tab
2. Select year `2026`
3. Observe the April column

**Expected Result:**

- April shows revenue activity (≈ ₱32,200)
- April shows expense activity (≈ ₱25,000)
- All other months (Jan–Mar, May–Dec) show no activity (₱0)

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

---

## Section 16 — User Roles & Permissions

> **Business context:** Control what each team member can see and do in the system. For example, a billing staff member should be able to create invoices but not access financial reports.

---

### UAT-16.1 — View Built-In Roles

**Scenario:** Confirm the system comes with standard roles that cover common business needs.

**Steps:**

1. Go to **Settings** → **Roles** (or the Roles page in the sidebar)
2. Review the list of roles

**Expected Result:**

- At least these 5 default roles are shown:

| Role       | Description                             |
| ---------- | --------------------------------------- |
| Owner      | Full access to everything               |
| Admin      | Full access except billing/subscription |
| Accountant | Full access to accounting modules       |
| Staff      | Limited operational access              |
| Viewer     | Read-only access                        |

- These built-in roles cannot be deleted (no delete button visible for them)

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

### UAT-16.2 — Create a Custom Role

**Scenario:** Create a custom role for a billing assistant who should only be able to work with invoices, payments, and customers — but cannot access reports or journal entries.

**Steps:**

1. Click **+ New Role**
2. Fill in:

| Field       | Value                                            |
| ----------- | ------------------------------------------------ |
| Role Name   | `Billing Staff`                                  |
| Description | `Can create and view invoices and payments only` |

3. Assign these permissions:

| Module / Feature | Can View | Can Create | Can Edit | Can Delete |
| ---------------- | -------- | ---------- | -------- | ---------- |
| Invoices         | ✓        | ✓          | —        | —          |
| Payments         | ✓        | —          | —        | —          |
| Customers        | ✓        | —          | ✓        | —          |

4. Click **Save**

**Expected Result:**

- "Billing Staff" role appears in the roles list
- Permissions are saved as configured above

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

### UAT-16.3 — Verify a System Role Cannot Be Deleted

**Scenario:** Confirm the system prevents deletion of built-in roles to protect system integrity.

**Steps:**

1. From the roles list, attempt to delete the **Viewer** role (or any other built-in role)
2. Look for a delete option — it may not exist, or a warning may appear

**Expected Result:**

- Either: no delete button is shown for system roles
- Or: an error message appears: _"Cannot delete a system role"_
- The role remains in the list unchanged

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

---

## Section 17 — Team Management

> **Business context:** Invite other users (employees, accountants, or bookkeepers) to access the system with appropriate permissions.

---

### UAT-17.1 — Invite a Team Member

**Scenario:** Invite a billing assistant to join the system under the Staff role.

**Steps:**

1. Go to **Settings** → **Team**
2. Click **Invite Member**
3. Fill in:

| Field | Value               |
| ----- | ------------------- |
| Email | `rosa@techserve.ph` |
| Role  | `Staff`             |

4. Click **Send Invite**

**Expected Result:**

- A success message appears: "Invitation sent to rosa@techserve.ph"
- Rosa appears in the team list with status **Pending**

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

### UAT-17.2 — Verify Team Member List

**Scenario:** Confirm the current team is shown with the correct roles.

**Steps:**

1. From **Settings → Team**, review the member list

**Expected Result:**

| Name           | Email               | Role  | Status  |
| -------------- | ------------------- | ----- | ------- |
| Adrian Reyes   | adrian@techserve.ph | Owner | Active  |
| Rosa (pending) | rosa@techserve.ph   | Staff | Pending |

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

---

## Section 18 — Audit History

> **Business context:** Every action taken in the system is recorded with a timestamp and the name of the user who performed it. This creates an unalterable trail for compliance and accountability.

---

### UAT-18.1 — View the Full Activity Log

**Scenario:** Review the complete history of all actions performed during this test session.

**Steps:**

1. Click **Audit Logs** in the sidebar
2. Browse the log entries

**Expected Result:**

- A list of actions appears, each showing:
  - Date and time
  - User (Adrian Reyes)
  - What was done (Created, Updated, Posted, Paid, etc.)
  - Which record was affected (e.g., INV-001, BILL-001)
- Actions from this entire test session are visible

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

### UAT-18.2 — View the Full History of a Single Invoice

**Scenario:** Trace the complete lifecycle of INV-001 — from creation to payment — in the audit log.

**Steps:**

1. Go to **Audit Logs**
2. Filter by the record **INV-001** (look for a search or record filter)
3. Review the entries in order

**Expected Result:**

| Step | Action  | What Changed                              |
| ---- | ------- | ----------------------------------------- |
| 1    | Created | INV-001 created for ₱14,700               |
| 2    | Updated | Status changed to "Sent"                  |
| 3    | Updated | ₱7,000 payment applied → status "Partial" |
| 4    | Updated | ₱7,700 payment applied → status "Paid"    |

- All 4 entries appear in the correct order
- Each entry shows the date and "Adrian Reyes" as the user

| Result        | Remarks |
| ------------- | ------- |
| ☐ PASS ☐ FAIL |         |

---

---

## Final Verification Checklist

Before signing off, confirm the following key numbers by navigating to the relevant pages:

| #   | Verification                       | Expected Value                   | Confirmed |
| --- | ---------------------------------- | -------------------------------- | --------- |
| 1   | INV-001 status and balance         | Paid — ₱0.00 due                 | ☐         |
| 2   | INV-002 status and balance         | Paid — ₱0.00 due                 | ☐         |
| 3   | BILL-001 status and balance        | Paid — ₱0.00 due                 | ☐         |
| 4   | Laptop Stand quantity in Inventory | 68 pcs                           | ☐         |
| 5   | HDMI Cable quantity in Inventory   | 116 pcs                          | ☐         |
| 6   | BPI Business Account balance       | ₱20,200.00                       | ☐         |
| 7   | Accounts Receivable balance        | ₱0.00                            | ☐         |
| 8   | Accounts Payable balance           | ₱0.00                            | ☐         |
| 9   | Income Statement — Net Income      | ₱7,200.00 profit                 | ☐         |
| 10  | Trial Balance — Grand Total        | Debits = Credits                 | ☐         |
| 11  | AR Aging — Total Outstanding       | ₱0.00                            | ☐         |
| 12  | AP Aging — Total Outstanding       | ₱0.00                            | ☐         |
| 13  | Dashboard Revenue card             | ₱32,200.00                       | ☐         |
| 14  | Custom role "Billing Staff" exists | Created with correct permissions | ☐         |
| 15  | Audit log shows INV-001 full trail | 4 entries in order               | ☐         |

---

---

## UAT Sign-Off

### Summary of Results

| Metric                 | Count |
| ---------------------- | ----- |
| Total Scenarios Tested | 57    |
| Passed                 |       |
| Failed                 |       |
| Blocked / Not Tested   |       |

### Issues Found

If any scenarios **Failed**, list them here:

| Scenario ID | Description of Issue | Severity (High / Medium / Low) | Status |
| ----------- | -------------------- | ------------------------------ | ------ |
|             |                      |                                |        |
|             |                      |                                |        |
|             |                      |                                |        |

### Severity Guide

| Severity   | Meaning                                                                                                   |
| ---------- | --------------------------------------------------------------------------------------------------------- |
| **High**   | Core function is broken — cannot proceed without a fix (e.g., invoices cannot be saved, totals are wrong) |
| **Medium** | Feature works but has a noticeable problem (e.g., wrong label, wrong status shown)                        |
| **Low**    | Minor cosmetic issue that does not affect the function                                                    |

---

### Tester Sign-Off

> By signing below, I confirm that I have personally tested each scenario in this document and that the results recorded are accurate.

| Role                  | Full Name | Signature | Date |
| --------------------- | --------- | --------- | ---- |
| Client Representative |           |           |      |
| Client Representative |           |           |      |
| Project Manager       |           |           |      |
| Lead Developer        |           |           |      |

---

### Acceptance Decision

☐ **ACCEPTED** — All high-priority scenarios passed. The system is approved for go-live.

☐ **CONDITIONALLY ACCEPTED** — Minor issues found (Low/Medium severity). Accepted with the understanding that issues listed above will be resolved by: \***\*\_\_\_\_\*\***

☐ **NOT ACCEPTED** — High severity issues found. System requires fixes and re-testing before acceptance.

---

_This UAT was conducted against the Accounting Software — TechServe Solutions Inc. environment. Document version 1.0._
