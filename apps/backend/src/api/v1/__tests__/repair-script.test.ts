/**
 * Tests for scripts/repairAccountingData.ts against hand-built legacy data
 * that reproduces the corruption patterns of the old posting code.
 */
import mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import Account from "../models/Account.js";
import { Invoice } from "../models/Invoice.js";
import { JournalEntry } from "../models/JournalEntry.js";
import { Ledger } from "../models/Ledger.js";
import { ledgerService } from "../modules/ledger/ledgerService.js";
import { repairCompany } from "../scripts/repairAccountingData.js";

const companyId = new mongoose.Types.ObjectId();
const userId = new mongoose.Types.ObjectId();
const ids: Record<string, mongoose.Types.ObjectId> = {};
const year = new Date().getFullYear() - 2;
const d = (m: number, day: number) => new Date(year, m - 1, day, 12);

const line = (key: string, debit: number, credit: number) => ({
  accountId: ids[key],
  accountCode: key === "ar" ? "1100" : key === "sales" ? "4000" : key === "stock" ? "3200" : "3300",
  accountName: key,
  debit,
  credit,
  description: key,
});

async function insertEntry(params: {
  number: string;
  type: number;
  ref: string;
  date: Date;
  lines: ReturnType<typeof line>[];
  closing?: boolean;
  withLedger: boolean;
}) {
  const _id = new mongoose.Types.ObjectId();
  const total = params.lines.reduce((s, l) => s + l.debit, 0);
  await JournalEntry.collection.insertOne({
    _id,
    companyId,
    entryNumber: params.number,
    entryDate: params.date,
    referenceNumber: params.ref,
    entryType: params.type,
    status: "Posted",
    lines: params.lines,
    totalDebit: total,
    totalCredit: total,
    isClosingEntry: params.closing ?? false,
    createdBy: userId,
  });
  if (params.withLedger) {
    // Legacy rows: string amounts, no entry flags.
    await Ledger.collection.insertMany(
      params.lines.map((l) => ({
        companyId,
        accountId: l.accountId,
        accountName: l.accountName,
        journalEntryId: _id,
        entryNumber: params.number,
        transactionDate: params.date,
        description: l.description,
        debit: String(l.debit),
        credit: String(l.credit),
        runningBalance: 0,
        createdAt: new Date(),
      })),
    );
  }
  return _id;
}

describe("repairAccountingData", () => {
  beforeAll(async () => {
    for (const [key, code, name, type, subType, normal] of [
      ["ar", "1100", "Accounts Receivable", "Asset", "Current Asset", "Debit"],
      ["sales", "4000", "Sales Revenue", "Revenue", "Operating Revenue", "Credit"],
      ["stock", "3200", "Common Stock", "Equity", "Share Capital", "Credit"],
      ["re", "3300", "Retained Earnings", "Equity", "Retained Earnings", "Credit"],
    ]) {
      ids[key] = (
        await Account.create({
          companyId,
          accountCode: code,
          accountName: name,
          accountType: type,
          subType,
          normalBalance: normal,
          balance: 0,
        })
      )._id as mongoose.Types.ObjectId;
    }

    // Invoice 1: posted, later voided by the old code (GL never reversed).
    const je1 = await insertEntry({
      number: `JE-${year}-001`,
      type: 2,
      ref: "INV-1",
      date: d(2, 1),
      lines: [line("ar", 1000, 0), line("sales", 0, 1000)],
      withLedger: true,
    });
    await Invoice.collection.insertOne({
      companyId,
      customerId: new mongoose.Types.ObjectId(),
      invoiceNumber: "INV-1",
      invoiceDate: d(2, 1),
      dueDate: d(3, 1),
      status: "Void",
      lineItems: [],
      totalAmount: 1000,
      amountPaid: 0,
      balanceDue: 1000,
      journalEntryId: je1,
      createdBy: userId,
      updatedAt: d(2, 15),
    });

    // Invoice 2: posted and still open.
    const je2 = await insertEntry({
      number: `JE-${year}-002`,
      type: 2,
      ref: "INV-2",
      date: d(4, 1),
      lines: [line("ar", 500, 0), line("sales", 0, 500)],
      withLedger: true,
    });
    await Invoice.collection.insertOne({
      companyId,
      customerId: new mongoose.Types.ObjectId(),
      invoiceNumber: "INV-2",
      invoiceDate: d(4, 1),
      dueDate: d(5, 1),
      status: "Sent",
      lineItems: [],
      totalAmount: 500,
      amountPaid: 0,
      balanceDue: 500,
      journalEntryId: je2,
      createdBy: userId,
    });

    // Orphan automatic entry (its invoice transaction had aborted).
    await insertEntry({
      number: `JE-${year}-003`,
      type: 2,
      ref: "INV-3",
      date: d(4, 2),
      lines: [line("ar", 50, 0), line("sales", 0, 50)],
      withLedger: true,
    });

    // Entry whose ledger rows carry a placeholder journalEntryId (as written
    // by the demo seed). Must be re-linked, not posted again.
    await insertEntry({
      number: `JE-${year}-005`,
      type: 1,
      ref: "SEEDED",
      date: d(6, 1),
      lines: [line("ar", 25, 0), line("sales", 0, 25)],
      withLedger: false,
    });
    await Ledger.collection.insertMany(
      [line("ar", 25, 0), line("sales", 0, 25)].map((l) => ({
        companyId,
        accountId: l.accountId,
        accountName: l.accountName,
        journalEntryId: new mongoose.Types.ObjectId(),
        entryNumber: `JE-${year}-005`,
        transactionDate: d(6, 1),
        description: "seeded",
        debit: l.debit,
        credit: l.credit,
        runningBalance: 0,
      })),
    );

    // Year-end closing entry: posted to Common Stock and never reached the
    // ledger.
    await insertEntry({
      number: `JE-${year}-004`,
      type: 1,
      ref: "CLOSE-FY",
      date: d(12, 31),
      lines: [line("sales", 1575, 0), line("stock", 0, 1575)],
      closing: true,
      withLedger: false,
    });
  });

  afterAll(async () => {
    await Promise.all([
      Account.deleteMany({ companyId }),
      JournalEntry.deleteMany({ companyId }),
      Ledger.deleteMany({ companyId }),
      Invoice.deleteMany({ companyId }),
    ]);
  });

  it("dry run reports problems without writing anything", async () => {
    const before = await Ledger.countDocuments({ companyId });
    const report = await repairCompany(companyId.toString(), { apply: false });

    expect(report.ledgerRowsConverted).toBe(6);
    expect(report.closingLinesRemapped).toBe(1);
    expect(report.entriesMissingLedger).toEqual([`JE-${year}-004`]);
    expect(report.unlinkedRowsRelinked).toEqual([`JE-${year}-005`]);
    expect(report.voidedDocumentsReversed).toEqual(["Invoice INV-1"]);
    expect(report.review.orphanAutoEntries).toHaveLength(1);
    expect(report.review.orphanAutoEntries[0]).toContain("INV-3");

    expect(await Ledger.countDocuments({ companyId })).toBe(before);
    expect(
      await Ledger.countDocuments({ companyId, debit: { $type: "string" } }),
    ).toBe(6);
  });

  it("--apply repairs the books", async () => {
    const report = await repairCompany(companyId.toString(), {
      apply: true,
      userId: userId.toString(),
    });

    expect(report.reversalFailures).toEqual([]);
    expect(
      await Ledger.countDocuments({ companyId, debit: { $type: "string" } }),
    ).toBe(0);

    const balance = async (key: string) =>
      (
        await ledgerService.getAccountBalance(
          companyId.toString(),
          ids[key].toString(),
        )
      ).balance;

    // Closing went to Retained Earnings, not Common Stock.
    expect(await balance("stock")).toBe(0);
    // Credits 1000 + 500 + 50 + 25 (seeded rows counted once), debited
    // 1575 by the close and 1000 by the INV-1 reversal.
    expect(await balance("sales")).toBe(-1000);
    expect(await balance("re")).toBe(1575);
    expect(await balance("ar")).toBe(575);
    expect(
      await Ledger.countDocuments({ companyId, entryNumber: `JE-${year}-005` }),
    ).toBe(2);

    const closingRows = await Ledger.countDocuments({
      companyId,
      isClosingEntry: true,
    });
    expect(closingRows).toBe(2);

    expect(report.trialBalance?.balanced).toBe(true);
    expect(report.balanceSheet?.balanced).toBe(true);
  });

  it("is idempotent", async () => {
    const again = await repairCompany(companyId.toString(), {
      apply: true,
      userId: userId.toString(),
    });
    expect(again.ledgerRowsConverted).toBe(0);
    expect(again.closingLinesRemapped).toBe(0);
    expect(again.entriesMissingLedger).toEqual([]);
    expect(again.unlinkedRowsRelinked).toEqual([]);
    expect(again.voidedDocumentsReversed).toEqual([]);
    expect(again.runningBalancesUpdated).toBe(0);
  });
});
