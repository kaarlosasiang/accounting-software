/**
 * End-to-end accounting integrity tests.
 *
 * Exercises the posting engine through the real services against MongoDB
 * (transactions require a replica set) and checks the resulting books:
 * balanced entries, correct accounts, voids, payments, period close and the
 * financial statements.
 */
import mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import Account from "../models/Account.js";
import { AccountingPeriod } from "../models/AccountingPeriod.js";
import { Bill } from "../models/Bill.js";
import { Counter } from "../models/Counter.js";
import { Customer } from "../models/Customer.js";
import { InventoryItem } from "../models/InventoryItem.js";
import { Invoice } from "../models/Invoice.js";
import { JournalEntry } from "../models/JournalEntry.js";
import { Ledger } from "../models/Ledger.js";
import { Payment } from "../models/Payment.js";
import { Supplier } from "../models/Supplier.js";
import "../models/User.js";
import { billService } from "../modules/bill/billService.js";
import { invoiceService } from "../modules/invoice/invoiceService.js";
import { journalEntryService } from "../modules/journalEntry/journalEntryService.js";
import { ledgerService } from "../modules/ledger/ledgerService.js";
import { paymentService } from "../modules/payment/paymentService.js";
import { periodService } from "../modules/period/periodService.js";
import { reportService } from "../modules/report/reportService.js";
import { JournalEntryService } from "../services/journalEntryService.js";
import { JournalEntryType } from "../shared/interface/IJournalEntry.js";

vi.mock("../services/email.service.js", () => ({
  EmailService: { sendInvoice: vi.fn().mockResolvedValue(true) },
}));
vi.mock("../services/pdf.service.js", () => ({
  PDFService: {
    generateInvoicePDF: vi.fn().mockResolvedValue(Buffer.from("")),
  },
}));

const companyId = new mongoose.Types.ObjectId();
const companyIdStr = companyId.toString();
const userId = new mongoose.Types.ObjectId().toString();

const thisYear = new Date().getFullYear();
const priorYear = thisYear - 1;
const inPriorYear = (month: number, day: number) =>
  new Date(priorYear, month - 1, day, 12);

type AccountKey =
  | "cash"
  | "ar"
  | "inventory"
  | "inputVat"
  | "equipment"
  | "accumDep"
  | "ap"
  | "outputVat"
  | "commonStock"
  | "retainedEarnings"
  | "sales"
  | "service"
  | "salesDiscounts"
  | "cogs"
  | "rent"
  | "depExpense";

const ids = {} as Record<AccountKey, mongoose.Types.ObjectId>;
let customerId: mongoose.Types.ObjectId;
let otherCustomerId: mongoose.Types.ObjectId;
let supplierId: mongoose.Types.ObjectId;
let productId: mongoose.Types.ObjectId;

const chart: Array<
  [AccountKey, string, string, string, string, "Debit" | "Credit"]
> = [
  ["cash", "1010", "Cash in Bank", "Asset", "Current Asset", "Debit"],
  ["ar", "1100", "Accounts Receivable", "Asset", "Current Asset", "Debit"],
  ["inventory", "1200", "Inventory", "Asset", "Current Asset", "Debit"],
  ["inputVat", "1400", "Input VAT", "Asset", "Current Asset", "Debit"],
  ["equipment", "1530", "Equipment", "Asset", "Fixed Asset", "Debit"],
  [
    "accumDep",
    "1531",
    "Accumulated Depreciation - Equipment",
    "Asset",
    "Fixed Asset",
    "Credit",
  ],
  [
    "ap",
    "2000",
    "Accounts Payable",
    "Liability",
    "Current Liability",
    "Credit",
  ],
  [
    "outputVat",
    "2210",
    "Output VAT",
    "Liability",
    "Current Liability",
    "Credit",
  ],
  ["commonStock", "3200", "Common Stock", "Equity", "Share Capital", "Credit"],
  [
    "retainedEarnings",
    "3300",
    "Retained Earnings",
    "Equity",
    "Retained Earnings",
    "Credit",
  ],
  ["sales", "4000", "Sales Revenue", "Revenue", "Operating Revenue", "Credit"],
  [
    "service",
    "4010",
    "Service Revenue",
    "Revenue",
    "Operating Revenue",
    "Credit",
  ],
  [
    "salesDiscounts",
    "4100",
    "Sales Discounts",
    "Revenue",
    "Contra Revenue",
    "Debit",
  ],
  ["cogs", "5000", "Cost of Goods Sold", "Expense", "Cost of Sales", "Debit"],
  ["rent", "6020", "Rent Expense", "Expense", "Operating Expense", "Debit"],
  [
    "depExpense",
    "6100",
    "Depreciation Expense",
    "Expense",
    "Operating Expense",
    "Debit",
  ],
];

const ledgerBalance = async (key: AccountKey, to?: Date) =>
  (await ledgerService.getAccountBalance(companyIdStr, ids[key].toString(), to))
    .balance;

const linesOf = async (journalEntryId: unknown) => {
  const entry = await JournalEntry.findById(journalEntryId).lean();
  return entry!;
};

const amountFor = (
  entry: { lines: Array<{ accountId: any; debit: number; credit: number }> },
  key: AccountKey,
) => {
  const line = entry.lines.find(
    (l) => l.accountId.toString() === ids[key].toString(),
  );
  return line ? { debit: line.debit, credit: line.credit } : null;
};

describe("Accounting integrity", () => {
  beforeAll(async () => {
    await Promise.all([
      Account.syncIndexes(),
      JournalEntry.syncIndexes(),
      Payment.syncIndexes(),
      Counter.syncIndexes(),
    ]);

    for (const [key, code, name, type, subType, normal] of chart) {
      const account = await Account.create({
        companyId,
        accountCode: code,
        accountName: name,
        accountType: type,
        subType,
        normalBalance: normal,
        balance: 0,
        isActive: true,
      });
      ids[key] = account._id as mongoose.Types.ObjectId;
    }

    const baseParty = {
      companyId,
      email: "party@example.com",
      phone: "000",
      currentBalance: 0,
      isActive: true,
    };
    customerId = (
      await Customer.collection.insertOne({
        ...baseParty,
        customerCode: "C-ACME",
        customerName: "Acme Corp",
        displayName: "Acme Corp",
      })
    ).insertedId as any;
    otherCustomerId = (
      await Customer.collection.insertOne({
        ...baseParty,
        customerCode: "C-OTHER",
        customerName: "Other Co",
        displayName: "Other Co",
      })
    ).insertedId as any;
    supplierId = (
      await Supplier.collection.insertOne({
        ...baseParty,
        supplierCode: "S-PARTS",
        supplierName: "Parts Inc",
        displayName: "Parts Inc",
      })
    ).insertedId as any;

    const product = await InventoryItem.create({
      companyId,
      itemType: "Product",
      sku: `SKU-${companyIdStr}`,
      itemName: "Widget",
      category: "Non-Food",
      unit: "pcs",
      quantityOnHand: 100,
      quantityAsOfDate: new Date(),
      reorderLevel: 0,
      unitCost: 60,
      sellingPrice: 100,
      inventoryAccountId: ids.inventory,
      cogsAccountId: ids.cogs,
      incomeAccountId: ids.sales,
      salesTaxEnabled: false,
      isActive: true,
    });
    productId = product._id as mongoose.Types.ObjectId;

    // Owner invests 50,000 cash (prior year).
    await JournalEntryService.postEntry({
      companyId,
      userId,
      entryDate: inPriorYear(1, 2),
      entryType: JournalEntryType.MANUAL,
      description: "Owner investment",
      lines: [
        { accountId: ids.cash, debit: 50000 },
        { accountId: ids.commonStock, credit: 50000 },
      ],
    });
  });

  afterAll(async () => {
    const filter = { companyId };
    await Promise.all([
      Account.deleteMany(filter),
      JournalEntry.deleteMany(filter),
      Ledger.deleteMany(filter),
      Invoice.deleteMany(filter),
      Bill.deleteMany(filter),
      Payment.deleteMany(filter),
      Customer.deleteMany(filter),
      Supplier.deleteMany(filter),
      InventoryItem.deleteMany(filter),
      AccountingPeriod.deleteMany(filter),
      Counter.deleteMany(filter),
      mongoose.connection
        .db!.collection("inventorytransactions")
        .deleteMany(filter),
      mongoose.connection
        .db!.collection("inventoryTransactions")
        .deleteMany(filter),
    ]);
  });

  // ─── Invoices ──────────────────────────────────────────────────────────────

  let postedInvoiceId: string;

  it("posts a discounted, taxed invoice with per-line revenue and COGS, dated on the invoice date", async () => {
    const invoiceDate = inPriorYear(3, 10);
    const invoice = await invoiceService.createInvoice(companyIdStr, userId, {
      customerId,
      invoiceDate,
      dueDate: inPriorYear(4, 10),
      status: "Sent",
      taxRate: 12,
      discount: 50,
      lineItems: [
        {
          description: "Widgets",
          quantity: 5,
          unitPrice: 100,
          accountId: ids.sales,
          inventoryItemId: productId,
        },
        {
          description: "Installation",
          quantity: 2,
          unitPrice: 150.555, // rounds to 301.11
          accountId: ids.service,
        },
      ],
    });

    postedInvoiceId = invoice!._id.toString();
    // subtotal 500 + 301.11 = 801.11; tax 12% = 96.13; total 847.24
    expect(invoice!.subtotal).toBe(801.11);
    expect(invoice!.taxAmount).toBe(96.13);
    expect(invoice!.totalAmount).toBe(847.24);
    expect(invoice!.journalEntryId).toBeTruthy();

    const entry = await linesOf(invoice!.journalEntryId);
    expect(entry.entryDate.getTime()).toBe(invoiceDate.getTime());
    expect(entry.totalDebit).toBe(entry.totalCredit);

    expect(amountFor(entry, "ar")).toEqual({ debit: 847.24, credit: 0 });
    expect(amountFor(entry, "salesDiscounts")).toEqual({
      debit: 50,
      credit: 0,
    });
    expect(amountFor(entry, "sales")).toEqual({ debit: 0, credit: 500 });
    expect(amountFor(entry, "service")).toEqual({ debit: 0, credit: 301.11 });
    expect(amountFor(entry, "outputVat")).toEqual({ debit: 0, credit: 96.13 });
    // COGS at unit cost (5 × 60), not selling price
    expect(amountFor(entry, "cogs")).toEqual({ debit: 300, credit: 0 });
    expect(amountFor(entry, "inventory")).toEqual({ debit: 0, credit: 300 });

    const item = await InventoryItem.findById(productId).lean();
    expect(item!.quantityOnHand).toBe(95);
    const customer = await Customer.findById(customerId).lean();
    expect(customer!.currentBalance).toBe(847.24);
  });

  it("never double-posts: sending an invoice created as Sent is a no-op for the books", async () => {
    await invoiceService.sendInvoice(companyIdStr, postedInvoiceId, userId);
    await invoiceService.updateInvoice(
      companyIdStr,
      postedInvoiceId,
      { notes: "thanks", status: "Sent" },
      userId,
    );

    const postings = await JournalEntry.countDocuments({
      companyId,
      sourceType: "Invoice",
      sourceId: new mongoose.Types.ObjectId(postedInvoiceId),
    });
    expect(postings).toBe(1);

    const customer = await Customer.findById(customerId).lean();
    expect(customer!.currentBalance).toBe(847.24);
  });

  it("rejects financial edits on a posted invoice", async () => {
    await expect(
      invoiceService.updateInvoice(companyIdStr, postedInvoiceId, {
        discount: 0,
      }),
    ).rejects.toThrow(/posted invoice/);
  });

  it("does not let a draft become Overdue (it must still post when sent)", async () => {
    const draft = await invoiceService.createInvoice(companyIdStr, userId, {
      customerId,
      invoiceDate: inPriorYear(1, 5),
      dueDate: inPriorYear(1, 6), // long past due
      lineItems: [
        { description: "x", quantity: 1, unitPrice: 10, accountId: ids.sales },
      ],
    });
    expect(draft!.status).toBe("Draft");
    await Invoice.deleteOne({ _id: draft!._id });
  });

  it("voiding a draft invoice touches neither balances nor inventory", async () => {
    const before = await InventoryItem.findById(productId).lean();
    const draft = await invoiceService.createInvoice(companyIdStr, userId, {
      customerId,
      invoiceDate: inPriorYear(5, 1),
      dueDate: inPriorYear(6, 1),
      lineItems: [
        {
          description: "Widgets",
          quantity: 3,
          unitPrice: 100,
          accountId: ids.sales,
          inventoryItemId: productId,
        },
      ],
    });
    await invoiceService.voidInvoice(
      companyIdStr,
      draft!._id.toString(),
      userId,
    );

    const after = await InventoryItem.findById(productId).lean();
    expect(after!.quantityOnHand).toBe(before!.quantityOnHand);
    const customer = await Customer.findById(customerId).lean();
    expect(customer!.currentBalance).toBe(847.24);
  });

  it("voiding a posted invoice reverses the GL, customer balance and inventory", async () => {
    const invoice = await invoiceService.createInvoice(companyIdStr, userId, {
      customerId,
      invoiceDate: inPriorYear(5, 2),
      dueDate: inPriorYear(6, 2),
      status: "Sent",
      lineItems: [
        {
          description: "Widgets",
          quantity: 2,
          unitPrice: 100,
          accountId: ids.sales,
          inventoryItemId: productId,
        },
      ],
    });
    const arBefore = await ledgerBalance("ar");

    await invoiceService.voidInvoice(
      companyIdStr,
      invoice!._id.toString(),
      userId,
    );

    const original = await JournalEntry.findById(
      invoice!.journalEntryId,
    ).lean();
    expect(original!.status).toBe("Void");
    expect(original!.reversedByEntryId).toBeTruthy();

    expect(await ledgerBalance("ar")).toBe(
      Math.round((arBefore - 200) * 100) / 100,
    );
    const item = await InventoryItem.findById(productId).lean();
    expect(item!.quantityOnHand).toBe(95);
    const customer = await Customer.findById(customerId).lean();
    expect(customer!.currentBalance).toBe(847.24);
  });

  // ─── Bills ─────────────────────────────────────────────────────────────────

  let billId: string;

  it("posts a taxed bill with Input VAT and ignores client-supplied totals", async () => {
    const bill = await billService.createBill(companyIdStr, userId, {
      supplierId,
      billDate: inPriorYear(3, 15),
      dueDate: new Date(thisYear + 1, 0, 1), // not yet due
      status: "Sent",
      taxRate: 12,
      totalAmount: 1, // must be ignored
      amountPaid: 999, // must be ignored
      lineItems: [
        {
          description: "Rent",
          quantity: 1,
          unitPrice: 1000,
          accountId: ids.rent,
        },
      ],
    });
    billId = bill!._id.toString();

    expect(bill!.totalAmount).toBe(1120);
    expect(bill!.amountPaid).toBe(0);

    const entry = await linesOf(bill!.journalEntryId);
    expect(entry.entryDate.getTime()).toBe(inPriorYear(3, 15).getTime());
    expect(amountFor(entry, "rent")).toEqual({ debit: 1000, credit: 0 });
    expect(amountFor(entry, "inputVat")).toEqual({ debit: 120, credit: 0 });
    expect(amountFor(entry, "ap")).toEqual({ debit: 0, credit: 1120 });
  });

  it("includes unpaid, approved bills in AP aging", async () => {
    const aging = await reportService.generateAPAgingReport(companyIdStr);
    expect(aging.summary.totalOutstanding).toBe(1120);
    expect(aging.summary.totalBills).toBe(1);
  });

  // ─── Payments ──────────────────────────────────────────────────────────────

  it("rejects over-allocation, wrong customer and unposted invoices", async () => {
    const base = {
      customerId,
      paymentDate: inPriorYear(4, 1),
      paymentMethod: "Bank Transfer",
      referenceNumber: "REF-REJECT",
      bankAccountId: ids.cash,
    };

    await expect(
      paymentService.recordPaymentReceived(companyIdStr, userId, {
        ...base,
        amount: 5000,
        allocations: [
          {
            documentId: postedInvoiceId,
            allocatedAmount: 5000,
            documentType: "INVOICE",
          },
        ],
      }),
    ).rejects.toThrow(/exceeds the balance due/);

    await expect(
      paymentService.recordPaymentReceived(companyIdStr, userId, {
        ...base,
        customerId: otherCustomerId,
        amount: 100,
        allocations: [
          {
            documentId: postedInvoiceId,
            allocatedAmount: 100,
            documentType: "INVOICE",
          },
        ],
      }),
    ).rejects.toThrow(/different customer/);

    const draft = await invoiceService.createInvoice(companyIdStr, userId, {
      customerId,
      invoiceDate: inPriorYear(4, 1),
      dueDate: inPriorYear(5, 1),
      lineItems: [
        { description: "x", quantity: 1, unitPrice: 100, accountId: ids.sales },
      ],
    });
    await expect(
      paymentService.recordPaymentReceived(companyIdStr, userId, {
        ...base,
        amount: 100,
        allocations: [
          {
            documentId: draft!._id.toString(),
            allocatedAmount: 100,
            documentType: "INVOICE",
          },
        ],
      }),
    ).rejects.toThrow(/Draft and cannot receive payments/);
    await Invoice.deleteOne({ _id: draft!._id });

    const payments = await Payment.countDocuments({ companyId });
    expect(payments).toBe(0);
  });

  it("records a partial payment dated on the payment date", async () => {
    const paymentDate = inPriorYear(4, 15);
    const result = await paymentService.recordPaymentReceived(
      companyIdStr,
      userId,
      {
        customerId,
        paymentDate,
        paymentMethod: "Bank Transfer",
        referenceNumber: "REF-400",
        bankAccountId: ids.cash,
        amount: 400,
        allocations: [
          {
            documentId: postedInvoiceId,
            allocatedAmount: 400,
            documentType: "INVOICE",
          },
        ],
      },
    );

    const entry = await linesOf(result.payment!.journalEntryId);
    expect(entry.entryDate.getTime()).toBe(paymentDate.getTime());
    expect(amountFor(entry, "cash")).toEqual({ debit: 400, credit: 0 });
    expect(amountFor(entry, "ar")).toEqual({ debit: 0, credit: 400 });

    const invoice = await Invoice.findById(postedInvoiceId).lean();
    expect(invoice!.amountPaid).toBe(400);
    expect(invoice!.balanceDue).toBe(447.24);
    expect(invoice!.status).toBe("Partial");
  });

  // ─── Statements ───────────────────────────────────────────────────────────

  it("produces a balanced balance sheet with positive liabilities and contra assets reducing assets", async () => {
    // Equipment bought for cash, then depreciated.
    await JournalEntryService.postEntry({
      companyId,
      userId,
      entryDate: inPriorYear(6, 1),
      entryType: JournalEntryType.MANUAL,
      lines: [
        { accountId: ids.equipment, debit: 12000 },
        { accountId: ids.cash, credit: 12000 },
      ],
    });
    await JournalEntryService.postEntry({
      companyId,
      userId,
      entryDate: inPriorYear(12, 31),
      entryType: JournalEntryType.MANUAL,
      lines: [
        { accountId: ids.depExpense, debit: 1000 },
        { accountId: ids.accumDep, credit: 1000 },
      ],
    });

    const asOf = new Date(priorYear, 11, 31, 23, 59, 59, 999);
    const bs = await reportService.generateBalanceSheet(companyIdStr, asOf);

    expect(bs.balanced).toBe(true);
    expect(bs.liabilities.total).toBeGreaterThan(0);
    const accumDep = bs.assets.fixedAssets.find(
      (a) => a.accountName === "Accumulated Depreciation - Equipment",
    );
    expect(accumDep!.balance).toBe(-1000);
    const fixedTotal = bs.assets.fixedAssets.reduce((s, a) => s + a.balance, 0);
    expect(fixedTotal).toBe(11000);
  });

  it("reconciles the cash flow statement to the change in cash", async () => {
    const cf = await reportService.generateCashFlowStatement(
      companyIdStr,
      new Date(priorYear, 0, 1),
      new Date(priorYear, 11, 31, 23, 59, 59, 999),
    );
    expect(cf.summary.reconciled).toBe(true);
    expect(cf.operatingActivities.depreciationAmortization).toBe(1000);
    expect(cf.investingActivities.total).toBe(-12000);
    expect(cf.financingActivities.total).toBe(50000);
  });

  // ─── Period close ─────────────────────────────────────────────────────────

  let periodId: string;
  let priorYearNetIncome: number;

  it("closes a period into Retained Earnings (not Common Stock) and posts to the ledger", async () => {
    const start = new Date(priorYear, 0, 1);
    const end = new Date(priorYear, 11, 31, 23, 59, 59, 999);

    const is = await reportService.generateIncomeStatement(
      companyIdStr,
      start,
      end,
    );
    priorYearNetIncome = is.summary.netIncome;
    expect(priorYearNetIncome).not.toBe(0);

    const period = await periodService.createPeriod(companyIdStr, {
      periodName: `FY ${priorYear}`,
      periodType: "Annual" as any,
      fiscalYear: priorYear,
      startDate: start,
      endDate: end,
    });
    periodId = period._id.toString();

    const result = await periodService.closePeriod(
      companyIdStr,
      periodId,
      userId,
    );
    expect(result.netIncome).toBe(priorYearNetIncome);

    const closingRows = await Ledger.countDocuments({
      companyId,
      journalEntryId: result.closingEntry!._id,
    });
    expect(closingRows).toBeGreaterThan(0);

    expect(await ledgerBalance("retainedEarnings")).toBe(priorYearNetIncome);
    expect(await ledgerBalance("commonStock")).toBe(50000);
    // P&L accounts are zero as of the period end (a later-dated void
    // reversal of a prior-year invoice correctly lands in the current year).
    expect(await ledgerBalance("sales", end)).toBe(0);
    expect(await ledgerBalance("salesDiscounts", end)).toBe(0);

    // The P&L for the closed period still shows its net income.
    const after = await reportService.generateIncomeStatement(
      companyIdStr,
      start,
      end,
    );
    expect(after.summary.netIncome).toBe(priorYearNetIncome);

    // The balance sheet still balances, both at year end and next year.
    const bsYearEnd = await reportService.generateBalanceSheet(
      companyIdStr,
      end,
    );
    expect(bsYearEnd.balanced).toBe(true);
    const bsNow = await reportService.generateBalanceSheet(companyIdStr);
    expect(bsNow.balanced).toBe(true);
  });

  it("blocks postings into the closed period", async () => {
    await expect(
      JournalEntryService.postEntry({
        companyId,
        userId,
        entryDate: inPriorYear(7, 1),
        entryType: JournalEntryType.MANUAL,
        lines: [
          { accountId: ids.rent, debit: 10 },
          { accountId: ids.cash, credit: 10 },
        ],
      }),
    ).rejects.toThrow(/Closed period/);
  });

  it("reopening reverses the closing entry and restores balances", async () => {
    await periodService.reopenPeriod(companyIdStr, periodId, userId);

    expect(await ledgerBalance("retainedEarnings")).toBe(0);
    const tb = await ledgerService.getTrialBalance(companyIdStr);
    expect(tb.totals.balanced).toBe(true);
    const bs = await reportService.generateBalanceSheet(companyIdStr);
    expect(bs.balanced).toBe(true);
  });

  // ─── Manual journal entries ───────────────────────────────────────────────

  it("refuses to void automatic entries directly", async () => {
    const bill = await Bill.findById(billId).lean();
    await expect(
      journalEntryService.voidJournalEntry(
        companyIdStr,
        bill!.journalEntryId!.toString(),
        userId,
      ),
    ).rejects.toThrow(/Automatic journal entries cannot be voided/);
  });

  it("numbers entries numerically past 999 and never duplicates under concurrency", async () => {
    const year = thisYear + 5;
    await Counter.deleteMany({ companyId, key: `JE-${year}-` });
    // Pretend #999 already exists (string-sorted generators break here).
    await JournalEntry.collection.insertOne({
      companyId,
      entryNumber: `JE-${year}-999`,
      entryDate: new Date(year, 0, 1),
      entryType: JournalEntryType.MANUAL,
      status: "Draft",
      lines: [],
      totalDebit: 0,
      totalCredit: 0,
      createdBy: new mongoose.Types.ObjectId(userId),
    });

    const created = await Promise.all(
      Array.from({ length: 5 }, () =>
        journalEntryService.createJournalEntry({
          companyId,
          userId: new mongoose.Types.ObjectId(userId),
          entryDate: new Date(year, 0, 2),
          lines: [
            { accountId: ids.rent, debit: 1 },
            { accountId: ids.cash, credit: 1 },
          ],
        }),
      ),
    );

    const numbers = created.map((e) => e.entryNumber).sort();
    expect(new Set(numbers).size).toBe(5);
    expect(numbers).toContain(`JE-${year}-1000`);
    expect(numbers.every((n) => n !== `JE-${year}-999`)).toBe(true);
  });
});
