/**
 * Migration: Fix Interest Expense (6910) subType
 *
 * Problem: Account 6910 "Interest Expense" was seeded with subType "Operating Expense".
 *          It should be "Non-Operating Expense" so it appears in the correct section of
 *          the Income Statement and is excluded from Operating Income.
 *
 * Run once: pnpm --filter backend tsx src/api/v1/scripts/migrateInterestExpenseSubType.ts
 */

import mongoose from "mongoose";
import Account from "../models/Account.js";

async function migrate() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error(
      "MONGODB_URI is not set. Export it before running this script.",
    );
  }

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");

  const result = await Account.updateMany(
    {
      accountCode: "6910",
      subType: "Operating Expense",
    },
    {
      $set: { subType: "Non-Operating Expense" },
    },
  );

  console.log(
    `Updated ${result.modifiedCount} account(s): 6910 Interest Expense → subType "Non-Operating Expense"`,
  );

  await mongoose.disconnect();
  console.log("Done.");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
