# Complete Model Relationships & Architecture

This document provides a comprehensive explanation of all database models, their properties, relationships, and business logic flows in the accounting software system.

## Table of Contents

- [Core Entities](#core-entities)
- [Accounting Core](#accounting-core)
- [Sales & Receivables](#sales--receivables)
- [Purchase & Payables](#purchase--payables)
- [Inventory Management](#inventory-management)
- [Payments](#payments)
- [Configuration & Settings](#configuration--settings)
- [Subscription & Billing](#subscription--billing)
- [Reporting & Auditing](#reporting--auditing)
- [Key Business Logic Flows](#key-business-logic-flows)

---

## Core Entities

### Company (Central Entity)

**Location:** `apps/backend/src/api/v1/models/Company.ts`

**Purpose:** Represents a business entity using the accounting software. This is the central entity that owns all other business data.

**Properties:**

- `ownerId`: ObjectId → Reference to User who owns/created the company
- `name`: String → Company legal name (max 100 chars)
- `businessType`: String → Type of business (e.g., "Retail", "Service")
- `taxId`: String → Tax identification number (unique)
- `address[]`: Array of objects → Business addresses
  - `street`, `city`, `state`, `zipCode`, `country`
- `contact[]`: Array of objects → Contact information
  - `phone`: String → Phone number with validation
  - `email`: String → Email address with validation
  - `website`: String → Website URL with validation
- `fiscalYearStart`: Date → When fiscal year begins
- `currency`: String → Default currency (default: "PESO")
- `logo`: String → URL or path to company logo
- `headerText`: String → Header text for documents
- `isActive`: Boolean → Whether company is active (default: true)
- `createdAt`, `updatedAt`: Timestamps

**Virtual Properties:**

- `fullAddress`: String → Formatted first address

**Relationships:**

- **One-to-One:** CompanySettings, Subscription
- **One-to-Many:** Users (employees), Accounts, Customers, Suppliers, InventoryItems, Invoices, Bills, Payments, JournalEntries, Ledgers, Reports, AuditLogs, BackupRecords

**Indexes:**

- `ownerId`, `name`, `taxId`, `isActive`, `createdAt`

---

### User

**Location:** `apps/backend/src/api/v1/models/User.ts`

**Purpose:** Represents users who can access and operate within a company's accounting system.

**Properties:**

- `companyId`: ObjectId → Reference to Company this user belongs to
- `role`: String → User role (Owner, Admin, Accountant, User)
- `first_name`: String → First name (max 50 chars)
- `last_name`: String → Last name (max 50 chars)
- `middle_name`: String → Middle name (optional, max 50 chars)
- `email`: String → Email address (unique, validated)
- `password`: String → Hashed password (min 8 chars, not selected by default)
- `phone_number`: Number → Contact phone number
- `token`: String → Session/auth token (not selected by default)
- `token_expiry`: Date → When token expires
- `username`: String → Unique username (lowercase)
- `last_login_date`: Date → Last login timestamp
- `last_activity`: Date → Last activity timestamp
- `createdAt`, `updatedAt`: Timestamps

**Virtual Properties:**

- `fullName`: String → Combined first, middle, and last name

**Relationships:**

- **Belongs to:** Company
- **Can own:** Company (as ownerId)
- **Creates:** Invoices, Bills, Payments, JournalEntries, Reports, BackupRecords
- **Tracked in:** AuditLog for all actions

**Indexes:**

- `email`, `username`, `companyId`, `createdAt`

**Security:**

- Password and token fields excluded from JSON output
- Password field not selected in queries by default

---

## Accounting Core

### Account (Chart of Accounts)

**Location:** `apps/backend/src/api/v1/models/Account.ts`

**Purpose:** Represents accounts in the chart of accounts following double-entry bookkeeping principles.

**Properties:**

- `companyId`: ObjectId → Which company owns this account
- `accountCode`: String → Numeric code (e.g., "1000" for Cash)
- `accountName`: String → Human-readable name (max 100 chars)
- `accountType`: String → Enum: Asset, Liability, Equity, Revenue, Expense
- `subType`: String → More specific categorization (max 100 chars)
- `parentAccount`: ObjectId → Self-reference for hierarchical accounts (nullable)
- `balance`: Number → Current account balance (default: 0)
- `normalBalance`: String → Enum: Debit or Credit (accounting rule)
- `description`: String → Additional notes (max 500 chars)
- `createdAt`, `updatedAt`: Timestamps

**Relationships:**

- **Belongs to:** Company
- **Self-referential:** Can have parent Account (hierarchical structure)
- **Referenced by:** JournalEntry lines, InventoryItem (3 accounts), Invoice/Bill line items, Payment (bank account), Ledger entries

**Indexes:**

- Compound unique: `companyId + accountCode`
- Single: `companyId`, `accountType`, `parentAccount`, `createdAt`

**Business Rules:**

- Account code must be numeric
- Unique account code per company
- Normal balance determines debit/credit behavior

---

### JournalEntry (Double-Entry Bookkeeping)

**Location:** `apps/backend/src/api/v1/models/JournalEntry.ts`

**Purpose:** Records all financial transactions using double-entry bookkeeping. Every transaction must have balanced debits and credits.

**Properties:**

- `companyId`: ObjectId → Which company
- `entryNumber`: String → Unique identifier (auto-generated: "JE-2025-001")
- `entryDate`: Date → When transaction occurred
- `referenceNumber`: String → Optional external reference
- `description`: String → What this entry is for
- `entryType`: Number → Enum: Manual, Invoice, Bill, Payment, Adjustment, etc.
- `status`: String → Enum: Draft, Posted, Void (default: Draft)
- `lines[]`: Array → Debit/credit line items
  - `accountId`: ObjectId → Which account
  - `accountCode`: String → Account code
  - `accountName`: String → Account name
  - `debit`: Number → Debit amount (default: 0)
  - `credit`: Number → Credit amount (default: 0)
  - `description`: String → Line description
- `totalDebit`: Number → Sum of all debits
- `totalCredit`: Number → Sum of all credits
- `postedBy`: ObjectId → User who posted it (nullable)
- `createdBy`: ObjectId → User who created it
- `voidedAt`: Date → When it was voided (nullable)
- `voidedBy`: ObjectId → User who voided it (nullable)
- `createdAt`, `updatedAt`: Timestamps

**Relationships:**

- **Belongs to:** Company
- **References:** Multiple Accounts via lines
- **Referenced by:** Invoice, Bill, Payment (journalEntryId)
- **Creates:** Ledger entries when posted

**Indexes:**

- Compound unique: `companyId + entryNumber`
- Compound: `companyId + entryDate`, `companyId + status`, `companyId + entryType`

**Business Rules:**

- Total debits must equal total credits (balanced entry)
- Each line must have either debit OR credit, not both
- Each line must have non-zero debit or credit
- Only Draft entries can be posted
- Only Posted entries can be voided
- Entry number auto-generated with format: JE-{YEAR}-{SEQUENCE}

**Instance Methods:**

- `post(userId)`: Posts the journal entry
- `void(userId)`: Voids a posted entry

---

### Ledger (General Ledger)

**Location:** `apps/backend/src/api/v1/models/Ledger.ts`

**Purpose:** Stores individual transaction records for the general ledger. Provides complete transaction history for each account.

**Properties:**

- `companyId`: ObjectId → Which company
- `accountId`: ObjectId → Which account this affects
- `accountName`: String → Account name (denormalized)
- `journalEntryId`: ObjectId → Source journal entry
- `entryNumber`: String → Entry number (denormalized)
- `transactionDate`: Date → When it happened
- `description`: String → Transaction details
- `debit`: String → Debit amount (stored as string)
- `credit`: String → Credit amount (stored as string)
- `runningBalance`: Number → Account balance after this transaction
- `createdAt`: Timestamp (no updatedAt)

**Relationships:**

- **Belongs to:** Company
- **References:** Account, JournalEntry

**Indexes:**

- Compound: `companyId + accountId + transactionDate`, `companyId + journalEntryId`, `companyId + transactionDate`
- Single: `accountId + transactionDate` (for running balance calculation)

**Static Methods:**

- `findByAccountAndDateRange()`: Get ledger entries for an account
- `findByJournalEntry()`: Get all ledger entries for a journal entry
- `calculateRunningBalance()`: Calculate balance up to a date
- `getAccountBalance()`: Get current account balance

---

## Sales & Receivables

### Customer

**Location:** `apps/backend/src/api/v1/models/Customer.ts`

**Purpose:** Represents customers to whom the company sells products or services.

**Properties:**

- `companyId`: ObjectId → Which company
- `customerCode`: String → Unique customer identifier
- `customerName`: String → Legal/full customer name
- `displayName`: String → Display name for UI
- `email`: String → Email address (validated, lowercase)
- `phone`: String → Phone number
- `website`: String → Website URL (nullable)
- `billingAddress`: Object → Billing address
  - `street`, `city`, `state`, `zipCode`, `country`
- `shippingAddress`: Object → Shipping address (nullable)
  - Same structure as billingAddress
- `taxId`: String → Tax identification number
- `paymentTerms`: String → Payment terms (e.g., "Net 30")
- `creditLimit`: Number → Maximum credit allowed (default: 0)
- `openingBalance`: Number → Starting balance (default: 0)
- `currentBalance`: Number → Current amount owed (default: 0)
- `isActive`: Boolean → Active status (default: true)
- `notes`: String → Additional notes
- `createdAt`, `updatedAt`: Timestamps

**Virtual Properties:**

- `fullBillingAddress`: String → Formatted billing address
- `fullShippingAddress`: String → Formatted shipping address
- `availableCredit`: Number → creditLimit - currentBalance

**Relationships:**

- **Belongs to:** Company
- **Has many:** Invoices, Payments (received)

**Indexes:**

- Compound unique: `companyId + customerCode`
- Compound: `companyId + email`, `companyId + isActive`, `companyId + customerName`

**Instance Methods:**

- `updateBalance(amount)`: Updates current balance
- `hasCreditAvailable(amount)`: Checks if credit limit allows amount

**Static Methods:**

- `findActive()`: Find active customers
- `findByCustomerCode()`: Find by customer code
- `searchCustomers()`: Search by name, email, or code

---

### Invoice

**Location:** `apps/backend/src/api/v1/models/Invoice.ts`

**Purpose:** Represents sales invoices sent to customers for goods or services.

**Properties:**

- `companyId`: ObjectId → Which company
- `customerId`: ObjectId → Who to bill
- `invoiceNumber`: String → Unique invoice number (unique globally)
- `invoiceDate`: Date → Invoice issue date
- `dueDate`: Number → Payment due date
- `status`: String → Enum: Draft, Sent, Partial, Paid, Overdue, Void (default: Draft)
- `lineItems[]`: Array → Invoice line items
  - `description`: String → Item description
  - `quantity`: Number → Quantity sold
  - `unitPrice`: Number → Price per unit
  - `accountId`: ObjectId → Revenue account
  - `inventoryItemId`: ObjectId → Inventory item (nullable)
  - `amount`: Number → Line total (auto-calculated)
- `subtotal`: Number → Sum of line items (auto-calculated)
- `taxRate`: Number → Tax percentage (default: 0)
- `taxAmount`: Number → Tax amount (auto-calculated)
- `discount`: Number → Discount amount (default: 0)
- `totalAmount`: Number → Final total (auto-calculated)
- `amountPaid`: Number → Amount received (default: 0)
- `balanceDue`: Date → Remaining balance (auto-calculated)
- `notes`: String → Additional notes
- `terms`: String → Payment terms
- `journalEntryId`: ObjectId → Associated journal entry
- `createdBy`: ObjectId → User who created it
- `createdAt`, `updatedAt`: Timestamps

**Relationships:**

- **Belongs to:** Company
- **References:** Customer, Accounts (via line items), InventoryItems (optional), JournalEntry, User (createdBy)
- **Referenced by:** Payments (can have multiple)
- **Triggers:** InventoryTransaction when inventory items sold

**Indexes:**

- Compound: `companyId + customerId`, `companyId + status`, `companyId + invoiceDate`, `companyId + dueDate`

**Business Rules:**

- Amounts auto-calculated from line items
- Status auto-updated based on payments
- Cannot void paid invoices or invoices with payments
- Line item amount = quantity × unitPrice

**Pre-save Hooks:**

- Calculate subtotal, tax, total, balance from line items
- Auto-update status based on payment (Paid, Partial, Overdue)

**Instance Methods:**

- `recordPayment(amount)`: Record a payment against invoice
- `void()`: Void the invoice

**Static Methods:**

- `findByCustomer()`: Find invoices for a customer
- `findByStatus()`: Find invoices by status
- `findOverdue()`: Find overdue invoices

---

## Purchase & Payables

### Supplier

**Location:** `apps/backend/src/api/v1/models/Supplier.ts`

**Purpose:** Represents vendors from whom the company purchases goods or services.

**Properties:**

- `companyId`: ObjectId → Which company
- `supplierCode`: String → Unique supplier identifier
- `supplierName`: String → Legal/full supplier name
- `displayName`: String → Display name (auto-populated from supplierName)
- `email`: String → Email address (validated, lowercase)
- `phone`: String → Phone number
- `website`: Date → Website URL (nullable) _Note: Type should be String_
- `address`: Object → Supplier address
  - `street`, `city`, `state`, `zipCode`, `country`
- `taxId`: String → Tax identification number
- `paymentTerms`: String → Payment terms
- `openingBalance`: Number → Starting balance (default: 0)
- `currentBalance`: Number → Current amount owed (default: 0)
- `isActive`: Boolean → Active status (default: true)
- `notes`: String → Additional notes
- `createdAt`, `updatedAt`: Timestamps

**Virtual Properties:**

- `fullAddress`: String → Formatted address

**Relationships:**

- **Belongs to:** Company
- **Has many:** Bills, Payments (made)

**Indexes:**

- Compound unique: `companyId + supplierCode`
- Compound: `companyId + email`, `companyId + isActive`, `companyId + supplierName`

**Instance Methods:**

- `updateBalance(amount)`: Updates current balance

**Static Methods:**

- `findActive()`: Find active suppliers
- `findBySupplierCode()`: Find by supplier code
- `searchSuppliers()`: Search by name, email, or code

---

### Bill

**Location:** `apps/backend/src/api/v1/models/Bill.ts`

**Purpose:** Represents purchase bills from suppliers for goods or services received.

**Properties:**

- `companyId`: ObjectId → Which company
- `supplierId`: ObjectId → Supplier who sent the bill
- `billNumber`: Number → Bill number (unique per company)
- `dueDate`: Date → Payment due date
- `status`: String → Enum: Draft, Open, Partial, Paid, Overdue, Void (default: Draft)
- `lineItems[]`: Array → Bill line items
  - `description`: String → Item description
  - `quantity`: Number → Quantity purchased
  - `unitPrice`: Number → Price per unit
  - `accountId`: ObjectId → Expense/asset account
  - `inventoryItemId`: ObjectId → Inventory item (nullable)
  - `amount`: Number → Line total (auto-calculated)
- `subtotal`: Number → Sum of line items (auto-calculated)
- `taxRate`: Number → Tax percentage (default: 0)
- `taxAmount`: Number → Tax amount (auto-calculated)
- `totalAmount`: Number → Final total (auto-calculated)
- `amountPaid`: Number → Amount paid (default: 0)
- `balanceDue`: Date → Remaining balance (auto-calculated)
- `notes`: String → Additional notes
- `journalEntryId`: ObjectId → Associated journal entry
- `createdBy`: ObjectId → User who created it
- `createdAt`, `updatedAt`: Timestamps

**Relationships:**

- **Belongs to:** Company
- **References:** Supplier, Accounts (via line items), InventoryItems (optional), JournalEntry, User (createdBy)
- **Referenced by:** Payments (can have multiple)
- **Triggers:** InventoryTransaction when inventory purchased

**Indexes:**

- Compound unique: `companyId + billNumber`
- Compound: `companyId + supplierId`, `companyId + status`, `companyId + dueDate`

**Business Rules:**

- Similar to Invoice but for purchases
- Amounts auto-calculated from line items
- Status auto-updated based on payments

**Pre-save Hooks:**

- Calculate subtotal, tax, total, balance from line items
- Auto-update status based on payment

**Instance Methods:**

- `recordPayment(amount)`: Record a payment against bill
- `void()`: Void the bill

**Static Methods:**

- `findBySupplier()`: Find bills for a supplier
- `findByStatus()`: Find bills by status
- `findOverdue()`: Find overdue bills

---

## Inventory Management

### InventoryItem

**Location:** `apps/backend/src/api/v1/models/InventoryItem.ts`

**Purpose:** Represents products or materials tracked in inventory.

**Properties:**

- `companyId`: ObjectId → Which company
- `itemCode`: String → Unique item code (uppercase)
- `itemName`: String → Product name
- `description`: String → Product description
- `category`: String → Product category
- `unit`: String → Unit of measure (lowercase, e.g., "pcs", "kg")
- `quantityOnHand`: Number → Current stock quantity (default: 0)
- `reorderLevel`: Number → Minimum quantity before reorder alert (default: 0)
- `unitCost`: Number → Purchase cost per unit
- `sellingPrice`: Number → Sales price per unit
- `inventoryAccountId`: ObjectId → Asset account (Inventory)
- `cogsAccountId`: ObjectId → Cost of Goods Sold account
- `incomeAccountId`: ObjectId → Revenue/Sales account
- `isActive`: Boolean → Active status (default: true)
- `createdAt`, `updatedAt`: Timestamps

**Virtual Properties:**

- `inventoryValue`: Number → quantityOnHand × unitCost
- `profitMargin`: Number → Percentage profit margin
- `needsReorder`: Boolean → True if quantity ≤ reorderLevel

**Relationships:**

- **Belongs to:** Company
- **References:** 3 Accounts (inventory asset, COGS expense, income/revenue)
- **Referenced by:** Invoice/Bill line items (optional)
- **Has many:** InventoryTransactions

**Indexes:**

- Compound unique: `companyId + itemCode`
- Compound: `companyId + category`, `companyId + isActive`, `companyId + itemName`

**Instance Methods:**

- `adjustQuantity(adjustment, reason)`: Adjust stock quantity
- `updateCost(newCost)`: Update unit cost
- `updateSellingPrice(newPrice)`: Update selling price

**Static Methods:**

- `findActive()`: Find active items
- `findByItemCode()`: Find by item code
- `findByCategory()`: Find items by category
- `findNeedingReorder()`: Find items below reorder level
- `searchItems()`: Search by name, code, or description
- `getTotalInventoryValue()`: Calculate total inventory value

---

### InventoryTransaction

**Location:** `apps/backend/src/api/v1/models/InventoryTransaction.ts`

**Purpose:** Records all inventory movements (purchases, sales, adjustments) for tracking and COGS calculation.

**Properties:**

- `companyId`: ObjectId → Which company
- `inventoryItemId`: ObjectId → Which inventory item
- `transactionType`: String → Enum: Purchase, Sale, Adjustment, Return
- `transactionDate`: Date → When transaction occurred
- `referenceType`: String → Enum: Invoice, Bill, JournalEntry (polymorphic reference)
- `referenceId`: ObjectId → ID of source document
- `quantityIn`: Number → Quantity added to inventory (default: 0)
- `quantityOut`: Number → Quantity removed from inventory (default: 0)
- `unitCost`: Number → Cost per unit at transaction time
- `totalValue`: Number → Total transaction value (auto-calculated)
- `balanceAfter`: Number → Quantity remaining after transaction
- `notes`: String → Additional notes
- `createdBy`: ObjectId → User who created transaction
- `createdAt`: Timestamp (no updatedAt)

**Relationships:**

- **Belongs to:** Company
- **References:** InventoryItem, User (createdBy)
- **References (polymorphic):** Invoice, Bill, or JournalEntry (via referenceType + referenceId)

**Indexes:**

- Compound: `companyId + inventoryItemId`, `companyId + transactionType`, `companyId + transactionDate`
- Compound: `inventoryItemId + transactionDate`, `referenceType + referenceId`

**Business Rules:**

- Only one of quantityIn OR quantityOut can be non-zero
- Transaction type must match quantity direction (Purchase = quantityIn, Sale = quantityOut)
- Total value auto-calculated based on quantity and unit cost

**Pre-save Hooks:**

- Calculate total value
- Validate quantity direction matches transaction type
- Ensure only quantityIn OR quantityOut is set

**Static Methods:**

- `findByInventoryItem()`: Get transactions for an item
- `findByType()`: Get transactions by type
- `findByDateRange()`: Get transactions in date range
- `findByReference()`: Get transactions for a source document
- `getMovementSummary()`: Summary of movements for an item
- `calculateCOGS()`: Calculate Cost of Goods Sold

---

## Payments

### Payment

**Location:** `apps/backend/src/api/v1/models/Payment.ts`

**Purpose:** Records payments received from customers or made to suppliers.

**Properties:**

- `companyId`: ObjectId → Which company
- `paymentNumber`: String → Auto-generated unique number
  - Format: "PMT-RCV-2025-0001" (received) or "PMT-MADE-2025-0001" (made)
- `paymentDate`: Date → When payment occurred
- `paymentType`: String → Enum: Received (from customer), Made (to supplier)
- `paymentMethod`: String → Enum: Cash, Check, BankTransfer, CreditCard, DebitCard, OnlinePayment, Other
- `referenceNumber`: String → Check number or transaction reference
- `amount`: Number → Payment amount
- **For Payment Received:**
  - `customerId`: ObjectId → Customer who paid
  - `invoiceIds[]`: Array of ObjectIds → Invoices to apply payment to
- **For Payment Made:**
  - `supplierId`: ObjectId → Supplier paid
  - `billIds[]`: Array of ObjectIds → Bills to apply payment to
- `bankAccountId`: ObjectId → Bank/cash account used
- `notes`: String → Additional notes
- `journalEntryId`: ObjectId → Associated journal entry
- `createdBy`: ObjectId → User who recorded payment
- `createdAt`, `updatedAt`: Timestamps

**Relationships:**

- **Belongs to:** Company
- **References:** Customer OR Supplier (based on type), Account (bank), JournalEntry, User (createdBy)
- **References:** Multiple Invoices OR Bills (based on type)

**Indexes:**

- Compound unique: `companyId + paymentNumber`
- Compound: `companyId + paymentType`, `companyId + customerId`, `companyId + supplierId`, `companyId + paymentDate`

**Business Rules:**

- Payment Received must have customerId and invoiceIds
- Payment Made must have supplierId and billIds
- Payment number auto-generated based on type and year

**Pre-save Validation:**

- Ensures correct fields are populated based on payment type
- Auto-generates payment number if not provided

**Static Methods:**

- `findByCustomer()`: Get payments from a customer
- `findBySupplier()`: Get payments to a supplier
- `findByType()`: Get payments by type
- `findByDateRange()`: Get payments in date range
- `getTotalReceived()`: Total received in period
- `getTotalMade()`: Total paid out in period

---

## Configuration & Settings

### CompanySettings

**Location:** `apps/backend/src/api/v1/models/CompanySettings.ts`

**Purpose:** Stores all configuration and preferences for a company's accounting system.

**Properties:**

- `companyId`: ObjectId → One-to-one with Company (unique)

**Nested Objects:**

#### General Settings

- `dateFormat`: String → Date display format (default: "MM/DD/YYYY")
- `timeZone`: String → Time zone (default: "Asia/Manila")
- `language`: String → UI language (default: "en")

#### Accounting Settings

- `accountingMethod`: String → Enum: Accrual, Cash (default: Accrual)
- `fiscalYearEnd`: String → MM-DD format (default: "12-31")
- `baseCurrency`: String → Base currency code (default: "PHP")
- `decimalPlaces`: Number → Decimal precision (default: 2, range: 0-4)

#### Invoicing Settings

- `invoicePrefix`: String → Invoice number prefix (default: "INV")
- `invoiceStartNumber`: Number → Starting invoice number (default: 1)
- `defaultPaymentTerms`: String → Default payment terms (default: "Net 30")
- `defaultTaxRate`: Number → Default tax percentage (default: 0)
- `showCompanyLogo`: Boolean → Show logo on invoices (default: true)

#### Billing Settings

- `billPrefix`: String → Bill number prefix (default: "BILL")
- `billStartNumber`: Number → Starting bill number (default: 1)

#### Reporting Settings

- `reportHeaderText`: String → Header text for reports
- `showLogo`: Boolean → Show logo on reports (default: true)
- `includeFooter`: Boolean → Include footer on reports (default: true)
- `footerText`: String → Footer text for reports

#### Notifications Settings

- `emailNotifications`: Boolean → Enable email notifications (default: true)
- `reminderDays[]`: Array of Numbers → Days before due date for reminders (default: [7, 3, 1])
- `overdueNotifications`: Boolean → Enable overdue notifications (default: true)

- `updatedAt`: Timestamp (no createdAt)

**Relationships:**

- **One-to-one with:** Company

**Indexes:**

- `companyId` (unique)

**Instance Methods:**

- `updateGeneralSettings()`: Update general settings
- `updateAccountingSettings()`: Update accounting settings
- `updateInvoicingSettings()`: Update invoicing settings
- `updateBillingSettings()`: Update billing settings
- `updateReportingSettings()`: Update reporting settings
- `updateNotificationsSettings()`: Update notifications settings
- `resetToDefaults()`: Reset all settings to default values

**Static Methods:**

- `findByCompany()`: Find settings for a company
- `getOrCreate()`: Get existing or create new settings
- `initializeForCompany()`: Create default settings for new company

---

## Subscription & Billing

### SubscriptionPlan (Template)

**Location:** `apps/backend/src/api/v1/models/SubscriptionPlan.ts`

**Purpose:** Defines available subscription tiers and their features. Acts as template for active subscriptions.

**Properties:**

- `planType`: String → Enum: Free, Pro, Premium (unique)
- `planName`: String → Display name
- `description`: String → Plan description
- `monthlyPrice`: Number → Monthly subscription price
- `yearlyPrice`: Number → Yearly subscription price (typically discounted)
- `currency`: String → Currency code (default: "PHP")
- `features`: Object → Feature limits and flags
  - **Limits:**
    - `maxUsers`: Number | "unlimited"
    - `maxCompanies`: Number
    - `maxInvoicesPerMonth`: Number | "unlimited"
    - `maxCustomers`: Number
    - `maxSuppliers`: Number
    - `maxInventoryItems`: Number
    - `storageGB`: Number
    - `dataRetentionMonths`: Number | "unlimited"
  - **Feature Flags (Boolean):**
    - `inventoryManagement`: Enable inventory features
    - `multiCompany`: Multiple companies per account
    - `advancedReports`: Advanced reporting
    - `financialStatements`: Financial statements
    - `exportReports`: Export report data
    - `customization`: UI/report customization
    - `auditLog`: Audit trail
    - `autoBackup`: Automatic backups
    - `apiAccess`: API access
    - `prioritySupport`: Priority support
    - `removeBranding`: Remove branding
    - `customLogo`: Custom logo
  - `backupFrequency`: String → "daily", "weekly", null
- `isActive`: Boolean → Plan available for purchase (default: true)
- `displayOrder`: Number → Sort order in UI (default: 0)
- `isPopular`: Boolean → Mark as popular/featured (default: false)
- `trialDays`: Number → Free trial days (default: 14)
- `createdAt`, `updatedAt`: Timestamps

**Virtual Properties:**

- `yearlySavingsPercent`: Number → Percentage saved with yearly plan

**Relationships:**

- Template for **Subscription** (no direct FK)

**Indexes:**

- `planType` (unique)
- Compound: `isActive + displayOrder`

**Instance Methods:**

- `getPriceForCycle(cycle)`: Get price for billing cycle
- `hasFeature(featureName)`: Check if feature enabled
- `getFeatureLimit(featureName)`: Get feature limit value

**Static Methods:**

- `findActivePlans()`: Get all active plans
- `findByPlanType()`: Find specific plan
- `getPopularPlan()`: Get featured plan
- `comparePlans()`: Compare two plans
- `initializeDefaultPlans()`: Create default plans (Free, Pro, Premium)

---

### Subscription (Active Subscription)

**Location:** `apps/backend/src/api/v1/models/Subscription.ts`

**Purpose:** Represents an active subscription for a company, tracking usage and billing.

**Properties:**

- `companyId`: ObjectId → Company subscribed (unique)
- `ownerId`: ObjectId → User who owns subscription
- `planType`: String → Enum: Free, Pro, Premium
- `planName`: String → Plan display name
- `status`: String → Enum: Trial, Active, Suspended, Cancelled, Expired (default: Trial)
- `price`: Number → Subscription price
- `currency`: String → Currency code (default: "PHP")
- `billingCycle`: String → Enum: Monthly, Yearly
- `startDate`: Date → When subscription started
- `endDate`: Date → When subscription ends
- `trialEndDate`: Date → When trial period ends
- `nextBillingDate`: Date → Next billing date
- `cancelledAt`: Date → When cancelled (nullable)
- `currentUsage`: Object → Actual usage tracking
  - `users`: Number → Current user count
  - `companies`: Number → Current company count
  - `invoicesThisMonth`: Number → Invoices created this month
  - `customers`: Number → Total customers
  - `suppliers`: Number → Total suppliers
  - `inventoryItems`: Number → Total inventory items
  - `storageUsedGB`: Number → Storage used in GB
  - `transactionsThisMonth`: Number → Transactions this month
  - `reportsThisMonth`: Number → Reports generated this month
- `features`: Object → Feature limits (copy from plan, frozen at subscription time)
  - Same structure as SubscriptionPlan.features
- `autoRenew`: Boolean → Auto-renewal flag (default: true)
- `paymentMethod`: Object → Payment method details
  - `type`: String → Payment method type
  - `last4`: String → Last 4 digits
  - `expiryDate`: String → Expiry date
- `billingHistory[]`: Array → Past billing records
  - `date`: Date → Billing date
  - `amount`: Number → Amount charged
  - `status`: String → Payment status
  - `invoiceUrl`: String → Invoice URL
- `createdAt`, `updatedAt`: Timestamps

**Virtual Properties:**

- `isActive`: Boolean → Status === Active
- `isTrial`: Boolean → Status === Trial
- `daysUntilExpiry`: Number → Days until subscription ends

**Relationships:**

- **One-to-one with:** Company
- **References:** User (ownerId)
- **Based on:** SubscriptionPlan template

**Indexes:**

- `companyId` (unique)
- Single: `ownerId`
- Compound: `status + endDate`, `status + nextBillingDate`

**Pre-save Hooks:**

- Auto-update status based on dates (Trial, Active, Expired)

**Instance Methods:**

- `cancel()`: Cancel subscription
- `suspend()`: Suspend subscription
- `reactivate()`: Reactivate suspended subscription
- `upgradePlan()`: Upgrade to different plan
- `checkUsageLimit(resource)`: Check if usage within limits
- `updateUsage(resource, value)`: Update usage counter
- `addBillingHistory()`: Add billing record

**Static Methods:**

- `findActive()`: Find active subscriptions
- `findExpiringSoon()`: Find subscriptions expiring soon
- `findByOwner()`: Find subscriptions by owner
- `findByPlanType()`: Find subscriptions by plan
- `getRevenueSummary()`: Revenue summary by plan type

---

## Reporting & Auditing

### Report

**Location:** `apps/backend/src/api/v1/models/Report.ts`

**Purpose:** Stores generated financial reports and their metadata.

**Properties:**

- `companyId`: ObjectId → Which company
- `reportName`: String → Report name
- `reportType`: String → Enum: BalanceSheet, IncomeStatement, CashFlow, TrialBalance, GeneralLedger, AgingReport, InventoryValuation, etc.
- `parameters`: Object → Report generation parameters
  - `startDate`: Date → Report start date
  - `endDate`: Date → Report end date
  - `accountIds[]`: Array of ObjectIds → Specific accounts (optional)
  - Additional custom parameters (flexible schema)
- `generatedData`: Mixed → Actual report data (JSON)
- `generatedBy`: ObjectId → User who generated report
- `generatedAt`: Date → When generated (default: now)
- `format`: String → Enum: PDF, Excel, CSV, JSON
- `filePath`: String → Where file is stored
- `createdAt`, `updatedAt`: Timestamps

**Virtual Properties:**

- `dateRange`: String → Formatted date range
- `fileName`: String → File name from path

**Relationships:**

- **Belongs to:** Company
- **References:** User (generatedBy), Accounts (optional in parameters)

**Indexes:**

- Compound: `companyId + reportType`, `companyId + generatedAt`
- Single: `generatedBy + generatedAt`
- Nested: `parameters.startDate`, `parameters.endDate`

**Pre-save Validation:**

- End date must be after start date

**Instance Methods:**

- `isExpired(days)`: Check if report is older than X days
- `isRecent(days)`: Check if report is within last X days

**Static Methods:**

- `findByCompany()`: Find reports for company
- `findByType()`: Find reports by type
- `findByUser()`: Find reports by user
- `findByDateRange()`: Find reports by date range
- `cleanupExpiredReports()`: Delete old reports
- `getReportStatistics()`: Statistics by report type
- `getMostGeneratedReports()`: Most frequently generated reports

---

### AuditLog

**Location:** `apps/backend/src/api/v1/models/AuditLog.ts`

**Purpose:** Comprehensive audit trail of all user actions and system events for security and compliance.

**Properties:**

- `companyId`: ObjectId → Which company
- `userId`: ObjectId → Who performed action
- `userName`: String → User's name (denormalized)
- `action`: String → Enum: Create, Update, Delete, Login, Logout, View, Export, Approve, Reject, Post, Void, etc.
- `module`: String → Which module/feature (e.g., "Invoice", "Payment", "User")
- `recordId`: ObjectId → ID of affected record
- `recordType`: String → Type of record (e.g., "Invoice", "Customer")
- `changes`: Mixed → Before/after data (JSON)
- `ipAddress`: String → User's IP address
- `userAgent`: String → Browser/client information
- `timestamp`: Date → When action occurred (default: now)

**Relationships:**

- **Belongs to:** Company
- **References:** User
- **References (polymorphic):** Any record via recordId + recordType

**Indexes:**

- Compound: `companyId + timestamp`, `companyId + userId + timestamp`, `companyId + module + timestamp`, `companyId + action + timestamp`
- Compound: `recordId + recordType`
- Single: `timestamp` (for cleanup)

**Static Methods:**

- `createLog()`: Create new audit log entry
- `findByUser()`: Find logs by user
- `findByModule()`: Find logs by module
- `findByAction()`: Find logs by action
- `findByRecord()`: Find logs for specific record
- `findByDateRange()`: Find logs in date range
- `getUserActivitySummary()`: User activity summary
- `getModuleActivitySummary()`: Module activity summary
- `findAuthActivities()`: Find login/logout activities
- `cleanupOldLogs()`: Delete old logs (default: 90 days)

---

### BackupRecord

**Location:** `apps/backend/src/api/v1/models/BackupRecord.ts`

**Purpose:** Tracks database backups for disaster recovery and compliance.

**Properties:**

- `companyId`: ObjectId → Which company
- `backupType`: String → Enum: Full, Incremental, Differential
- `backupDate`: Date → When backup was created (default: now)
- `status`: String → Enum: InProgress, Completed, Failed (default: InProgress)
- `storageLocation`: String → Enum: Local, Cloud, S3, Azure, GoogleCloud
- `fileSize`: Number → Backup file size in bytes
- `filePath`: String → Path to backup file
- `restorable`: Boolean → Whether backup can be restored (default: true)
- `createdBy`: ObjectId → User who initiated backup
- `createdAt`: Timestamp (no updatedAt)

**Virtual Properties:**

- `fileSizeMB`: String → File size in MB
- `fileSizeGB`: String → File size in GB
- `fileSizeFormatted`: String → Human-readable file size
- `fileName`: String → File name from path
- `ageInDays`: Number → Days since backup

**Relationships:**

- **Belongs to:** Company
- **Created by:** User

**Indexes:**

- Compound: `companyId + backupDate`, `companyId + status`
- Compound: `backupType + status`, `status + backupDate`

**Instance Methods:**

- `markAsCompleted()`: Mark backup as completed
- `markAsFailed()`: Mark backup as failed
- `isOld(days)`: Check if older than X days
- `isRecent(days)`: Check if within last X days

**Static Methods:**

- `findByCompany()`: Find backups for company
- `findCompleted()`: Find completed backups
- `findRestorable()`: Find restorable backups
- `findFailed()`: Find failed backups
- `getLatestBackup()`: Get most recent backup
- `getBackupStatistics()`: Backup statistics by status
- `getTotalStorageUsed()`: Total storage by location
- `cleanupOldBackups()`: Delete old backups
- `getBackupHistory()`: Backup history summary

---

## Key Business Logic Flows

### 1. Double-Entry Accounting Flow

**Creating a Transaction (Invoice/Bill/Payment):**

1. User creates Invoice/Bill/Payment
2. System creates JournalEntry with balanced debit/credit lines
3. JournalEntry status = Draft initially
4. User reviews and posts JournalEntry
5. When posted:
   - Creates Ledger entries for each line
   - Updates Account balances
   - JournalEntry status = Posted
6. AuditLog records all actions

**Example - Sales Invoice:**

```
Debit: Accounts Receivable (Asset) - $1,000
Credit: Sales Revenue (Revenue) - $1,000
```

**Example - Purchase Bill:**

```
Debit: Inventory (Asset) or Expense - $500
Credit: Accounts Payable (Liability) - $500
```

---

### 2. Inventory Flow

**Purchase Flow (Bill with Inventory):**

1. User creates Bill with inventory line items
2. System creates:
   - InventoryTransaction (type: Purchase, quantityIn)
   - Updates InventoryItem.quantityOnHand
   - JournalEntry (Debit: Inventory, Credit: A/P)
3. When posted, creates Ledger entries

**Sales Flow (Invoice with Inventory):**

1. User creates Invoice with inventory line items
2. System creates:
   - InventoryTransaction (type: Sale, quantityOut)
   - Updates InventoryItem.quantityOnHand
   - JournalEntry (Debit: A/R, Credit: Revenue)
   - JournalEntry (Debit: COGS, Credit: Inventory)
3. When posted, creates Ledger entries

**COGS Calculation:**

- InventoryTransaction tracks unit cost at time of sale
- COGS = quantity sold × unit cost (from transaction)
- System can calculate COGS for any period

---

### 3. Payment Application Flow

**Payment Received (from Customer):**

1. User creates Payment (type: Received)
2. Links to Customer and Invoice(s)
3. System creates JournalEntry:
   ```
   Debit: Bank/Cash Account - $1,000
   Credit: Accounts Receivable - $1,000
   ```
4. Updates Invoice.amountPaid and balanceDue
5. Auto-updates Invoice status (Partial/Paid)
6. Updates Customer.currentBalance

**Payment Made (to Supplier):**

1. User creates Payment (type: Made)
2. Links to Supplier and Bill(s)
3. System creates JournalEntry:
   ```
   Debit: Accounts Payable - $500
   Credit: Bank/Cash Account - $500
   ```
4. Updates Bill.amountPaid and balanceDue
5. Auto-updates Bill status (Partial/Paid)
6. Updates Supplier.currentBalance

---

### 4. Status Auto-Update Logic

**Invoice/Bill Status:**

- **Draft**: Newly created, not sent
- **Sent/Open**: Issued to customer/supplier
- **Partial**: Some payment received (0 < amountPaid < totalAmount)
- **Paid**: Fully paid (balanceDue ≈ 0)
- **Overdue**: Past due date and unpaid
- **Void**: Cancelled (cannot be paid or modified)

Status updates automatically on save based on:

- Payment amount
- Due date vs current date
- Balance due

---

### 5. Subscription Usage Tracking

**Usage Enforcement:**

1. User attempts action (e.g., create invoice)
2. System checks:
   ```
   subscription.checkUsageLimit('invoicesThisMonth')
   ```
3. If limit reached, action denied
4. If allowed, action proceeds and usage updated:
   ```
   subscription.updateUsage('invoicesThisMonth', currentCount + 1)
   ```

**Plan Upgrades:**

1. User selects new plan
2. System calls `subscription.upgradePlan()`
3. Updates planType, features, and price
4. Recalculates billing
5. Usage limits immediately reflect new plan

**Feature Flags:**

- Premium features checked before allowing access
- Example: `subscription.features.inventoryManagement`
- If false, inventory features disabled in UI

---

### 6. Audit Trail

**Every Action Logged:**

1. User performs action (Create/Update/Delete)
2. Before save: capture current state
3. After save: capture new state
4. Create AuditLog entry:
   - action, module, recordId, recordType
   - changes (before/after)
   - ipAddress, userAgent
   - userId, userName, timestamp
5. AuditLog provides complete history:
   - Who did what
   - When it happened
   - What changed
   - Where (IP address)

---

### 7. Multi-Tenancy

**Data Isolation:**

- Every model has `companyId`
- All queries filter by `companyId`
- User belongs to Company via `companyId`
- User can only access data for their Company
- Owner can have multiple Companies (if plan allows)

**Subscription Limits:**

- `subscription.features.maxCompanies` controls how many
- `subscription.features.multiCompany` enables feature
- Usage tracked in `subscription.currentUsage.companies`

---

### 8. Backup & Recovery

**Automatic Backups:**

1. Scheduled job runs based on `subscription.features.backupFrequency`
2. Creates BackupRecord (status: InProgress)
3. Generates backup file
4. Stores in configured `storageLocation`
5. Records `fileSize` and `filePath`
6. Marks as Completed or Failed
7. Old backups cleaned up based on retention policy

**Restore Process:**

1. Find BackupRecord (must be `restorable: true`)
2. Verify backup integrity
3. Restore data from `filePath`
4. Create AuditLog entry for restore action

---

## Data Relationships Summary

```
Company (1) ←──→ (1) CompanySettings
Company (1) ←──→ (1) Subscription
Company (1) ───→ (N) Users
Company (1) ───→ (N) Accounts
Company (1) ───→ (N) Customers
Company (1) ───→ (N) Suppliers
Company (1) ───→ (N) InventoryItems
Company (1) ───→ (N) Invoices
Company (1) ───→ (N) Bills
Company (1) ───→ (N) Payments
Company (1) ───→ (N) JournalEntries
Company (1) ───→ (N) Ledgers
Company (1) ───→ (N) Reports
Company (1) ───→ (N) AuditLogs
Company (1) ───→ (N) BackupRecords
Company (1) ───→ (N) InventoryTransactions

User (1) ───→ (N) Invoices (created by)
User (1) ───→ (N) Bills (created by)
User (1) ───→ (N) Payments (created by)
User (1) ───→ (N) JournalEntries (created by)
User (1) ───→ (N) Reports (generated by)
User (1) ───→ (N) AuditLogs (actions by)
User (1) ───→ (N) BackupRecords (created by)

Customer (1) ───→ (N) Invoices
Customer (1) ───→ (N) Payments (received)

Supplier (1) ───→ (N) Bills
Supplier (1) ───→ (N) Payments (made)

Invoice (1) ───→ (1) JournalEntry
Invoice (N) ←──→ (N) Payments (many-to-many via invoiceIds)

Bill (1) ───→ (1) JournalEntry
Bill (N) ←──→ (N) Payments (many-to-many via billIds)

Payment (1) ───→ (1) JournalEntry

JournalEntry (1) ───→ (N) Ledgers
JournalEntry (1) ───→ (N) Account references (via lines)

InventoryItem (1) ───→ (3) Accounts (inventory, COGS, income)
InventoryItem (1) ───→ (N) InventoryTransactions

InventoryTransaction (1) ───→ (1) Invoice/Bill/JournalEntry (polymorphic)

Account (1) ───→ (1) Account (parent, self-referential)
Account (1) ───→ (N) Ledgers

SubscriptionPlan (template) ───→ Subscription (copied features)
Subscription (1) ←──→ (1) Company
```

---

## Notes

1. **Data Integrity:** All models use Mongoose validation and indexes to ensure data integrity
2. **Soft Deletes:** Most models use `isActive` flag instead of hard deletes
3. **Timestamps:** All models track `createdAt` and `updatedAt` (except where noted)
4. **Denormalization:** Some fields denormalized (e.g., `accountName` in Ledger) for performance
5. **Auto-calculation:** Many totals/balances calculated automatically in pre-save hooks
6. **Unique Constraints:** Important fields have compound unique indexes (e.g., `companyId + accountCode`)
7. **Type Safety:** Models use TypeScript interfaces for type safety
8. **Polymorphic Relations:** InventoryTransaction and AuditLog use polymorphic references

---

_Last Updated: December 30, 2025_
