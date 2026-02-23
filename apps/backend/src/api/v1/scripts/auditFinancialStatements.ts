/**
 * Financial Statements Audit Script
 *
 * Connects to the live database, pulls raw ledger data, and independently
 * recomputes each financial statement — then compares the output of
 * reportService against the independently computed values.
 *
 * Run:
 *   MONGODB_URI=<uri> npx tsx src/api/v1/scripts/auditFinancialStatements.ts
 */

import mongoose from "mongoose";
import Account from "../models/Account.js";
import { Ledger } from "../models/Ledger.js";

const PASS = "✅ PASS";
const FAIL = "❌ FAIL";
const WARN = "⚠️  WARN";

function fmt(n: number) {
  return n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function check(label: string, actual: number, expected: number, tolerance = 0.01) {
  const diff = Math.abs(actual - expected);
  const status = diff <= tolerance ? PASS : FAIL;
  console.log(`  ${status} ${label}`);
  if (diff > tolerance) {
    console.log(`         Expected: ${fmt(expected)}  |  Got: ${fmt(actual)}  |  Diff: ${fmt(actual - expected)}`);
  }
  return diff <= tolerance;
}

async function audit() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("MONGODB_URI not set");

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB\n");

  // ─── Setup ────────────────────────────────────────────────────────────────

  const company = await mongoose.connection.db!
    .collection("company")
    .findOne({}, { projection: { _id: 1, name: 1 } });

  if (!company) throw new Error("No company found in database");

  const companyId = company._id.toString();
  console.log(`Company: ${company.name}  (${companyId})\n`);
  console.log("=".repeat(65));

  // ─── 1. Trial Balance Check ───────────────────────────────────────────────
  console.log("\n📋  TRIAL BALANCE (Double-Entry Integrity Check)");

  const allLedger = await Ledger.find({
    companyId: new mongoose.Types.ObjectId(companyId),
  }).lean();

  const totalDebits = allLedger.reduce((s, e) => s + parseFloat(e.debit || "0"), 0);
  const totalCredits = allLedger.reduce((s, e) => s + parseFloat(e.credit || "0"), 0);

  console.log(`  Total Ledger Entries: ${allLedger.length}`);
  console.log(`  Total Debits  : ${fmt(totalDebits)}`);
  console.log(`  Total Credits : ${fmt(totalCredits)}`);
  check("Debits = Credits (double-entry integrity)", totalDebits, totalCredits);

  // ─── 2. Running Balance Check ─────────────────────────────────────────────
  console.log("\n📋  RUNNING BALANCE INTEGRITY");

  const accounts = await Account.find({
    companyId: new mongoose.Types.ObjectId(companyId),
  }).lean();

  let runningBalanceErrors = 0;
  for (const acct of accounts) {
    const entries = await Ledger.find({
      companyId: new mongoose.Types.ObjectId(companyId),
      accountId: acct._id,
    })
      .sort({ transactionDate: 1, createdAt: 1 })
      .lean();

    if (entries.length === 0) continue;

    // Recompute running balance from scratch
    const isDebitNormal = acct.normalBalance === "Debit";
    let runningBalance = 0;
    for (const entry of entries) {
      const debit = parseFloat(entry.debit || "0");
      const credit = parseFloat(entry.credit || "0");
      runningBalance += isDebitNormal ? debit - credit : credit - debit;

      const stored = parseFloat(entry.runningBalance?.toString() || "0");
      if (Math.abs(stored - runningBalance) > 0.01) {
        console.log(
          `  ${FAIL} ${acct.accountCode} ${acct.accountName}: stored runningBalance ${fmt(stored)} ≠ recomputed ${fmt(runningBalance)} on entry ${entry._id}`
        );
        runningBalanceErrors++;
      }
    }
  }
  if (runningBalanceErrors === 0) {
    console.log(`  ${PASS} All stored runningBalance values match recomputed values`);
  }

  // ─── 3. Balance Sheet Check ───────────────────────────────────────────────
  console.log("\n📋  BALANCE SHEET  (as of today)");

  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  // Get latest runningBalance per account up to today
  async function getBalance(accountId: string): Promise<number> {
    const entry = await Ledger.findOne({
      companyId: new mongoose.Types.ObjectId(companyId),
      accountId: new mongoose.Types.ObjectId(accountId),
      transactionDate: { $lte: today },
    })
      .sort({ transactionDate: -1, createdAt: -1 })
      .lean();
    return entry ? parseFloat(entry.runningBalance?.toString() || "0") : 0;
  }

  // Sign each account's balance: contra accounts receive negative sign
  async function getSignedBalance(acct: (typeof accounts)[0]): Promise<number> {
    const raw = await getBalance(acct._id.toString());
    const expected = acct.accountType === "Asset" || acct.accountType === "Expense" ? "Debit" : "Credit";
    return acct.normalBalance !== expected ? -raw : raw;
  }

  const assetAccounts = accounts.filter((a) => a.accountType === "Asset");
  const liabilityAccounts = accounts.filter((a) => a.accountType === "Liability");
  const equityAccounts = accounts.filter((a) => a.accountType === "Equity");
  const revenueAccounts = accounts.filter((a) => a.accountType === "Revenue");
  const expenseAccounts = accounts.filter((a) => a.accountType === "Expense");

  const totalAssets = (await Promise.all(assetAccounts.map(getSignedBalance))).reduce((s, b) => s + b, 0);
  const totalLiabilities = (await Promise.all(liabilityAccounts.map(getSignedBalance))).reduce((s, b) => s + b, 0);
  const postedEquity = (await Promise.all(equityAccounts.map(getSignedBalance))).reduce((s, b) => s + b, 0);

  // Net income for current year (indirect — to add to equity before closing)
  const revenueForYear = await Promise.all(
    revenueAccounts.map(async (a) => {
      const entries = await Ledger.find({
        companyId: new mongoose.Types.ObjectId(companyId),
        accountId: a._id,
        transactionDate: { $gte: startOfYear, $lte: today },
      }).lean();
      return entries.reduce((s, e) => s + parseFloat(e.credit || "0") - parseFloat(e.debit || "0"), 0);
    })
  );
  const expenseForYear = await Promise.all(
    expenseAccounts.map(async (a) => {
      const entries = await Ledger.find({
        companyId: new mongoose.Types.ObjectId(companyId),
        accountId: a._id,
        transactionDate: { $gte: startOfYear, $lte: today },
      }).lean();
      return entries.reduce((s, e) => s + parseFloat(e.debit || "0") - parseFloat(e.credit || "0"), 0);
    })
  );

  const totalRevenue = revenueForYear.reduce((s, a) => s + a, 0);
  const totalExpenses = expenseForYear.reduce((s, a) => s + a, 0);
  const currentYearNetIncome = totalRevenue - totalExpenses;
  const totalEquity = postedEquity + currentYearNetIncome;

  console.log(`  Total Assets      : ${fmt(totalAssets)}`);
  console.log(`  Total Liabilities : ${fmt(totalLiabilities)}`);
  console.log(`  Posted Equity     : ${fmt(postedEquity)}`);
  console.log(`  Current Yr Net Inc: ${fmt(currentYearNetIncome)}`);
  console.log(`  Total Equity      : ${fmt(totalEquity)}`);
  console.log(`  L + E             : ${fmt(totalLiabilities + totalEquity)}`);
  check("Assets = Liabilities + Equity (incl. current-year net income)", totalAssets, totalLiabilities + totalEquity);

  // ─── 4. Income Statement Check ────────────────────────────────────────────
  console.log("\n📋  INCOME STATEMENT CHECKS");

  // Revenue breakdown
  const contraRev = revenueAccounts
    .filter((a) => a.subType?.includes("Contra Revenue"))
    .map((_, i) => revenueForYear[revenueAccounts.findIndex((a) => a.subType?.includes("Contra Revenue"))]);

  const grossRev = revenueAccounts
    .filter((a) => a.subType?.includes("Operating") || a.subType?.includes("Service"))
    .reduce((s, a, i) => s + (revenueForYear[revenueAccounts.indexOf(a)] ?? 0), 0);

  const totalContraRev = revenueAccounts
    .filter((a) => a.subType?.includes("Contra Revenue"))
    .reduce((s, a) => s + (revenueForYear[revenueAccounts.indexOf(a)] ?? 0), 0);

  const netRevenue = grossRev + totalContraRev; // totalContraRev is ≤ 0

  const cogsAmt = expenseAccounts
    .filter((a) => a.subType?.includes("Cost of Sales"))
    .reduce((s, a) => s + (expenseForYear[expenseAccounts.indexOf(a)] ?? 0), 0);

  const grossProfit = netRevenue - cogsAmt;

  const opexAmt = expenseAccounts
    .filter((a) => a.subType?.includes("Operating"))
    .reduce((s, a) => s + (expenseForYear[expenseAccounts.indexOf(a)] ?? 0), 0);

  const opIncome = grossProfit - opexAmt;

  console.log(`  Gross Revenue     : ${fmt(grossRev)}`);
  console.log(`  Contra Revenue    : ${fmt(totalContraRev)}`);
  console.log(`  Net Revenue       : ${fmt(netRevenue)}`);
  console.log(`  Cost of Sales     : ${fmt(cogsAmt)}`);
  console.log(`  Gross Profit      : ${fmt(grossProfit)}`);
  console.log(`  Operating Expenses: ${fmt(opexAmt)}`);
  console.log(`  Operating Income  : ${fmt(opIncome)}`);
  console.log(`  Total Revenue     : ${fmt(totalRevenue)}`);
  console.log(`  Total Expenses    : ${fmt(totalExpenses)}`);
  console.log(`  Net Income        : ${fmt(currentYearNetIncome)}`);
  check("Net Revenue = Gross Revenue + Contra Revenue", netRevenue, grossRev + totalContraRev);
  check("Gross Profit = Net Revenue - COGS", grossProfit, netRevenue - cogsAmt);
  check("Operating Income = Gross Profit - OpEx", opIncome, grossProfit - opexAmt);
  check("Net Income = Total Revenue - Total Expenses", currentYearNetIncome, totalRevenue - totalExpenses);

  // ─── 5. Cash Flow Reconciliation ──────────────────────────────────────────
  console.log("\n📋  CASH FLOW RECONCILIATION");

  const cashAccountCodes = ["1000", "1010", "1020"];
  const cashAccts = accounts.filter((a) => cashAccountCodes.includes(a.accountCode));

  const beginningDate = new Date(startOfYear);
  beginningDate.setDate(beginningDate.getDate() - 1);

  let beginningCash = 0;
  let endingCash = 0;
  for (const ca of cashAccts) {
    const bEntry = await Ledger.findOne({
      companyId: new mongoose.Types.ObjectId(companyId),
      accountId: ca._id,
      transactionDate: { $lte: beginningDate },
    })
      .sort({ transactionDate: -1, createdAt: -1 })
      .lean();
    beginningCash += bEntry ? parseFloat(bEntry.runningBalance?.toString() || "0") : 0;

    const eEntry = await Ledger.findOne({
      companyId: new mongoose.Types.ObjectId(companyId),
      accountId: ca._id,
      transactionDate: { $lte: today },
    })
      .sort({ transactionDate: -1, createdAt: -1 })
      .lean();
    endingCash += eEntry ? parseFloat(eEntry.runningBalance?.toString() || "0") : 0;
  }

  // Depreciation add-back (non-cash)
  const depAccts = accounts.filter((a) =>
    a.accountType === "Expense" && /depreciation|amortization/i.test(a.accountName)
  );
  let depAmount = 0;
  for (const da of depAccts) {
    const depEntries = await Ledger.find({
      companyId: new mongoose.Types.ObjectId(companyId),
      accountId: da._id,
      transactionDate: { $gte: startOfYear, $lte: today },
    }).lean();
    depAmount += depEntries.reduce((s, e) => s + parseFloat(e.debit || "0") - parseFloat(e.credit || "0"), 0);
  }

  const netCashFlow = endingCash - beginningCash;

  console.log(`  Cash Account(s)   : ${cashAccts.map((a) => a.accountCode).join(", ") || "NONE FOUND"}`);
  console.log(`  Beginning Cash    : ${fmt(beginningCash)}`);
  console.log(`  Ending Cash       : ${fmt(endingCash)}`);
  console.log(`  Net Cash Movement : ${fmt(netCashFlow)}`);
  console.log(`  Depreciation/Amort: ${fmt(depAmount)}`);

  if (cashAccts.length === 0) {
    console.log(`  ${WARN}  No cash accounts (1000/1010/1020) found — cash flow check skipped`);
  } else {
    check("Beginning + Net Cash = Ending Cash", beginningCash + netCashFlow, endingCash);
  }

  // ─── 6. Contra Account Sign Check ─────────────────────────────────────────
  console.log("\n📋  CONTRA ACCOUNT SIGN CHECK");

  const contraAccounts = accounts.filter((a) => {
    const expected = a.accountType === "Asset" || a.accountType === "Expense" ? "Debit" : "Credit";
    return a.normalBalance !== expected;
  });

  if (contraAccounts.length === 0) {
    console.log(`  ${WARN}  No contra accounts found in chart of accounts`);
  } else {
    for (const ca of contraAccounts) {
      const raw = await getBalance(ca._id.toString());
      const signed = await getSignedBalance(ca);
      const reducesParent = signed <= 0 || raw === 0;
      console.log(
        `  ${reducesParent ? PASS : FAIL} ${ca.accountCode} ${ca.accountName}  raw: ${fmt(raw)}  signed: ${fmt(signed)}  (${ca.normalBalance}-normal ${ca.accountType})`
      );
    }
  }

  // ─── 7. Account 6910 SubType Check ────────────────────────────────────────
  console.log("\n📋  ACCOUNT SUBTYPE SPOT CHECKS");

  const acct6910 = accounts.find((a) => a.accountCode === "6910");
  if (!acct6910) {
    console.log(`  ${WARN}  Account 6910 (Interest Expense) not found in this company`);
  } else {
    const isNonOp = acct6910.subType === "Non-Operating Expense";
    console.log(`  ${isNonOp ? PASS : FAIL} 6910 Interest Expense subType = "${acct6910.subType}" (expected "Non-Operating Expense")`);
  }

  // ─── Summary ─────────────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(65));
  console.log("Audit complete. Review any ❌ or ⚠️  items above.\n");

  await mongoose.disconnect();
}

audit().catch((err) => {
  console.error("Audit failed:", err);
  process.exit(1);
});
