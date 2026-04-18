import mongoose from "mongoose";

import { Bill } from "../../models/Bill.js";
import { Invoice } from "../../models/Invoice.js";
import { Ledger } from "../../models/Ledger.js";

/**
 * Dashboard Service
 * Aggregates key business metrics for the dashboard overview.
 */
export const dashboardService = {
  /**
   * Get dashboard overview data for a company.
   * Returns KPIs, recent ledger transactions, and 12-month trend.
   */
  async getOverview(companyId: string) {
    const cId = new mongoose.Types.ObjectId(companyId);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // ── 1. Revenue (from paid/partial invoices) ──────────────────────────────
    const revenueAgg = await Invoice.aggregate([
      {
        $match: {
          companyId: cId,
          status: { $in: ["Paid", "Partial"] },
        },
      },
      {
        $group: {
          _id: null,
          ytdRevenue: { $sum: "$amountPaid" },
          monthRevenue: {
            $sum: {
              $cond: [{ $gte: ["$updatedAt", startOfMonth] }, "$amountPaid", 0],
            },
          },
        },
      },
    ]);

    const ytdRevenue = revenueAgg[0]?.ytdRevenue ?? 0;
    const monthRevenue = revenueAgg[0]?.monthRevenue ?? 0;

    // ── 2. Expenses (from paid/partial bills) ─────────────────────────────────
    const expenseAgg = await Bill.aggregate([
      {
        $match: {
          companyId: cId,
          status: { $in: ["Paid", "Partial"] },
        },
      },
      {
        $group: {
          _id: null,
          ytdExpenses: { $sum: "$amountPaid" },
          monthExpenses: {
            $sum: {
              $cond: [{ $gte: ["$updatedAt", startOfMonth] }, "$amountPaid", 0],
            },
          },
        },
      },
    ]);

    const ytdExpenses = expenseAgg[0]?.ytdExpenses ?? 0;
    const monthExpenses = expenseAgg[0]?.monthExpenses ?? 0;

    // ── 3. Outstanding invoices ───────────────────────────────────────────────
    const outstandingInvoicesAgg = await Invoice.aggregate([
      {
        $match: {
          companyId: cId,
          status: { $in: ["Sent", "Partial", "Overdue", "Draft"] },
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalBalance: { $sum: "$balanceDue" },
          overdueCount: {
            $sum: { $cond: [{ $eq: ["$status", "Overdue"] }, 1, 0] },
          },
        },
      },
    ]);

    const outstandingInvoices = {
      count: outstandingInvoicesAgg[0]?.count ?? 0,
      totalBalance: outstandingInvoicesAgg[0]?.totalBalance ?? 0,
      overdueCount: outstandingInvoicesAgg[0]?.overdueCount ?? 0,
    };

    // ── 4. Outstanding bills ──────────────────────────────────────────────────
    const outstandingBillsAgg = await Bill.aggregate([
      {
        $match: {
          companyId: cId,
          status: { $in: ["Approved", "Partial", "Overdue", "Draft"] },
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalBalance: { $sum: "$balanceDue" },
          overdueCount: {
            $sum: { $cond: [{ $eq: ["$status", "Overdue"] }, 1, 0] },
          },
        },
      },
    ]);

    const outstandingBills = {
      count: outstandingBillsAgg[0]?.count ?? 0,
      totalBalance: outstandingBillsAgg[0]?.totalBalance ?? 0,
      overdueCount: outstandingBillsAgg[0]?.overdueCount ?? 0,
    };

    // ── 5. Recent transactions (last 10 ledger entries) ───────────────────────
    const recentLedgerEntries = await Ledger.find({ companyId: cId })
      .sort({ transactionDate: -1, createdAt: -1 })
      .limit(10)
      .populate<{
        accountId: { accountName: string; accountCode: string };
      }>("accountId", "accountName accountCode")
      .lean();

    const recentTransactions = recentLedgerEntries.map((entry) => ({
      _id: entry._id,
      date: entry.transactionDate,
      description: entry.description,
      accountName: (entry.accountId as any)?.accountName ?? "Unknown Account",
      accountCode: (entry.accountId as any)?.accountCode ?? "",
      debit: entry.debit,
      credit: entry.credit,
      type: Number(entry.debit) > 0 ? "Debit" : "Credit",
    }));

    // ── 6. Monthly trend for current year (12 months) ────────────────────────
    const monthlyInvoices = await Invoice.aggregate([
      {
        $match: {
          companyId: cId,
          status: { $in: ["Paid", "Partial"] },
          updatedAt: { $gte: startOfYear },
        },
      },
      {
        $group: {
          _id: { $month: "$updatedAt" },
          revenue: { $sum: "$amountPaid" },
        },
      },
    ]);

    const monthlyBills = await Bill.aggregate([
      {
        $match: {
          companyId: cId,
          status: { $in: ["Paid", "Partial"] },
          updatedAt: { $gte: startOfYear },
        },
      },
      {
        $group: {
          _id: { $month: "$updatedAt" },
          expenses: { $sum: "$amountPaid" },
        },
      },
    ]);

    const monthNames = [
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

    // Build a map for fast lookup
    const revenueByMonth: Record<number, number> = {};
    for (const r of monthlyInvoices) revenueByMonth[r._id] = r.revenue;

    const expensesByMonth: Record<number, number> = {};
    for (const e of monthlyBills) expensesByMonth[e._id] = e.expenses;

    const monthlyTrend = monthNames.map((month, idx) => {
      const monthNum = idx + 1;
      const revenue = revenueByMonth[monthNum] ?? 0;
      const expenses = expensesByMonth[monthNum] ?? 0;
      return {
        month,
        revenue,
        expenses,
        profit: revenue - expenses,
      };
    });

    return {
      kpis: {
        ytdRevenue,
        monthRevenue,
        ytdExpenses,
        monthExpenses,
        ytdProfit: ytdRevenue - ytdExpenses,
        monthProfit: monthRevenue - monthExpenses,
      },
      outstandingInvoices,
      outstandingBills,
      recentTransactions,
      monthlyTrend,
    };
  },

  /**
   * Get analytics data for a company, optionally filtered by year.
   * Returns monthly revenue/expense trend plus per-account breakdowns from the ledger.
   */
  async getAnalytics(companyId: string, year?: number) {
    const cId = new mongoose.Types.ObjectId(companyId);
    const targetYear = year ?? new Date().getFullYear();
    const startOfYear = new Date(targetYear, 0, 1);
    const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59, 999);

    const monthNames = [
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

    // ── Monthly trend for the target year ────────────────────────────────────
    const monthlyInvoices = await Invoice.aggregate([
      {
        $match: {
          companyId: cId,
          status: { $in: ["Paid", "Partial"] },
          updatedAt: { $gte: startOfYear, $lte: endOfYear },
        },
      },
      {
        $group: {
          _id: { $month: "$updatedAt" },
          revenue: { $sum: "$amountPaid" },
        },
      },
    ]);

    const monthlyBills = await Bill.aggregate([
      {
        $match: {
          companyId: cId,
          status: { $in: ["Paid", "Partial"] },
          updatedAt: { $gte: startOfYear, $lte: endOfYear },
        },
      },
      {
        $group: {
          _id: { $month: "$updatedAt" },
          expenses: { $sum: "$amountPaid" },
        },
      },
    ]);

    const revenueByMonth: Record<number, number> = {};
    for (const r of monthlyInvoices) revenueByMonth[r._id] = r.revenue;

    const expensesByMonth: Record<number, number> = {};
    for (const e of monthlyBills) expensesByMonth[e._id] = e.expenses;

    const monthlyTrend = monthNames.map((month, idx) => {
      const monthNum = idx + 1;
      const revenue = revenueByMonth[monthNum] ?? 0;
      const expenses = expensesByMonth[monthNum] ?? 0;
      return { month, revenue, expenses, profit: revenue - expenses };
    });

    // ── Revenue by account category (Revenue accounts, credit ledger entries) ──
    const revenueByCategory = await Ledger.aggregate([
      {
        $match: {
          companyId: cId,
          transactionDate: { $gte: startOfYear, $lte: endOfYear },
          credit: { $gt: 0 },
        },
      },
      {
        $lookup: {
          from: "accounts",
          localField: "accountId",
          foreignField: "_id",
          as: "account",
        },
      },
      { $unwind: "$account" },
      { $match: { "account.accountType": "Revenue" } },
      {
        $group: {
          _id: "$account.accountName",
          amount: { $sum: "$credit" },
        },
      },
      { $project: { _id: 0, category: "$_id", amount: 1 } },
      { $sort: { amount: -1 } },
      { $limit: 10 },
    ]);

    // ── Expense by account category (Expense accounts, debit ledger entries) ───
    const expenseByCategory = await Ledger.aggregate([
      {
        $match: {
          companyId: cId,
          transactionDate: { $gte: startOfYear, $lte: endOfYear },
          debit: { $gt: 0 },
        },
      },
      {
        $lookup: {
          from: "accounts",
          localField: "accountId",
          foreignField: "_id",
          as: "account",
        },
      },
      { $unwind: "$account" },
      { $match: { "account.accountType": "Expense" } },
      {
        $group: {
          _id: "$account.accountName",
          amount: { $sum: "$debit" },
        },
      },
      { $project: { _id: 0, category: "$_id", amount: 1 } },
      { $sort: { amount: -1 } },
      { $limit: 10 },
    ]);

    return {
      year: targetYear,
      monthlyTrend,
      revenueByCategory,
      expenseByCategory,
    };
  },
};
