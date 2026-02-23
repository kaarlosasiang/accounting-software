/**
 * Migration: Backfill missing ledger entries for auto-posted journal entries
 *
 * Root cause: services/journalEntryService.ts createInvoiceJournalEntry,
 * createBillJournalEntry, and createPaymentJournalEntry were saving journal
 * entries with status POSTED but never creating the corresponding Ledger
 * documents. This has been fixed in code; this script backfills historical data.
 *
 * Run:
 *   MONGODB_URI=<uri> npx tsx src/api/v1/scripts/backfillMissingLedgerEntries.ts
 */

import mongoose from "mongoose";
import Account from "../models/Account.js";
import { JournalEntry } from "../models/JournalEntry.js";
import { Ledger } from "../models/Ledger.js";

async function backfill() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("MONGODB_URI not set");

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB\n");

  // Find all Posted journal entries that have no ledger lines
  const allPosted = await JournalEntry.find({ status: "Posted" }).lean();
  console.log(`Found ${allPosted.length} Posted journal entries total`);

  const missing = [];
  for (const je of allPosted) {
    const count = await Ledger.countDocuments({ journalEntryId: je._id });
    if (count === 0) missing.push(je);
  }

  console.log(
    `${missing.length} entries have no ledger lines — backfilling...\n`,
  );

  for (const je of missing) {
    console.log(
      `Processing ${je.entryNumber} | ${je.description?.substring(0, 60)}`,
    );

    // Process lines sequentially to get correct running balances
    for (const line of je.lines) {
      const account = await Account.findById(line.accountId).lean();
      if (!account) {
        console.log(
          `  ⚠️  Account ${line.accountId} not found — skipping line`,
        );
        continue;
      }

      const latestEntry = await Ledger.findOne({
        companyId: je.companyId,
        accountId: line.accountId,
        transactionDate: { $lte: je.entryDate },
      })
        .sort({ transactionDate: -1, createdAt: -1 })
        .lean();

      const previousBalance = latestEntry
        ? parseFloat(latestEntry.runningBalance.toString())
        : 0;

      const isDebitNormal =
        account.accountType === "Asset" || account.accountType === "Expense";
      const debit = parseFloat(line.debit?.toString() || "0");
      const credit = parseFloat(line.credit?.toString() || "0");
      const change = isDebitNormal ? debit - credit : credit - debit;
      const runningBalance = previousBalance + change;

      await Ledger.create({
        companyId: je.companyId,
        accountId: line.accountId,
        accountName: line.accountName,
        journalEntryId: je._id,
        entryNumber: je.entryNumber ?? "",
        transactionDate: je.entryDate,
        description: line.description ?? "",
        debit: debit.toString(),
        credit: credit.toString(),
        runningBalance,
      });

      console.log(
        `  ✅ ${account.accountCode} ${account.accountName}` +
          ` | Dr ${debit.toFixed(2)} Cr ${credit.toFixed(2)}` +
          ` | runningBalance: ${runningBalance.toFixed(2)}`,
      );
    }
  }

  // After backfilling, recompute ALL running balances in chronological order
  // to fix any cascading issues caused by ordering between same-date entries.
  console.log("\nRecomputing all running balances...");
  const companies = await mongoose.connection
    .db!.collection("company")
    .find({}, { projection: { _id: 1, name: 1 } })
    .toArray();

  let totalFixed = 0;
  for (const company of companies) {
    const companyId = company._id.toString();
    const accounts = await Account.find({
      companyId: new mongoose.Types.ObjectId(companyId),
    }).lean();

    for (const account of accounts) {
      const entries = await Ledger.find({
        companyId: new mongoose.Types.ObjectId(companyId),
        accountId: account._id,
      })
        .sort({ transactionDate: 1, createdAt: 1 })
        .lean();

      if (entries.length === 0) continue;

      const isDebitNormal = account.normalBalance === "Debit";
      let runningBalance = 0;

      for (const entry of entries) {
        const debit = parseFloat(entry.debit?.toString() || "0");
        const credit = parseFloat(entry.credit?.toString() || "0");
        runningBalance += isDebitNormal ? debit - credit : credit - debit;

        const stored = parseFloat(entry.runningBalance?.toString() || "0");
        if (Math.abs(stored - runningBalance) > 0.01) {
          await Ledger.updateOne(
            { _id: entry._id },
            { $set: { runningBalance } },
          );
          totalFixed++;
        }
      }
    }
  }

  console.log(`Running balance recompute done — fixed ${totalFixed} value(s)`);
  console.log("\nBackfill complete.");

  await mongoose.disconnect();
}

backfill().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
