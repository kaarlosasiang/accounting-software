/**
 * backfillVoidLedger.ts
 *
 * Fixes two categories of missing ledger entries caused by earlier bugs:
 *
 * CASE A — Manually voided JEs (status = VOID, module-level void path)
 *   The old code used `if (!account) continue`, so if any account lookup
 *   failed the void committed with zero reversal ledger entries.
 *   Fix: find VOID JEs that have no `-VOID` suffixed ledger rows and create them.
 *
 * CASE B — Auto-created reversing JEs (referenceNumber starts with "REV-", status = POSTED)
 *   The shared JournalEntryService.voidJournalEntry created these documents but
 *   never called postLinesToLedger, so they exist as Posted JEs with no ledger rows.
 *   Fix: find POSTED REV-* JEs with no ledger rows and create them.
 *
 * Usage:
 *   # Dry run (default — prints what would be inserted, no writes)
 *   MONGODB_URI="mongodb+srv://..." tsx src/api/v1/scripts/backfillVoidLedger.ts
 *
 *   # Apply to production (writes to DB)
 *   MONGODB_URI="mongodb+srv://..." tsx src/api/v1/scripts/backfillVoidLedger.ts --apply
 *
 *   # Scope to a single company
 *   MONGODB_URI="..." tsx src/api/v1/scripts/backfillVoidLedger.ts --companyId=<id>
 */

import dotenv from "dotenv";
import mongoose, { Schema } from "mongoose";

dotenv.config();

// ─── Inline minimal models (avoids importing the full app) ─────────────────────

interface IAccount {
  _id: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  accountCode: string;
  accountName: string;
  accountType: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";
  normalBalance: "Debit" | "Credit";
}

const AccountSchema = new Schema<IAccount>(
  {
    companyId: { type: Schema.Types.ObjectId, required: true },
    accountCode: { type: String, required: true },
    accountName: { type: String, required: true },
    accountType: { type: String, required: true },
    normalBalance: { type: String, required: true },
  },
  { collection: "accounts" },
);

const Account =
  mongoose.models.Account || mongoose.model<IAccount>("Account", AccountSchema);

// ─── JournalEntry ───────────────────────────────────────────────────────────────

interface IJELine {
  accountId: mongoose.Types.ObjectId;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
}

interface IJournalEntry {
  _id: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  entryNumber: string;
  entryDate: Date;
  referenceNumber?: string;
  description: string;
  status: string;
  voidedAt?: Date;
  lines: IJELine[];
}

const JESchema = new Schema<IJournalEntry>(
  {
    companyId: { type: Schema.Types.ObjectId, required: true },
    entryNumber: { type: String, required: true },
    entryDate: { type: Date, required: true },
    referenceNumber: { type: String },
    description: { type: String, required: true },
    status: { type: String, required: true },
    voidedAt: { type: Date },
    lines: [
      {
        accountId: { type: Schema.Types.ObjectId, required: true },
        accountCode: { type: String, required: true },
        accountName: { type: String, required: true },
        debit: { type: Number, required: true, default: 0 },
        credit: { type: Number, required: true, default: 0 },
        description: { type: String },
      },
    ],
  },
  { collection: "journalentries" },
);

const JournalEntry =
  mongoose.models.JournalEntry ||
  mongoose.model<IJournalEntry>("JournalEntry", JESchema);

// ─── Ledger ─────────────────────────────────────────────────────────────────────

interface ILedger {
  companyId: mongoose.Types.ObjectId;
  accountId: mongoose.Types.ObjectId;
  accountName: string;
  journalEntryId: mongoose.Types.ObjectId;
  entryNumber: string;
  transactionDate: Date;
  description: string;
  debit: string;
  credit: string;
  runningBalance: number;
}

const LedgerSchema = new Schema<ILedger>(
  {
    companyId: { type: Schema.Types.ObjectId, required: true },
    accountId: { type: Schema.Types.ObjectId, required: true },
    accountName: { type: String, required: true },
    journalEntryId: { type: Schema.Types.ObjectId, required: true },
    entryNumber: { type: String, required: true },
    transactionDate: { type: Date, required: true },
    description: { type: String, required: true },
    debit: { type: String, required: true, default: "0" },
    credit: { type: String, required: true, default: "0" },
    runningBalance: { type: Number, required: true, default: 0 },
  },
  { collection: "ledgers", timestamps: { createdAt: true, updatedAt: false } },
);

const Ledger =
  mongoose.models.Ledger || mongoose.model<ILedger>("Ledger", LedgerSchema);

// ─── Helpers ────────────────────────────────────────────────────────────────────

async function getRunningBalance(
  companyId: mongoose.Types.ObjectId,
  accountId: mongoose.Types.ObjectId,
  asOfDate: Date,
): Promise<number> {
  const latest = await Ledger.findOne({
    companyId,
    accountId,
    transactionDate: { $lte: asOfDate },
  })
    .sort({ transactionDate: -1, createdAt: -1 })
    .lean();
  return latest ? latest.runningBalance : 0;
}

function isDebitNormal(accountType: string): boolean {
  return accountType === "Asset" || accountType === "Expense";
}

// ─── Case A: VOID JEs missing reversal ledger entries ──────────────────────────

async function backfillCaseA(
  companyFilter: mongoose.Types.ObjectId | null,
  dryRun: boolean,
): Promise<number> {
  const query: any = { status: "VOID" };
  if (companyFilter) query.companyId = companyFilter;

  const voidedJEs = await JournalEntry.find(query).lean();
  let totalFixed = 0;

  for (const je of voidedJEs) {
    const voidEntryNumber = `${je.entryNumber}-VOID`;
    const existingVoidLedger = await Ledger.findOne({
      companyId: je.companyId,
      journalEntryId: je._id,
      entryNumber: voidEntryNumber,
    }).lean();

    if (existingVoidLedger) continue; // Already has reversal entries

    const voidDate = je.voidedAt ?? new Date();
    const balanceMap = new Map<string, number>();
    const entriesToInsert: Omit<ILedger, "_id">[] = [];

    for (const line of je.lines) {
      const account = await Account.findById(line.accountId).lean();
      if (!account) {
        console.warn(
          `  [WARN] Account ${line.accountId} not found — skipping line in JE ${je.entryNumber}`,
        );
        continue;
      }

      const key = line.accountId.toString();
      if (!balanceMap.has(key)) {
        const prev = await getRunningBalance(
          je.companyId,
          line.accountId,
          voidDate,
        );
        balanceMap.set(key, prev);
      }

      let runningBalance = balanceMap.get(key)!;
      if (isDebitNormal(account.accountType)) {
        runningBalance += line.credit - line.debit;
      } else {
        runningBalance += line.debit - line.credit;
      }
      balanceMap.set(key, runningBalance);

      entriesToInsert.push({
        companyId: je.companyId,
        accountId: line.accountId,
        accountName: line.accountName,
        journalEntryId: je._id,
        entryNumber: voidEntryNumber,
        transactionDate: voidDate,
        description: `VOID: ${line.description || je.description}`,
        debit: line.credit.toString(),
        credit: line.debit.toString(),
        runningBalance,
      });
    }

    if (entriesToInsert.length === 0) continue;

    console.log(
      `\n[CASE A] JE ${je.entryNumber} (${je.description}) — ${entriesToInsert.length} reversal rows missing`,
    );
    for (const e of entriesToInsert) {
      console.log(
        `  ${dryRun ? "[DRY RUN] Would insert" : "Inserting"}: account=${e.accountName}, debit=${e.debit}, credit=${e.credit}, runningBalance=${e.runningBalance}`,
      );
    }

    if (!dryRun) {
      await Ledger.insertMany(entriesToInsert);
      console.log(`  ✓ Inserted ${entriesToInsert.length} ledger rows`);
    }
    totalFixed++;
  }

  return totalFixed;
}

// ─── Case B: REV-* Posted JEs missing ledger entries entirely ──────────────────

async function backfillCaseB(
  companyFilter: mongoose.Types.ObjectId | null,
  dryRun: boolean,
): Promise<number> {
  const query: any = {
    status: "POSTED",
    referenceNumber: { $regex: /^REV-/ },
  };
  if (companyFilter) query.companyId = companyFilter;

  const reversalJEs = await JournalEntry.find(query).lean();
  let totalFixed = 0;

  for (const je of reversalJEs) {
    const existingLedger = await Ledger.findOne({
      companyId: je.companyId,
      journalEntryId: je._id,
    }).lean();

    if (existingLedger) continue; // Already has ledger entries

    const balanceMap = new Map<string, number>();
    const entriesToInsert: Omit<ILedger, "_id">[] = [];

    for (const line of je.lines) {
      const account = await Account.findById(line.accountId).lean();
      if (!account) {
        console.warn(
          `  [WARN] Account ${line.accountId} not found — skipping line in JE ${je.entryNumber}`,
        );
        continue;
      }

      const key = line.accountId.toString();
      if (!balanceMap.has(key)) {
        const prev = await getRunningBalance(
          je.companyId,
          line.accountId,
          je.entryDate,
        );
        balanceMap.set(key, prev);
      }

      let runningBalance = balanceMap.get(key)!;
      if (isDebitNormal(account.accountType)) {
        runningBalance += line.debit - line.credit;
      } else {
        runningBalance += line.credit - line.debit;
      }
      balanceMap.set(key, runningBalance);

      entriesToInsert.push({
        companyId: je.companyId,
        accountId: line.accountId,
        accountName: line.accountName,
        journalEntryId: je._id,
        entryNumber: je.entryNumber,
        transactionDate: je.entryDate,
        description: line.description ?? je.description,
        debit: line.debit.toString(),
        credit: line.credit.toString(),
        runningBalance,
      });
    }

    if (entriesToInsert.length === 0) continue;

    console.log(
      `\n[CASE B] JE ${je.entryNumber} (${je.description}) — ${entriesToInsert.length} ledger rows missing`,
    );
    for (const e of entriesToInsert) {
      console.log(
        `  ${dryRun ? "[DRY RUN] Would insert" : "Inserting"}: account=${e.accountName}, debit=${e.debit}, credit=${e.credit}, runningBalance=${e.runningBalance}`,
      );
    }

    if (!dryRun) {
      await Ledger.insertMany(entriesToInsert);
      console.log(`  ✓ Inserted ${entriesToInsert.length} ledger rows`);
    }
    totalFixed++;
  }

  return totalFixed;
}

// ─── Main ────────────────────────────────────────────────────────────────────────

async function main() {
  const dryRun = !process.argv.includes("--apply");
  const companyArg = process.argv
    .find((a) => a.startsWith("--companyId="))
    ?.split("=")[1];
  const companyFilter = companyArg
    ? new mongoose.Types.ObjectId(companyArg)
    : null;

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("Error: MONGODB_URI environment variable is not set.");
    process.exit(1);
  }

  console.log("=".repeat(60));
  console.log("  Void Ledger Backfill");
  console.log(
    `  Mode    : ${dryRun ? "DRY RUN (no writes)" : "⚠ APPLY — writing to database"}`,
  );
  console.log(`  Company : ${companyFilter ?? "all companies"}`);
  console.log("=".repeat(60));

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB\n");

  const fixedA = await backfillCaseA(companyFilter, dryRun);
  const fixedB = await backfillCaseB(companyFilter, dryRun);

  console.log("\n" + "=".repeat(60));
  console.log(
    `  Case A (VOID JEs missing reversal rows) : ${fixedA} JE(s) ${dryRun ? "would be fixed" : "fixed"}`,
  );
  console.log(
    `  Case B (REV-* JEs missing ledger rows)  : ${fixedB} JE(s) ${dryRun ? "would be fixed" : "fixed"}`,
  );
  if (dryRun) {
    console.log("\n  Run with --apply to write these changes to the database.");
  }
  console.log("=".repeat(60));

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
