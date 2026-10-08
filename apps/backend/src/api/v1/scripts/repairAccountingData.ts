/**
 * Repair accounting data written by the pre-fix posting code.
 *
 * Dry-run by default: prints what it would change and writes nothing.
 * Idempotent: running it again after --apply finds nothing to do.
 *
 * Run:
 *   MONGODB_URI=<uri> DB_NAME=<db> npx tsx src/api/v1/scripts/repairAccountingData.ts
 *   ... --apply                 # write the fixes
 *   ... --company <companyId>   # limit to one company
 *
 * What it does, per company:
 *  1. Converts legacy string debit/credit ledger values to numbers and
 *     backfills `entryType` / `isClosingEntry` on ledger rows.
 *  2. Remaps closing-entry lines that were posted to a non-Retained-Earnings
 *     equity account (the old code used code 3200, which the seeded chart
 *     defines as Common Stock) to Retained Earnings — journal entry and
 *     ledger rows alike.
 *  3. Writes missing ledger rows for posted/voided journal entries. Closing
 *     entries were saved as POSTED but never reached the ledger, while
 *     reopening a period posted a reversal of them; posting the originals
 *     makes those reversals net out.
 *  4. Reverses the journal entry of every voided invoice/bill/payment whose
 *     entry is still POSTED (old voids did not touch the GL).
 *  5. Reports (never changes) suspicious data for manual review: documents
 *     posted more than once, automatic entries with no source document,
 *     and draft invoices/bills that carry a journal entry.
 *  6. Recomputes the informational `runningBalance` on ledger rows, then
 *     prints the trial balance and balance sheet check.
 */
import path from "path";
import { fileURLToPath } from "url";

import mongoose from "mongoose";

import Account from "../models/Account.js";
import { Bill } from "../models/Bill.js";
import { Invoice } from "../models/Invoice.js";
import { JournalEntry } from "../models/JournalEntry.js";
import { Ledger } from "../models/Ledger.js";
import { Payment } from "../models/Payment.js";
import { ledgerService } from "../modules/ledger/ledgerService.js";
import { reportService } from "../modules/report/reportService.js";
import {
  findSystemAccount,
  SystemAccount,
} from "../services/accountResolver.js";
import { JournalEntryService } from "../services/journalEntryService.js";
import { round2 } from "../shared/helpers/money.js";
import {
  JournalEntryStatus,
  JournalEntryType,
} from "../shared/interface/IJournalEntry.js";

export interface RepairReport {
  companyId: string;
  apply: boolean;
  ledgerRowsConverted: number;
  ledgerRowsFlagged: number;
  closingLinesRemapped: number;
  entriesMissingLedger: string[];
  unlinkedRowsRelinked: string[];
  voidedDocumentsReversed: string[];
  reversalFailures: string[];
  review: {
    doublePosted: string[];
    orphanAutoEntries: string[];
    draftsWithJournalEntry: string[];
    partiallyPostedEntries: string[];
    relinkedAmountMismatch: string[];
    ledgerRowsWithoutEntry: number;
  };
  runningBalancesUpdated: number;
  trialBalance?: { debits: number; credits: number; balanced: boolean };
  balanceSheet?: { difference: number; balanced: boolean };
}

const SYSTEM_USER = new mongoose.Types.ObjectId("000000000000000000000000");

export async function repairCompany(
  companyId: string,
  options: { apply: boolean; userId?: string } = { apply: false },
): Promise<RepairReport> {
  const apply = options.apply;
  const userId = options.userId ?? SYSTEM_USER.toString();
  const cId = new mongoose.Types.ObjectId(companyId);

  const report: RepairReport = {
    companyId,
    apply,
    ledgerRowsConverted: 0,
    ledgerRowsFlagged: 0,
    closingLinesRemapped: 0,
    entriesMissingLedger: [],
    unlinkedRowsRelinked: [],
    voidedDocumentsReversed: [],
    reversalFailures: [],
    review: {
      doublePosted: [],
      orphanAutoEntries: [],
      draftsWithJournalEntry: [],
      partiallyPostedEntries: [],
      relinkedAmountMismatch: [],
      ledgerRowsWithoutEntry: 0,
    },
    runningBalancesUpdated: 0,
  };

  // ── 1. Normalize ledger rows ────────────────────────────────────────────
  const stringFilter = {
    companyId: cId,
    $or: [{ debit: { $type: "string" } }, { credit: { $type: "string" } }],
  };
  report.ledgerRowsConverted =
    await Ledger.collection.countDocuments(stringFilter);
  if (apply && report.ledgerRowsConverted > 0) {
    await Ledger.collection.updateMany(stringFilter, [
      {
        $set: {
          debit: { $round: [{ $toDouble: { $ifNull: ["$debit", 0] } }, 2] },
          credit: { $round: [{ $toDouble: { $ifNull: ["$credit", 0] } }, 2] },
        },
      },
    ]);
  }

  const unflaggedEntryIds: mongoose.Types.ObjectId[] = await Ledger.distinct(
    "journalEntryId",
    { companyId: cId, entryType: { $in: [null] } },
  );
  if (unflaggedEntryIds.length > 0) {
    const entries = await JournalEntry.find({
      _id: { $in: unflaggedEntryIds },
    })
      .select("entryType isClosingEntry")
      .lean();
    for (const entry of entries) {
      const filter = {
        companyId: cId,
        journalEntryId: entry._id,
        entryType: { $in: [null] },
      };
      report.ledgerRowsFlagged += await Ledger.countDocuments(filter);
      if (apply) {
        await Ledger.collection.updateMany(filter, {
          $set: {
            entryType: entry.entryType,
            isClosingEntry: entry.isClosingEntry ?? false,
          },
        });
      }
    }
  }

  // ── 2. Remap closing lines posted to the wrong equity account ───────────
  const retainedEarnings = await findSystemAccount(
    cId,
    SystemAccount.RETAINED_EARNINGS,
  );
  const closingEntries = await JournalEntry.find({
    companyId: cId,
    isClosingEntry: true,
  });
  if (retainedEarnings) {
    const equityIds = new Set(
      (
        await Account.find({ companyId: cId, accountType: "Equity" })
          .select("_id")
          .lean()
      ).map((a) => a._id.toString()),
    );
    const reId = retainedEarnings._id.toString();

    for (const entry of closingEntries) {
      let changed = false;
      for (const line of entry.lines) {
        const accountId = line.accountId.toString();
        if (equityIds.has(accountId) && accountId !== reId) {
          if (apply) {
            await Ledger.collection.updateMany(
              {
                companyId: cId,
                journalEntryId: entry._id,
                accountId: line.accountId,
              },
              {
                $set: {
                  accountId: retainedEarnings._id,
                  accountName: retainedEarnings.accountName,
                },
              },
            );
            line.accountId = retainedEarnings._id;
            line.accountCode = retainedEarnings.accountCode;
            line.accountName = retainedEarnings.accountName;
          }
          changed = true;
          report.closingLinesRemapped++;
        }
      }
      if (apply && changed) {
        // Only account references changed; amounts and totals are unaffected.
        entry.markModified("lines");
        await entry.save({ validateBeforeSave: false });
      }
    }
  }

  // ── 3. Ledger rows missing for posted / voided entries ──────────────────
  const postedEntries = await JournalEntry.find({
    companyId: cId,
    status: { $in: [JournalEntryStatus.POSTED, JournalEntryStatus.VOID] },
  });
  const rowCounts = new Map<string, number>(
    (
      await Ledger.aggregate([
        { $match: { companyId: cId } },
        { $group: { _id: "$journalEntryId", count: { $sum: 1 } } },
      ])
    ).map((r) => [r._id.toString(), r.count]),
  );

  // Ledger rows whose journalEntryId points at no journal entry (e.g. rows
  // written by the demo seed with a placeholder id). If they carry the entry
  // number of an entry that has no linked rows, they ARE that entry's
  // posting: re-link them instead of posting the entry a second time.
  const allEntryIds = await JournalEntry.distinct("_id", { companyId: cId });
  const unlinkedRows = await Ledger.find({
    companyId: cId,
    journalEntryId: { $nin: allEntryIds },
  })
    .select("_id entryNumber debit credit")
    .lean();
  const unlinkedByNumber = new Map<string, typeof unlinkedRows>();
  for (const row of unlinkedRows) {
    const key = row.entryNumber ?? "";
    if (!unlinkedByNumber.has(key)) unlinkedByNumber.set(key, []);
    unlinkedByNumber.get(key)!.push(row);
  }
  const relinkedNumbers = new Set<string>();

  for (const entry of postedEntries) {
    const rows = rowCounts.get(entry._id.toString()) ?? 0;
    const unlinked = unlinkedByNumber.get(entry.entryNumber);

    if (rows === 0 && unlinked?.length) {
      relinkedNumbers.add(entry.entryNumber);
      report.unlinkedRowsRelinked.push(entry.entryNumber);
      const debits = round2(unlinked.reduce((s, r) => s + Number(r.debit), 0));
      if (Math.abs(debits - entry.totalDebit) > 0.005) {
        report.review.relinkedAmountMismatch.push(
          `${entry.entryNumber}: ledger ${debits} vs entry ${entry.totalDebit}`,
        );
      }
      if (apply) {
        await Ledger.collection.updateMany(
          { _id: { $in: unlinked.map((r) => r._id) } },
          {
            $set: {
              journalEntryId: entry._id,
              entryType: entry.entryType,
              isClosingEntry: entry.isClosingEntry ?? false,
            },
          },
        );
      }
    } else if (rows === 0) {
      report.entriesMissingLedger.push(entry.entryNumber);
      if (apply) {
        await JournalEntryService.writeLedgerRows(entry);
      }
    } else if (rows < entry.lines.length) {
      report.review.partiallyPostedEntries.push(entry.entryNumber);
    }
  }

  report.review.ledgerRowsWithoutEntry = unlinkedRows.filter(
    (r) => !relinkedNumbers.has(r.entryNumber ?? ""),
  ).length;

  // ── 4. Voided documents whose journal entry was never reversed ──────────
  const voidedSources: Array<{
    label: string;
    journalEntryId: mongoose.Types.ObjectId;
    voidedAt: Date;
  }> = [];

  for (const inv of await Invoice.find({
    companyId: cId,
    status: "Void",
    journalEntryId: { $ne: null },
  })
    .select("invoiceNumber journalEntryId updatedAt")
    .lean()) {
    voidedSources.push({
      label: `Invoice ${inv.invoiceNumber}`,
      journalEntryId: inv.journalEntryId as mongoose.Types.ObjectId,
      voidedAt: inv.updatedAt,
    });
  }
  for (const bill of await Bill.find({
    companyId: cId,
    status: "Void",
    journalEntryId: { $ne: null },
  })
    .select("billNumber journalEntryId updatedAt")
    .lean()) {
    voidedSources.push({
      label: `Bill ${bill.billNumber}`,
      journalEntryId: bill.journalEntryId as mongoose.Types.ObjectId,
      voidedAt: bill.updatedAt,
    });
  }
  for (const payment of await Payment.find({
    companyId: cId,
    status: "VOIDED",
    journalEntryId: { $ne: null },
  })
    .select("paymentNumber journalEntryId voidedAt updatedAt")
    .lean()) {
    voidedSources.push({
      label: `Payment ${payment.paymentNumber}`,
      journalEntryId: payment.journalEntryId as mongoose.Types.ObjectId,
      voidedAt: (payment as any).voidedAt ?? payment.updatedAt,
    });
  }

  for (const source of voidedSources) {
    const entry = await JournalEntry.findById(source.journalEntryId)
      .select("status")
      .lean();
    if (entry?.status !== JournalEntryStatus.POSTED) continue;

    report.voidedDocumentsReversed.push(source.label);
    if (!apply) continue;

    try {
      await JournalEntryService.reverseEntry({
        companyId,
        journalEntryId: source.journalEntryId,
        userId,
        date: source.voidedAt,
        reason: `${source.label} voided (data repair)`,
      });
    } catch (error) {
      // The void date may fall in a closed period: post the reversal today.
      try {
        await JournalEntryService.reverseEntry({
          companyId,
          journalEntryId: source.journalEntryId,
          userId,
          reason: `${source.label} voided (data repair)`,
        });
      } catch (retryError) {
        report.reversalFailures.push(
          `${source.label}: ${(retryError as Error).message}`,
        );
      }
    }
  }

  // ── 5. Review-only checks ───────────────────────────────────────────────
  const autoTypes = [
    { type: JournalEntryType.AUTO_INVOICE, model: Invoice, label: "Invoice" },
    { type: JournalEntryType.AUTO_BILL, model: Bill, label: "Bill" },
    { type: JournalEntryType.AUTO_PAYMENT, model: Payment, label: "Payment" },
  ] as const;

  for (const { type, model, label } of autoTypes) {
    const entries = await JournalEntry.find({
      companyId: cId,
      entryType: type,
      reversalOfEntryId: null,
      referenceNumber: { $not: /^REV-/ },
    })
      .select("_id entryNumber referenceNumber status")
      .lean();

    const linked = new Set(
      (
        await (model as any)
          .find({ companyId: cId, journalEntryId: { $ne: null } })
          .select("journalEntryId")
          .lean()
      ).map((d: any) => d.journalEntryId.toString()),
    );

    const postedByRef = new Map<string, number>();
    for (const entry of entries) {
      if (entry.status === JournalEntryStatus.POSTED && entry.referenceNumber) {
        postedByRef.set(
          entry.referenceNumber,
          (postedByRef.get(entry.referenceNumber) ?? 0) + 1,
        );
      }
      if (
        entry.status === JournalEntryStatus.POSTED &&
        !linked.has(entry._id.toString())
      ) {
        report.review.orphanAutoEntries.push(
          `${label} entry ${entry.entryNumber} (ref ${entry.referenceNumber ?? "-"})`,
        );
      }
    }
    for (const [ref, count] of postedByRef) {
      if (count > 1) {
        report.review.doublePosted.push(`${label} ${ref}: ${count} postings`);
      }
    }
  }

  for (const { model, label, field } of [
    { model: Invoice, label: "Invoice", field: "invoiceNumber" },
    { model: Bill, label: "Bill", field: "billNumber" },
  ] as const) {
    const drafts = await (model as any)
      .find({ companyId: cId, status: "Draft", journalEntryId: { $ne: null } })
      .select(field)
      .lean();
    for (const d of drafts) {
      report.review.draftsWithJournalEntry.push(`${label} ${d[field]}`);
    }
  }

  // ── 6. Running balances + summary ───────────────────────────────────────
  if (apply) {
    report.runningBalancesUpdated = await recomputeRunningBalances(cId);
    const tb = await ledgerService.getTrialBalance(companyId);
    report.trialBalance = {
      debits: tb.totals.debits,
      credits: tb.totals.credits,
      balanced: tb.totals.balanced,
    };
    const bs = await reportService.generateBalanceSheet(companyId);
    report.balanceSheet = {
      difference: bs.equation.difference,
      balanced: bs.balanced,
    };
  }

  return report;
}

/**
 * Recompute the informational runningBalance on every ledger row
 * (chronological, type-normal sign). Returns the number of rows changed.
 */
async function recomputeRunningBalances(
  companyId: mongoose.Types.ObjectId,
): Promise<number> {
  const accounts = await Account.find({ companyId })
    .select("accountType")
    .lean();
  let updated = 0;

  for (const account of accounts) {
    const debitNormal =
      account.accountType === "Asset" || account.accountType === "Expense";
    const rows = await Ledger.find({ companyId, accountId: account._id })
      .select("debit credit runningBalance")
      .sort({ transactionDate: 1, createdAt: 1, _id: 1 })
      .lean();

    let running = 0;
    const ops = [];
    for (const row of rows) {
      const debit = Number(row.debit) || 0;
      const credit = Number(row.credit) || 0;
      running = round2(
        running + (debitNormal ? debit - credit : credit - debit),
      );
      if (Math.abs((row.runningBalance ?? 0) - running) > 0.001) {
        ops.push({
          updateOne: {
            filter: { _id: row._id },
            update: { $set: { runningBalance: running } },
          },
        });
      }
    }
    if (ops.length > 0) {
      await Ledger.bulkWrite(ops);
      updated += ops.length;
    }
  }

  return updated;
}

function printReport(name: string, r: RepairReport) {
  const list = (title: string, items: string[]) => {
    console.log(`  ${title}: ${items.length}`);
    for (const item of items.slice(0, 20)) console.log(`    - ${item}`);
    if (items.length > 20) console.log(`    … ${items.length - 20} more`);
  };

  console.log(`\n=== ${name} (${r.companyId}) ${r.apply ? "[APPLIED]" : "[DRY RUN]"}`);
  console.log(`  Ledger rows with string amounts: ${r.ledgerRowsConverted}`);
  console.log(`  Ledger rows missing entry flags: ${r.ledgerRowsFlagged}`);
  console.log(`  Closing lines remapped to Retained Earnings: ${r.closingLinesRemapped}`);
  list("Entries missing ledger rows", r.entriesMissingLedger);
  list(
    "Unlinked ledger rows re-linked to their entry (by entry number)",
    r.unlinkedRowsRelinked,
  );
  list("Voided documents needing GL reversal", r.voidedDocumentsReversed);
  list("Reversal failures", r.reversalFailures);
  console.log("  Manual review:");
  list("  Double-posted documents", r.review.doublePosted);
  list("  Automatic entries without a source document", r.review.orphanAutoEntries);
  list("  Drafts carrying a journal entry", r.review.draftsWithJournalEntry);
  list("  Partially posted entries", r.review.partiallyPostedEntries);
  list(
    "  Re-linked rows whose amounts differ from the entry",
    r.review.relinkedAmountMismatch,
  );
  console.log(
    `    Ledger rows referencing no journal entry: ${r.review.ledgerRowsWithoutEntry}`,
  );
  if (r.apply) {
    console.log(`  Running balances updated: ${r.runningBalancesUpdated}`);
    console.log(
      `  Trial balance: Dr ${r.trialBalance?.debits} / Cr ${r.trialBalance?.credits} ` +
        (r.trialBalance?.balanced ? "✅ balanced" : "❌ NOT balanced"),
    );
    console.log(
      `  Balance sheet: difference ${r.balanceSheet?.difference} ` +
        (r.balanceSheet?.balanced ? "✅ balanced" : "❌ NOT balanced"),
    );
  }
}

async function main() {
  const apply = process.argv.includes("--apply");
  const companyIdx = process.argv.indexOf("--company");
  const onlyCompany = companyIdx > -1 ? process.argv[companyIdx + 1] : null;

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("MONGODB_URI not set");
  await mongoose.connect(mongoUri, {
    dbName: process.env.DB_NAME || undefined,
  });

  const companies = await mongoose.connection
    .db!.collection("company")
    .find(
      onlyCompany ? { _id: new mongoose.Types.ObjectId(onlyCompany) } : {},
      { projection: { _id: 1, name: 1 } },
    )
    .toArray();

  console.log(
    `${apply ? "APPLYING" : "DRY RUN (pass --apply to write)"} for ${companies.length} compan${companies.length === 1 ? "y" : "ies"}`,
  );

  for (const company of companies) {
    const result = await repairCompany(company._id.toString(), { apply });
    printReport(company.name ?? "Company", result);
  }

  await mongoose.disconnect();
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  main().catch(async (error) => {
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
  });
}
