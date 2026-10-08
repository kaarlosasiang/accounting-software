import mongoose from "mongoose";

import Account from "../../models/Account.js";
import { Bill } from "../../models/Bill.js";
import { Invoice } from "../../models/Invoice.js";
import { Ledger } from "../../models/Ledger.js";
import { OPEN_DOCUMENT_STATUSES } from "../../shared/helpers/documentTotals.js";
import { round2 } from "../../shared/helpers/money.js";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Revenue and expense per calendar month from the ledger (accrual basis,
 * same source as the income statement; closing entries excluded).
 */
async function monthlyRevenueExpenses(
  companyId: mongoose.Types.ObjectId,
  start: Date,
  end: Date,
) {
  const rows = await Ledger.aggregate([
    {
      $match: {
        companyId,
        transactionDate: { $gte: start, $lte: end },
        isClosingEntry: { $ne: true },
      },
    },
    {
      $lookup: {
        from: "accounts",
        localField: "accountId",
        foreignField: "_id",
        as: "account",
        pipeline: [{ $project: { accountType: 1 } }],
      },
    },
    { $unwind: "$account" },
    { $match: { "account.accountType": { $in: ["Revenue", "Expense"] } } },
    {
      $group: {
        _id: {
          month: { $month: "$transactionDate" },
          type: "$account.accountType",
        },
        debit: { $sum: { $toDouble: "$debit" } },
        credit: { $sum: { $toDouble: "$credit" } },
      },
    },
  ]);

  const revenue: Record<number, number> = {};
  const expenses: Record<number, number> = {};
  for (const row of rows) {
    if (row._id.type === "Revenue") {
      revenue[row._id.month] = round2(row.credit - row.debit);
    } else {
      expenses[row._id.month] = round2(row.debit - row.credit);
    }
  }

  return MONTH_NAMES.map((month, idx) => {
    const r = revenue[idx + 1] ?? 0;
    const e = expenses[idx + 1] ?? 0;
    return { month, revenue: r, expenses: e, profit: round2(r - e) };
  });
}

/** Open (posted, unpaid) documents summary. */
async function outstandingSummary(
  model: typeof Invoice | typeof Bill,
  companyId: mongoose.Types.ObjectId,
) {
  const [agg] = await (model as any).aggregate([
    {
      $match: {
        companyId,
        status: { $in: OPEN_DOCUMENT_STATUSES },
      },
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        totalBalance: { $sum: "$balanceDue" },
        overdueCount: {
          $sum: {
            $cond: [{ $lt: ["$dueDate", new Date()] }, 1, 0],
          },
        },
      },
    },
  ]);

  return {
    count: agg?.count ?? 0,
    totalBalance: round2(agg?.totalBalance ?? 0),
    overdueCount: agg?.overdueCount ?? 0,
  };
}

/**
 * Top revenue/expense accounts by net amount for a period.
 */
async function categoryBreakdown(
  companyId: mongoose.Types.ObjectId,
  start: Date,
  end: Date,
  accountType: "Revenue" | "Expense",
) {
  const rows = await Ledger.aggregate([
    {
      $match: {
        companyId,
        transactionDate: { $gte: start, $lte: end },
        isClosingEntry: { $ne: true },
      },
    },
    {
      $lookup: {
        from: "accounts",
        localField: "accountId",
        foreignField: "_id",
        as: "account",
        pipeline: [{ $project: { accountType: 1, accountName: 1 } }],
      },
    },
    { $unwind: "$account" },
    { $match: { "account.accountType": accountType } },
    {
      $group: {
        _id: "$account.accountName",
        debit: { $sum: { $toDouble: "$debit" } },
        credit: { $sum: { $toDouble: "$credit" } },
      },
    },
  ]);

  return rows
    .map((row) => ({
      category: row._id as string,
      amount: round2(
        accountType === "Revenue"
          ? row.credit - row.debit
          : row.debit - row.credit,
      ),
    }))
    .filter((row) => row.amount !== 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);
}

/**
 * Dashboard Service
 * Aggregates KPI data for the overview dashboard.
 */
export const dashboardService = {
  /**
   * Get overview data for a company dashboard.
   * Returns KPIs, recent ledger transactions, and 12-month trend.
   */
  async getOverview(companyId: string) {
    const cId = new mongoose.Types.ObjectId(companyId);
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    const [
      monthlyTrend,
      capitalAccounts,
      outstandingInvoices,
      outstandingBills,
      recentLedgerEntries,
    ] = await Promise.all([
      monthlyRevenueExpenses(cId, startOfYear, endOfYear),
      // Contribution-style equity accounts only (excludes retained earnings,
      // current-year earnings and drawings).
      Account.find({
        companyId: cId,
        accountType: "Equity",
        normalBalance: "Credit",
        subType: { $in: ["Owner's Equity", "Share Capital"] },
      })
        .select("_id")
        .lean(),
      outstandingSummary(Invoice, cId),
      outstandingSummary(Bill, cId),
      Ledger.find({ companyId: cId })
        .sort({ transactionDate: -1, createdAt: -1 })
        .limit(10)
        .populate<{
          accountId: { accountName: string; accountCode: string };
        }>("accountId", "accountName accountCode")
        .lean(),
    ]);

    // ── Revenue / expenses (accrual, from the ledger) ───────────────────────
    const thisMonth = monthlyTrend[now.getMonth()];
    const ytdRevenue = round2(
      monthlyTrend.reduce((sum, m) => sum + m.revenue, 0),
    );
    const ytdExpenses = round2(
      monthlyTrend.reduce((sum, m) => sum + m.expenses, 0),
    );
    const monthRevenue = thisMonth.revenue;
    const monthExpenses = thisMonth.expenses;
    const ytdProfit = round2(ytdRevenue - ytdExpenses);
    const monthProfit = round2(monthRevenue - monthExpenses);

    // ── Owner capital contributions (ROI denominator) ───────────────────────
    const capitalAccountIds = capitalAccounts.map((account) => account._id);
    const [capital] =
      capitalAccountIds.length > 0
        ? await Ledger.aggregate([
            {
              $match: {
                companyId: cId,
                accountId: { $in: capitalAccountIds },
              },
            },
            {
              $group: {
                _id: null,
                totalDebit: { $sum: { $toDouble: "$debit" } },
                totalCredit: { $sum: { $toDouble: "$credit" } },
              },
            },
          ])
        : [];

    const totalOwnerCapitalContributions = round2(
      (capital?.totalCredit ?? 0) - (capital?.totalDebit ?? 0),
    );
    const ytdRoi =
      totalOwnerCapitalContributions > 0
        ? round2((ytdProfit / totalOwnerCapitalContributions) * 100)
        : null;

    const recentTransactions = recentLedgerEntries.map((entry) => {
      const debit = Number(entry.debit) || 0;
      const credit = Number(entry.credit) || 0;
      return {
        _id: entry._id,
        date: entry.transactionDate,
        description: entry.description,
        accountName: (entry.accountId as any)?.accountName ?? "Unknown Account",
        accountCode: (entry.accountId as any)?.accountCode ?? "",
        debit,
        credit,
        type: debit > 0 ? "Debit" : "Credit",
      };
    });

    return {
      kpis: {
        ytdRevenue,
        monthRevenue,
        ytdExpenses,
        monthExpenses,
        ytdProfit,
        monthProfit,
        totalOwnerCapitalContributions,
        ytdRoi,
      },
      outstandingInvoices,
      outstandingBills,
      recentTransactions,
      monthlyTrend,
    };
  },

  /**
   * Get analytics data for a company, optionally filtered by year.
   * Returns monthly revenue/expense trend plus per-account breakdowns from
   * the ledger.
   */
  async getAnalytics(companyId: string, year?: number) {
    const cId = new mongoose.Types.ObjectId(companyId);
    const targetYear = year ?? new Date().getFullYear();
    const startOfYear = new Date(targetYear, 0, 1);
    const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59, 999);

    const [monthlyTrend, revenueByCategory, expenseByCategory] =
      await Promise.all([
        monthlyRevenueExpenses(cId, startOfYear, endOfYear),
        categoryBreakdown(cId, startOfYear, endOfYear, "Revenue"),
        categoryBreakdown(cId, startOfYear, endOfYear, "Expense"),
      ]);

    return {
      year: targetYear,
      monthlyTrend,
      revenueByCategory,
      expenseByCategory,
    };
  },
};
