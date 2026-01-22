# Accountant Consultation Questions

**Date Prepared:** December 30, 2025  
**Purpose:** Gather real-world accounting practices, forms, workflows, and validation for accounting software development

---

## 1. Chart of Accounts (COA) Structure

> **Chart of Accounts** = A complete listing of all accounts in your accounting system, organized by category (Assets, Liabilities, Equity, Revenue, Expenses). Think of it as your accounting "table of contents."

### Basic Setup

- [ ] What is the standard structure for a Chart of Accounts in the Philippines?
- [ ] Can you provide a sample/template COA for:
  - [ ] Small retail business
  - [ ] Service-based business
  - [ ] Trading/wholesale business
- [ ] What are the typical account code numbering schemes? (e.g., 1000-1999 for Assets)
- [ ] How deep should the account hierarchy go? (Parent → Child → Sub-child?)
- [ ] Are there mandatory accounts required by BIR (Bureau of Internal Revenue - Philippine tax authority)?

### Account Types

- [ ] For each account type (Asset, Liability, Equity, Revenue, Expense):
  - [ ] What are the most common sub-accounts?
  - [ ] What are the normal balances?
  - [ ] What are typical transactions that affect them?

### Specific Accounts

- [ ] What inventory-related accounts are required?
  - [ ] Inventory Asset account structure
  - [ ] COGS (Cost of Goods Sold) breakdown
    > **COGS** = The direct cost of items you sold (what you paid for them). Different from Revenue (what customer paid you).
  - [ ] Inventory adjustments/shrinkage account
- [ ] What are the standard VAT/tax accounts needed?
  - [ ] Input VAT (tax you paid on purchases - can be claimed back)
  - [ ] Output VAT (tax you charged customers - must be remitted to BIR)
  - [ ] Withholding Tax accounts (by type)

---

## 2. Journal Entry Workflows

> **Journal Entry** = The fundamental accounting record that shows debits and credits for any transaction. Every financial transaction creates at least one journal entry.

### Creation & Posting

> **Posting** = Making a journal entry permanent/official so it affects your financial reports.

- [ ] What is the typical workflow from draft to posted journal entry?
- [ ] Who should have permission to create vs. post entries?
- [ ] What approval process do you recommend?
- [ ] When can/should a journal entry be edited vs. reversed?
- [ ] What documentation should be attached to journal entries?

### Common Entries

Please provide examples of journal entries for:

- [ ] Initial company setup (opening balances)
- [ ] Sales invoice with VAT
- [ ] Purchase bill with VAT and withholding tax
  > **Withholding Tax** = Tax you deduct from payments to suppliers/contractors and remit directly to BIR on their behalf.
- [ ] Customer payment received (full and partial)
- [ ] Supplier payment made (full and partial)
- [ ] Inventory purchase
- [ ] Inventory sale (both revenue and COGS entries)
- [ ] Salary payment with withholding tax
- [ ] Utility bill payment
- [ ] Depreciation entry
- [ ] Bank charges
- [ ] Bad debt write-off
  > **Bad Debt** = Customer owes you money but will never pay (bankrupt, disappeared, etc.). You "write it off" as a loss.
- [ ] Inventory adjustment (loss/gain)
- [ ] Year-end adjusting entries

### Corrections

- [ ] What is the proper way to correct a posted journal entry?
- [ ] When should you use reversing entries vs. adjusting entries?
  > **Reversing Entry** = Creates opposite entry to cancel the original (like Ctrl+Z)  
  > **Adjusting Entry** = Corrects the amount without canceling the original
- [ ] How do you handle corrections across fiscal periods?

---

## 3. Invoicing Process

### Invoice Creation

- [ ] What information is legally required on an invoice in the Philippines?
- [ ] Can you share a sample invoice template?
- [ ] What is the proper invoice numbering sequence? (Can it be reset? Rules?)
- [ ] How should VAT be displayed and calculated?
- [ ] What payment terms are standard? (Net 30, Net 15, etc.)
- [ ] Should discount be shown before or after tax?

### Invoice Workflow

- [ ] What is the workflow from quotation → invoice → payment?
- [ ] When should revenue be recognized (at invoice date or payment date)?
  > **Revenue Recognition** = When you officially count the sale as income. Accrual = when invoice issued. Cash = when payment received.
- [ ] How do you handle:
  - [ ] Partial payments?
  - [ ] Overpayments?
  - [ ] Early payment discounts?
  - [ ] Late payment penalties?
  - [ ] Credit memos/returns?

### Accounting Treatment

- [ ] What journal entry is created when an invoice is:
  - [ ] Created/issued?
  - [ ] Partially paid?
  - [ ] Fully paid?
  - [ ] Written off as bad debt?
  - [ ] Cancelled/voided?

---

## 4. Bill/Purchase Process

### Bill Creation

- [ ] What information should be recorded from supplier bills?
- [ ] How do you handle:
  - [ ] Bills with inventory items?
  - [ ] Bills for services/expenses?
  - [ ] Bills with multiple tax treatments?
  - [ ] Advance payments to suppliers?
- [ ] What is the proper numbering system for bills?

### Three-Way Matching

> **Three-Way Matching** = Comparing Purchase Order (what you ordered) + Receiving Report (what you got) + Supplier Bill (what they're charging). All three should match before you pay.

- [ ] Do you use Purchase Order → Receiving → Bill matching?
- [ ] What is the workflow for this process?
- [ ] How do you handle discrepancies?

### Accounting Treatment

- [ ] Journal entries for bills with:
  - [ ] Inventory purchase (with VAT)
  - [ ] Expense purchase (with VAT)
  - [ ] Withholding tax deducted
  - [ ] Partial payment
  - [ ] Full payment

---

## 5. Payment Processing

### Payment Methods

- [ ] What payment methods are commonly used?
- [ ] How do you record payments for each method:
  - [ ] Cash
  - [ ] Check
  - [ ] Bank transfer
  - [ ] Credit card
  - [ ] Online payment (GCash, PayMaya, etc.)
- [ ] What information needs to be tracked for each payment method?

### Payment Application

- [ ] How do you apply one payment to multiple invoices/bills?
- [ ] How do you handle payment allocation when amount doesn't match?
- [ ] What if payment is received before invoice is issued?
- [ ] How do you handle currency exchange differences?

### Bank Reconciliation

> **Bank Reconciliation** = Comparing your accounting records with your bank statement to make sure they match. Catches errors and fraud.

- [ ] What is the bank reconciliation process?
- [ ] How often should it be done?
- [ ] What are common reconciliation issues?
- [ ] How do you handle:
  - [ ] Outstanding checks? (checks you wrote but haven't been cashed yet)
  - [ ] Deposits in transit? (money you deposited but not yet in bank's records)
  - [ ] Bank errors?
  - [ ] Unknown deposits?

---

## 6. Inventory Accounting

### Costing Methods

> **Inventory Costing** = How you calculate the cost of items you sold when you bought them at different prices over time.

- [ ] What inventory costing methods are acceptable in the Philippines?
  - [ ] FIFO (First In, First Out) - Assume oldest inventory sold first
  - [ ] Weighted Average - Average cost of all inventory
  - [ ] Specific Identification - Track actual cost of each specific item
- [ ] Which method do you recommend for different business types?
- [ ] Can the method be changed? What are the implications?

### Inventory Transactions

Please provide journal entries for:

- [ ] Initial inventory setup
- [ ] Inventory purchase (with transportation, duties, etc.)
- [ ] Inventory sale
- [ ] Inventory return from customer
- [ ] Inventory return to supplier
- [ ] Inventory adjustment (physical count difference)
- [ ] Inventory write-off (damaged/expired)
- [ ] Inventory transfer between locations

### Inventory Valuation

- [ ] How often should physical inventory counts be done?
- [ ] What is Lower of Cost or Net Realizable Value (LCNRV)?
  > **LCNRV** = Inventory shown at whichever is lower: what you paid, or what you can sell it for. Protects against showing overvalued inventory.
- [ ] When and how should inventory be written down? (reducing value due to damage, obsolescence, etc.)
- [ ] How do you handle inventory shrinkage? (theft, damage, counting errors)

### Reporting

- [ ] What inventory reports are essential?
- [ ] What should be included in an inventory valuation report?
- [ ] How do you calculate inventory turnover?

---

## 7. Month-End & Year-End Closing

> **Closing** = The process of finalizing all transactions for a period, generating reports, and making adjusting entries. Like "freezing" that period.

### Month-End Process

- [ ] What is the step-by-step month-end closing process?
- [ ] What reports should be generated?
- [ ] What reconciliations are required?
- [ ] What adjusting entries are typically needed? (accruals, deferrals, corrections made at period end)
- [ ] Should the books be "locked" after month-end? How?

### Year-End Process

- [ ] What additional steps are needed for year-end?
- [ ] What are the typical year-end adjusting entries?
- [ ] How do you handle retained earnings? (accumulated profit/loss kept in the business)
- [ ] What is the process for opening a new fiscal year?
- [ ] Can transactions be posted to closed periods? When?

### Depreciation

> **Depreciation** = Spreading the cost of equipment/assets over their useful life instead of expensing all at once. E.g., ₱120,000 computer → ₱10,000/month for 12 months.

- [ ] How is depreciation calculated and recorded?
- [ ] What depreciation methods are used?
- [ ] How often is depreciation recorded?
- [ ] Can you provide sample depreciation schedules?

---

## 8. Financial Reporting

### Required Reports

- [ ] What financial reports are legally required in the Philippines?
- [ ] How often must they be generated?
- [ ] Can you share sample formats for:
  - [ ] Balance Sheet (Statement of Financial Position)
  - [ ] Income Statement (Profit & Loss)
  - [ ] Cash Flow Statement
  - [ ] Statement of Changes in Equity
  - [ ] Trial Balance (list of all accounts with their debit/credit balances - should always balance!)
  - [ ] General Ledger (detailed transaction history for each account)
  - [ ] Subsidiary Ledgers (AR, AP, Inventory)
    > **AR** = Accounts Receivable (customers owe you)  
    > **AP** = Accounts Payable (you owe suppliers)

### Management Reports

> **Management Reports** = Internal reports for business decisions (not for BIR). Help you understand business performance.

- [ ] What reports do businesses commonly need for decision-making?
- [ ] Examples:
  - [ ] Aging Report (Accounts Receivable) - Who owes you money and how overdue?
  - [ ] Aging Report (Accounts Payable) - Who you owe and how overdue?
  - [ ] Sales by Customer
  - [ ] Purchases by Supplier
  - [ ] Inventory Status
  - [ ] Budget vs. Actual
  - [ ] Profitability by Product/Service

### BIR Reporting

> **BIR Reports** = Required government tax filings. Missing these = penalties!

- [ ] What BIR reports are required?
- [ ] What is the format for:
  - [ ] Summary List of Sales (SLS) - List of all your sales with customer TINs
  - [ ] Summary List of Purchases (SLP) - List of all purchases with supplier TINs
  - [ ] VAT Relief - Claiming back Input VAT
  - [ ] Withholding Tax Reports (2307 = certificate given to suppliers, 2306 = for individuals, etc.)
- [ ] What are the filing deadlines?

---

## 9. Tax & Compliance

### VAT (Value Added Tax)

> **VAT** = Sales tax in the Philippines (typically 12%). You collect from customers and remit to BIR monthly.

- [ ] How is VAT calculated and recorded?
- [ ] What transactions are:
  - [ ] VATable? (standard 12% tax)
  - [ ] VAT-exempt? (no tax charged, can't claim input VAT)
  - [ ] Zero-rated? (0% tax but CAN claim input VAT - usually exports)
- [ ] How do you track Input VAT vs. Output VAT?
- [ ] When can Input VAT be claimed?
- [ ] What documentation is required?

### Withholding Taxes

- [ ] What types of withholding taxes exist?
- [ ] What are the rates for:
  - [ ] Professional fees
  - [ ] Rent
  - [ ] Commission
  - [ ] Services
- [ ] How are they recorded in journal entries?
- [ ] When are they remitted to BIR?

### Other Compliance

- [ ] What are the recordkeeping requirements?
- [ ] How long must records be kept?
- [ ] What documents must be in hardcopy vs. digital?
- [ ] What are common compliance mistakes to avoid?

---

## 10. Customer & Supplier Management

### Customer Setup

- [ ] What information is essential to track for customers?
- [ ] How do you determine credit limits? (max amount customer can owe before you stop selling to them)
- [ ] What are standard payment terms by industry?
- [ ] How do you handle:
  - [ ] Credit holds? (blocking sales to customer who exceeded limit or is overdue)
  - [ ] Bad debt provisions? (setting aside money/reserves for expected unpaid invoices)
  - [ ] Collection procedures?

### Supplier Setup

- [ ] What information is essential to track for suppliers?
- [ ] How do you categorize suppliers?
- [ ] What payment terms are standard?
- [ ] How do you handle early payment discounts?

---

## 11. Internal Controls & Audit Trail

> **Internal Controls** = Processes and rules to prevent fraud, errors, and theft. Critical for business security.

### Segregation of Duties

> **Segregation of Duties** = Different people handle different parts of a transaction so no one person can commit fraud alone. E.g., person who approves payments ≠ person who sends payments.

- [ ] What tasks should be separated?
- [ ] Who should be able to:
  - [ ] Create transactions?
  - [ ] Approve transactions?
  - [ ] Post to general ledger?
  - [ ] Generate reports?
  - [ ] Process payments?

### Audit Trail

- [ ] What information should be tracked in an audit log?
- [ ] How detailed should the change history be?
- [ ] How long should audit logs be kept?
- [ ] What are critical events that must be logged?

### Access Control

- [ ] What user roles do you recommend?
- [ ] What permissions should each role have?
- [ ] How do you handle terminated employees?

---

## 12. Best Practices & Common Mistakes

### Best Practices

- [ ] What are the top 5 best practices for small businesses?
- [ ] What accounting habits lead to clean books?
- [ ] How often should owners review financial statements?
- [ ] What KPIs should businesses track?
  > **KPI** = Key Performance Indicator. Metrics that show business health (e.g., gross profit margin, inventory turnover, days sales outstanding).

### Common Mistakes

- [ ] What are the most common accounting errors you see?
- [ ] What mistakes do new businesses make?
- [ ] What red flags indicate poor accounting practices?
- [ ] How can software help prevent these mistakes?

### Automation

- [ ] What tasks should be automated?
- [ ] What tasks require human review?
- [ ] What validations should software enforce?
- [ ] What warnings should be shown to users?

---

## 13. Industry-Specific Questions

### Retail/E-commerce

> **Examples:** Sari-sari store, online shop, Shopee/Lazada seller

- [ ] How do you handle sales from multiple channels (store, online, marketplace)?
- [ ] How do you track cash register transactions?
- [ ] How do you handle returns and refunds?
- [ ] How do you manage consignment inventory? (items you hold but supplier still owns until sold)

### Service Business

> **Examples:** Freelancer, consulting firm, repair shop, salon

- [ ] How do you handle project-based billing?
- [ ] How do you track time and expenses?
- [ ] How do you handle retainer fees? (advance payment for future services)
- [ ] How do you handle milestone billing?

### Trading/Wholesale

> **Examples:** Import/export, distributor, bulk supplier

- [ ] How do you handle bulk discounts?
- [ ] How do you manage supplier rebates?
- [ ] How do you handle drop shipping? (supplier ships directly to your customer)
- [ ] How do you track inventory across multiple warehouses?

---

## 14. Software-Specific Validation

### Current Implementation Review

Please review our current implementation:

- [ ] **Chart of Accounts structure** - Is our model correct?
- [ ] **Journal Entry flow** - Does our workflow make sense?
- [ ] **Inventory accounting** - Are we handling COGS correctly?
- [ ] **Payment application** - Is our approach standard?
- [ ] **Reporting** - Are we missing critical reports?

### Feature Validation

- [ ] Are these features necessary?
  - [ ] Multi-company support
  - [ ] Multi-currency
  - [ ] Budget management
  - [ ] Project/job costing
  - [ ] Fixed asset management
  - [ ] Payroll integration
- [ ] What features are "must-have" vs. "nice-to-have"?

### Data Model Review

Show them the MODEL_RELATIONSHIPS.md document:

- [ ] Is our data model accurate?
- [ ] Are we missing critical fields?
- [ ] Are relationships correct?
- [ ] What would you change?

---

## 15. Practical Scenarios

### Scenario 1: New Business Setup

Walk me through setting up accounting for a new business:

- [ ] What are the first 10 accounts to create?
- [ ] What are the opening entries?
- [ ] How do you record initial capital contribution?
- [ ] How do you handle pre-operating expenses?

### Scenario 2: Monthly Operations

Typical month for a retail business with 100 transactions:

- [ ] What is the daily routine?
- [ ] What is the weekly routine?
- [ ] What is the month-end routine?
- [ ] Sample transactions and their journal entries?

### Scenario 3: Error Correction

- [ ] Customer payment was applied to wrong invoice
- [ ] Invoice was created with wrong amount
- [ ] Inventory count revealed shortage
- [ ] Duplicate payment was recorded
- [ ] How do you correct each scenario?

---

## 16. Documents & Samples to Request

### Templates

- [ ] Chart of Accounts template (Excel/PDF)
- [ ] Sales Invoice template
- [ ] Official Receipt template
- [ ] Purchase Order template
- [ ] Bill/Supplier Invoice template
- [ ] Payment Voucher template
- [ ] Journal Entry template
- [ ] Cash Disbursement Voucher
- [ ] Cash Receipt Voucher

### Sample Reports

- [ ] Balance Sheet (actual client report, anonymized)
- [ ] Income Statement
- [ ] Trial Balance
- [ ] General Ledger (1-2 accounts)
- [ ] Accounts Receivable Aging
- [ ] Accounts Payable Aging
- [ ] Inventory Valuation Report
- [ ] VAT Relief Report

### Process Flowcharts

- [ ] Sales cycle flowchart
- [ ] Purchase cycle flowchart
- [ ] Payment processing flowchart
- [ ] Month-end closing flowchart
- [ ] Inventory receiving flowchart

### Compliance Documents

- [ ] BIR form samples (2307, 2306, 2550M, etc.)
- [ ] Checklist for BIR compliance
- [ ] Document retention requirements
- [ ] Audit preparation checklist

---

## 17. Follow-Up Questions

After initial consultation:

- [ ] Can I follow up via email with technical questions?
- [ ] Can you review our software once we have a prototype?
- [ ] Would you be willing to test the system?
- [ ] Can you refer us to other accountants for validation?
- [ ] What resources (books, websites) do you recommend?

---

## Meeting Preparation Checklist

Before the consultation:

- [ ] Print this questionnaire
- [ ] Prepare MODEL_RELATIONSHIPS.md for review
- [ ] Create sample screenshots/mockups if available
- [ ] Prepare recording device (with permission)
- [ ] Bring notebook for additional notes
- [ ] Prepare specific examples from your current implementation
- [ ] Research basic accounting terms beforehand
- [ ] Prioritize questions (in case of time constraints)

---

## Notes Section

**Date of Consultation:** **\*\***\_\_\_**\*\***  
**Accountant Name:** **\*\***\_\_\_**\*\***  
**Specialization:** **\*\***\_\_\_**\*\***  
**Years of Experience:** **\*\***\_\_\_**\*\***

### Key Takeaways:

1.
2.
3.
4.
5.

### Action Items:

- [ ]
- [ ]
- [ ]
- [ ]
- [ ]

### Items to Implement:

- [ ]
- [ ]
- [ ]

### Items to Research Further:

- [ ]
- [ ]
- [ ]

---

**Tips for the Meeting:**

1. **Record with permission** - Ask if you can record the conversation for reference
2. **Bring examples** - Show actual code/data models for concrete feedback
3. **Be specific** - Ask for exact formats, numbers, and examples
4. **Request samples** - Ask for anonymized real-world documents
5. **Prioritize** - Start with most critical questions (COA, JE, Inventory)
6. **Take notes** - Write down terminology and specific requirements
7. **Follow up** - Confirm you can email follow-up questions
8. **Validate assumptions** - Show them your current implementation

**Estimated Time Needed:** 2-3 hours (consider scheduling multiple sessions)

---

_Good luck with your consultation! This will provide invaluable real-world validation for your accounting software._

> **Note:** For detailed questions about the complete accounting cycle from inventory to financial statements, see [ACCOUNTING_CYCLE_FLOW.md](./ACCOUNTING_CYCLE_FLOW.md)
