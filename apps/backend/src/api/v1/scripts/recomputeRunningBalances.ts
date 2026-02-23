/**
 * Migration: Recompute all ledger running balances
 *
 * The journalEntryService.getAccountBalance used $lt (strict less-than) when
 * looking up the prior balance during posting. This means any two journal entries
 * on the SAME date would not see each other's ledger lines, causing running
 * balances to reset to 0 rather than accumulate properly.
 *
 * This script recomputes the correct running balance for every ledger entry
 * in chronological order (transactionDate ASC, createdAt ASC) and patches
 * them in-place.
 *
 * Run:
 *   MONGODB_URI=<uri> npx tsx src/api/v1/scripts/recomputeRunningBalances.ts
 */

import mongoose from "mongoose";
import Account from "../models/Account.js";
import { Ledger } from "../models/Ledger.js";

async function recompute() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("MONGODB_URI not set");

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB\n");

  const companies = await mongoose.connection
    .db!.collection("company")
    .find({}, { projection: { _id: 1, name: 1 } })
    .toArray();

  let totalFixed = 0;
  let totalChecked = 0;

  for (const company of companies) {
    const companyId = company._id.toString();
    console.log(`Processing company: ${company.name} (${companyId})`);

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
        totalChecked++;

        const debit = parseFloat(entry.debit?.toString() || "0");
        const credit = parseFloat(entry.credit?.toString() || "0");

        runningBalance += isDebitNormal ? debit - credit : credit - debit;

        const stored = parseFloat(entry.runningBalance?.toString() || "0");

        if (Math.abs(stored - runningBalance) > 0.01) {
          await Ledger.updateOne(
            { _id: entry._id },
            { $set: { runningBalance } },
          );
          console.log(
            `  Fixed: ${account.accountCode} ${account.accountName}` +
              ` | entry ${entry._id}` +
              ` | ${stored.toFixed(2)} → ${runningBalance.toFixed(2)}`,
          );
          totalFixed++;
        }
      }
    }
  }

  console.log(
    `\nDone. Checked ${totalChecked} entries, fixed ${totalFixed} running balance(s).`,
  );

  await mongoose.disconnect();
}

recompute().catch((err) => {
  console.error("Recompute failed:", err);
  process.exit(1);
});
