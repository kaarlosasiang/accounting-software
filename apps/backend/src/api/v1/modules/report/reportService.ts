import mongoose from "mongoose";

import logger from "../../config/logger.js";
import Account from "../../models/Account.js";
import { Bill } from "../../models/Bill.js";
import { CompanySettings } from "../../models/CompanySettings.js";
import { Invoice } from "../../models/Invoice.js";
import { OPEN_DOCUMENT_STATUSES } from "../../shared/helpers/documentTotals.js";
import { round2, sumMoney } from "../../shared/helpers/money.js";
import { ledgerService, normalBalance } from "../ledger/ledgerService.js";

type LeanAccount = {
  _id: mongoose.Types.ObjectId;
  accountCode: string;
  accountName: string;
  accountType: string;
  subType?: string;
  normalBalance?: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const CASH_SUBTYPES = ["Cash", "Bank"];
const CASH_CODES = ["1000", "1010", "1020"];
const EARNINGS_SUBTYPES = ["Retained Earnings", "Current Year Earnings"];

const isCashAccount = (a: LeanAccount) =>
  a.accountType === "Asset" &&
  (CASH_CODES.includes(a.accountCode) ||
    CASH_SUBTYPES.includes(a.subType ?? "") ||
    /^(cash|petty cash|cash on hand|cash in bank)\b/i.test(a.accountName));

/** Working-capital assets (current) vs. long-lived assets. */
const isCurrentAsset = (a: LeanAccount) =>
  a.accountType === "Asset" &&
  (a.subType?.includes("Current") ||
    /receivable|inventory|prepaid|input (tax|vat)|advances/i.test(
      `${a.subType ?? ""} ${a.accountName}`,
    ));

const toLine = (a: LeanAccount, balance: number) => ({
  accountCode: a.accountCode,
  accountName: a.accountName,
  balance,
});

/**
 * Start of the fiscal year containing `date`, from the company's
 * `fiscalYearEnd` setting ("MM-DD", default "12-31").
 */
async function getFiscalYearStart(
  companyId: string,
  date: Date,
): Promise<Date> {
  const settings = await CompanySettings.findOne({ companyId })
    .select("accounting.fiscalYearEnd")
    .lean();
  const fyEnd = (settings as any)?.accounting?.fiscalYearEnd ?? "12-31";
  const [month, day] = String(fyEnd)
    .split("-")
    .map((v: string) => parseInt(v, 10));

  const endOfFiscalYear = (year: number) =>
    new Date(year, (month || 12) - 1, day || 31, 23, 59, 59, 999);

  const thisYearEnd = endOfFiscalYear(date.getFullYear());
  const previousEnd =
    date <= thisYearEnd ? endOfFiscalYear(date.getFullYear() - 1) : thisYearEnd;

  return new Date(previousEnd.getTime() + 1);
}

/**
 * Report Service
 * Financial statements are derived from the ledger with a single grouped
 * aggregate per query window. Balances use the account type's normal
 * direction (Asset/Expense: debit−credit, others: credit−debit), so contra
 * accounts (accumulated depreciation, sales discounts, drawings...) are
 * negative and net against their section automatically.
 */
export const reportService = {
  /**
   * Generate Balance Sheet as of a date.
   *
   * Equity = equity accounts + all earnings not yet closed to retained
   * earnings (cumulative revenue − expense up to the date). Closing entries
   * move amounts from revenue/expense into retained earnings, so the sum is
   * correct whether or not periods have been closed, and the statement
   * balances across fiscal years.
   */
  async generateBalanceSheet(companyId: string, asOfDate: Date = new Date()) {
    try {
      const accounts = (await Account.find({
        companyId: new mongoose.Types.ObjectId(companyId),
      })
        .sort({ accountCode: 1 })
        .lean()) as unknown as LeanAccount[];

      const fiscalYearStart = await getFiscalYearStart(companyId, asOfDate);

      const [balances, periodTotals] = await Promise.all([
        ledgerService.getBalancesByAccount(companyId, accounts, {
          to: asOfDate,
        }),
        // Current fiscal year activity (incl. closing entries) to split
        // unclosed earnings into prior years vs. current year.
        ledgerService.getTotalsByAccount(companyId, {
          from: fiscalYearStart,
          to: asOfDate,
        }),
      ]);

      const balanceOf = (a: LeanAccount) => balances.get(a._id.toString()) ?? 0;

      const assets = accounts.filter((a) => a.accountType === "Asset");
      const liabilities = accounts.filter((a) => a.accountType === "Liability");
      const equity = accounts.filter((a) => a.accountType === "Equity");
      const revenue = accounts.filter((a) => a.accountType === "Revenue");
      const expenses = accounts.filter((a) => a.accountType === "Expense");

      const nonZero = (a: LeanAccount) => balanceOf(a) !== 0;

      const currentAssets = assets
        .filter((a) => a.subType?.includes("Current"))
        .map((a) => toLine(a, balanceOf(a)));
      const fixedAssets = assets
        .filter((a) => a.subType?.includes("Fixed"))
        .map((a) => toLine(a, balanceOf(a)));
      const otherAssets = assets
        .filter(
          (a) =>
            !a.subType?.includes("Current") && !a.subType?.includes("Fixed"),
        )
        .filter(nonZero)
        .map((a) => toLine(a, balanceOf(a)));

      const currentLiabilities = liabilities
        .filter((a) => a.subType?.includes("Current"))
        .map((a) => toLine(a, balanceOf(a)));
      const longTermLiabilities = liabilities
        .filter((a) => a.subType?.includes("Long-term"))
        .map((a) => toLine(a, balanceOf(a)));
      const otherLiabilities = liabilities
        .filter(
          (a) =>
            !a.subType?.includes("Current") &&
            !a.subType?.includes("Long-term"),
        )
        .filter(nonZero)
        .map((a) => toLine(a, balanceOf(a)));

      const equityAccounts = equity.map((a) => ({
        ...toLine(a, balanceOf(a)),
        subType: a.subType,
      }));

      // Unclosed earnings since inception, and the current-year portion.
      const unclosedEarnings = round2(
        sumMoney(revenue.map(balanceOf)) - sumMoney(expenses.map(balanceOf)),
      );
      const periodNet = (list: LeanAccount[]) =>
        sumMoney(
          list.map((a) => {
            const t = periodTotals.get(a._id.toString());
            return t ? normalBalance(a.accountType, t.debit, t.credit) : 0;
          }),
        );
      // Closing entries inside the current year move earnings out of P&L
      // accounts; netting them in keeps this the *unclosed* current-year part.
      const currentYearNetIncome = round2(
        periodNet(revenue) - periodNet(expenses),
      );
      const priorYearsUnclosedEarnings = round2(
        unclosedEarnings - currentYearNetIncome,
      );

      const totalAssets = sumMoney(assets.map(balanceOf));
      const totalLiabilities = sumMoney(liabilities.map(balanceOf));
      const postedEquity = sumMoney(equity.map(balanceOf));
      const totalEquity = round2(postedEquity + unclosedEarnings);

      const difference = round2(totalAssets - (totalLiabilities + totalEquity));

      return {
        asOfDate,
        fiscalYearStart,
        assets: {
          currentAssets,
          fixedAssets,
          otherAssets,
          total: totalAssets,
        },
        liabilities: {
          currentLiabilities,
          longTermLiabilities,
          otherLiabilities,
          total: totalLiabilities,
        },
        equity: {
          accounts: equityAccounts,
          priorYearsUnclosedEarnings,
          currentYearNetIncome,
          total: totalEquity,
        },
        balanced: Math.abs(difference) < 0.01,
        equation: {
          assets: totalAssets,
          liabilities: totalLiabilities,
          equity: totalEquity,
          difference,
        },
      };
    } catch (error) {
      logger.logError(error as Error, {
        operation: "generate-balance-sheet",
        companyId,
      });
      throw error;
    }
  },

  /**
   * Generate Income Statement (Profit & Loss) for a period.
   * Closing entries are excluded, otherwise a closed period would show a
   * net income of zero.
   */
  async generateIncomeStatement(
    companyId: string,
    startDate: Date,
    endDate: Date,
  ) {
    try {
      const accounts = (await Account.find({
        companyId: new mongoose.Types.ObjectId(companyId),
        accountType: { $in: ["Revenue", "Expense"] },
      })
        .sort({ accountCode: 1 })
        .lean()) as unknown as LeanAccount[];

      const balances = await ledgerService.getBalancesByAccount(
        companyId,
        accounts,
        { from: startDate, to: endDate, excludeClosing: true },
      );

      const withAmounts = accounts.map((account) => ({
        accountCode: account.accountCode,
        accountName: account.accountName,
        accountType: account.accountType,
        subType: account.subType,
        amount: balances.get(account._id.toString()) ?? 0,
      }));

      const revenueWithAmounts = withAmounts.filter(
        (a) => a.accountType === "Revenue",
      );
      const expenseWithAmounts = withAmounts.filter(
        (a) => a.accountType === "Expense",
      );

      // Contra revenue (Sales Discounts, Returns & Allowances) carries
      // a negative amount and is presented separately.
      const contraRevenue = revenueWithAmounts.filter((r) =>
        r.subType?.includes("Contra Revenue"),
      );
      const otherIncome = revenueWithAmounts.filter(
        (r) =>
          !r.subType?.includes("Contra Revenue") &&
          (r.subType?.includes("Other") || r.subType?.includes("Interest")),
      );
      // Everything else is operating revenue (unclassified accounts included,
      // so subtotals always add up to the total).
      const operatingRevenue = revenueWithAmounts.filter(
        (r) => !contraRevenue.includes(r) && !otherIncome.includes(r),
      );

      const costOfSales = expenseWithAmounts.filter((e) =>
        e.subType?.includes("Cost of Sales"),
      );
      const nonOperatingExpenses = expenseWithAmounts.filter(
        (e) =>
          e.subType?.includes("Non-Operating") ||
          e.subType?.includes("Tax Expense"),
      );
      const operatingExpenses = expenseWithAmounts.filter(
        (e) => !costOfSales.includes(e) && !nonOperatingExpenses.includes(e),
      );

      const total = (list: { amount: number }[]) =>
        sumMoney(list.map((x) => x.amount));

      const totalRevenue = total(revenueWithAmounts);
      const totalExpenses = total(expenseWithAmounts);
      const netIncome = round2(totalRevenue - totalExpenses);

      const grossRevenue = total(operatingRevenue);
      const totalContraRevenue = total(contraRevenue);
      const netRevenue = round2(grossRevenue + totalContraRevenue);
      const totalCostOfSales = total(costOfSales);
      const grossProfit = round2(netRevenue - totalCostOfSales);
      const totalOperatingExpenses = total(operatingExpenses);
      const operatingIncome = round2(grossProfit - totalOperatingExpenses);
      const totalOtherIncome = total(otherIncome);
      const totalNonOperatingExpenses = total(nonOperatingExpenses);

      const strip = (list: typeof withAmounts) =>
        list.map(({ accountType: _t, ...rest }) => rest);

      return {
        period: { startDate, endDate },
        revenue: {
          operatingRevenue: strip(operatingRevenue),
          contraRevenue: strip(contraRevenue),
          otherIncome: strip(otherIncome),
          total: totalRevenue,
        },
        expenses: {
          costOfSales: strip(costOfSales),
          operatingExpenses: strip(operatingExpenses),
          nonOperatingExpenses: strip(nonOperatingExpenses),
          total: totalExpenses,
        },
        summary: {
          grossRevenue,
          contraRevenue: totalContraRevenue,
          netRevenue,
          costOfSales: totalCostOfSales,
          grossProfit,
          operatingExpenses: totalOperatingExpenses,
          operatingIncome,
          otherIncome: totalOtherIncome,
          nonOperatingExpenses: totalNonOperatingExpenses,
          netIncome,
        },
      };
    } catch (error) {
      logger.logError(error as Error, {
        operation: "generate-income-statement",
        companyId,
      });
      throw error;
    }
  },

  /**
   * Generate Cash Flow Statement (indirect method).
   *
   * Every non-cash balance sheet account is classified, so
   * beginning cash + net cash flow = ending cash by construction:
   *   operating  = net income + Δ(current liabilities) − Δ(non-cash current
   *                assets) + non-cash expenses (depreciation via the change
   *                in contra fixed-asset accounts)
   *   investing  = −Δ(fixed / non-current assets)
   *   financing  = Δ(long-term liabilities) + Δ(equity, excluding earnings)
   */
  async generateCashFlowStatement(
    companyId: string,
    startDate: Date,
    endDate: Date,
  ) {
    try {
      const accounts = (await Account.find({
        companyId: new mongoose.Types.ObjectId(companyId),
      })
        .sort({ accountCode: 1 })
        .lean()) as unknown as LeanAccount[];

      const beginningCutoff = new Date(startDate.getTime() - 1);

      const [incomeStatement, openingBalances, closingBalances] =
        await Promise.all([
          this.generateIncomeStatement(companyId, startDate, endDate),
          ledgerService.getBalancesByAccount(companyId, accounts, {
            to: beginningCutoff,
          }),
          ledgerService.getBalancesByAccount(companyId, accounts, {
            to: endDate,
          }),
        ]);
      const netIncome = incomeStatement.summary.netIncome;

      const change = (a: LeanAccount) =>
        round2(
          (closingBalances.get(a._id.toString()) ?? 0) -
            (openingBalances.get(a._id.toString()) ?? 0),
        );

      const cashAccounts = accounts.filter(isCashAccount);
      const nonCash = accounts.filter((a) => !isCashAccount(a));

      // Operating: working capital (current assets/liabilities)
      const workingCapital = nonCash.filter(
        (a) =>
          isCurrentAsset(a) ||
          (a.accountType === "Liability" && !a.subType?.includes("Long-term")),
      );
      const adjustments = workingCapital
        .map((a) => {
          const delta = change(a);
          // Asset increase uses cash; liability increase provides cash.
          const cashEffect = a.accountType === "Asset" ? -delta : delta;
          return {
            accountName: a.accountName,
            accountCode: a.accountCode,
            change: delta,
            cashEffect,
          };
        })
        .filter((a) => a.change !== 0);

      // Non-current assets. Contra accounts (e.g. accumulated depreciation)
      // have a credit normal balance; their increase is a non-cash expense
      // added back under operating activities.
      const nonCurrentAssets = nonCash.filter(
        (a) => a.accountType === "Asset" && !isCurrentAsset(a),
      );
      const contraNonCurrent = nonCurrentAssets.filter(
        (a) => a.normalBalance === "Credit",
      );
      const grossNonCurrent = nonCurrentAssets.filter(
        (a) => a.normalBalance !== "Credit",
      );

      // Contra balances are negative in asset terms; a more negative balance
      // (more accumulated depreciation) is an add-back.
      const depreciationAmortization = round2(
        -sumMoney(contraNonCurrent.map(change)),
      );

      const investingItems = grossNonCurrent
        .map((a) => {
          const delta = change(a);
          return {
            accountName: a.accountName,
            accountCode: a.accountCode,
            change: delta,
            netCashEffect: round2(-delta),
          };
        })
        .filter((a) => a.change !== 0);

      const financingAccounts = nonCash.filter(
        (a) =>
          (a.accountType === "Liability" && a.subType?.includes("Long-term")) ||
          (a.accountType === "Equity" &&
            !EARNINGS_SUBTYPES.includes(a.subType ?? "") &&
            !/retained earnings|current year earnings/i.test(a.accountName)),
      );
      const financingItems = financingAccounts
        .map((a) => {
          const delta = change(a);
          return {
            accountName: a.accountName,
            accountCode: a.accountCode,
            change: delta,
            netCashEffect: delta,
          };
        })
        .filter((a) => a.change !== 0);

      const operatingCashFlow = round2(
        netIncome +
          depreciationAmortization +
          sumMoney(adjustments.map((a) => a.cashEffect)),
      );
      const investingCashFlow = sumMoney(
        investingItems.map((a) => a.netCashEffect),
      );
      const financingCashFlow = sumMoney(
        financingItems.map((a) => a.netCashEffect),
      );
      const netCashFlow = round2(
        operatingCashFlow + investingCashFlow + financingCashFlow,
      );

      const beginningCash = sumMoney(
        cashAccounts.map((a) => openingBalances.get(a._id.toString()) ?? 0),
      );
      const endingCash = sumMoney(
        cashAccounts.map((a) => closingBalances.get(a._id.toString()) ?? 0),
      );
      const calculatedEndingCash = round2(beginningCash + netCashFlow);

      return {
        period: { startDate, endDate },
        operatingActivities: {
          netIncome,
          depreciationAmortization,
          adjustments,
          total: operatingCashFlow,
        },
        investingActivities: {
          items: investingItems,
          total: investingCashFlow,
        },
        financingActivities: {
          items: financingItems,
          total: financingCashFlow,
        },
        summary: {
          netCashFlow,
          beginningCash,
          endingCash,
          calculatedEndingCash,
          reconciled: Math.abs(calculatedEndingCash - endingCash) < 0.01,
        },
      };
    } catch (error) {
      logger.logError(error as Error, {
        operation: "generate-cash-flow-statement",
        companyId,
      });
      throw error;
    }
  },

  /**
   * Generate Trial Balance
   */
  async generateTrialBalance(companyId: string, asOfDate?: Date) {
    try {
      return await ledgerService.getTrialBalance(companyId, asOfDate);
    } catch (error) {
      logger.logError(error as Error, {
        operation: "generate-trial-balance",
        companyId,
      });
      throw error;
    }
  },

  /**
   * Generate Accounts Receivable Aging Report
   * Open invoices (Sent, Partial, Overdue) bucketed by days past due.
   */
  async generateARAgingReport(companyId: string, asOfDate: Date = new Date()) {
    try {
      const invoices = await Invoice.find({
        companyId: new mongoose.Types.ObjectId(companyId),
        status: { $in: OPEN_DOCUMENT_STATUSES },
        balanceDue: { $gt: 0 },
        $or: [
          { invoiceDate: { $lte: asOfDate } },
          { invoiceDate: null, createdAt: { $lte: asOfDate } },
        ],
      })
        .populate("customerId", "customerName displayName email")
        .lean();

      const rows = invoices.map((invoice) => {
        const customer = invoice.customerId as any;
        return {
          partyId: customer?._id?.toString() || "unknown",
          partyName:
            customer?.displayName || customer?.customerName || "Unknown",
          item: {
            invoiceNumber: invoice.invoiceNumber,
            customerId: invoice.customerId,
            customerName:
              customer?.displayName || customer?.customerName || "Unknown",
            issueDate: invoice.invoiceDate,
            dueDate: invoice.dueDate,
            totalAmount: invoice.totalAmount,
            amountPaid: invoice.amountPaid || 0,
            balanceDue: invoice.balanceDue,
          },
          dueDate: invoice.dueDate,
          balanceDue: invoice.balanceDue,
        };
      });

      const { groups, grandTotals, count } = bucketAging(rows, asOfDate);

      return {
        asOfDate,
        customers: groups.map((g) => ({
          customerId: g.partyId,
          customerName: g.partyName,
          invoices: g.items,
          totals: g.totals,
        })),
        grandTotals,
        summary: {
          totalInvoices: count,
          totalCustomers: groups.length,
          totalOutstanding: grandTotals.total,
        },
      };
    } catch (error) {
      logger.logError(error as Error, {
        operation: "generate-ar-aging-report",
        companyId,
      });
      throw error;
    }
  },

  /**
   * Generate Accounts Payable Aging Report
   * Open bills (Sent, Partial, Overdue) bucketed by days past due.
   * (Previously filtered on a non-existent "Open" status, so unpaid bills
   * that had no payments never appeared.)
   */
  async generateAPAgingReport(companyId: string, asOfDate: Date = new Date()) {
    try {
      const bills = await Bill.find({
        companyId: new mongoose.Types.ObjectId(companyId),
        status: { $in: OPEN_DOCUMENT_STATUSES },
        balanceDue: { $gt: 0 },
        $or: [
          { billDate: { $lte: asOfDate } },
          { billDate: null, createdAt: { $lte: asOfDate } },
        ],
      })
        .populate("supplierId", "supplierName displayName email")
        .lean();

      const rows = bills.map((bill) => {
        const supplier = bill.supplierId as any;
        return {
          partyId: supplier?._id?.toString() || "unknown",
          partyName:
            supplier?.displayName || supplier?.supplierName || "Unknown",
          item: {
            billNumber: bill.billNumber,
            supplierId: bill.supplierId,
            supplierName:
              supplier?.displayName || supplier?.supplierName || "Unknown",
            billDate: (bill as any).billDate ?? bill.createdAt,
            dueDate: bill.dueDate,
            totalAmount: bill.totalAmount,
            amountPaid: bill.amountPaid || 0,
            balanceDue: bill.balanceDue,
          },
          dueDate: bill.dueDate,
          balanceDue: bill.balanceDue,
        };
      });

      const { groups, grandTotals, count } = bucketAging(rows, asOfDate);

      return {
        asOfDate,
        suppliers: groups.map((g) => ({
          supplierId: g.partyId,
          supplierName: g.partyName,
          bills: g.items,
          totals: g.totals,
        })),
        grandTotals,
        summary: {
          totalBills: count,
          totalSuppliers: groups.length,
          totalOutstanding: grandTotals.total,
        },
      };
    } catch (error) {
      logger.logError(error as Error, {
        operation: "generate-ap-aging-report",
        companyId,
      });
      throw error;
    }
  },
};

type AgeBucket = "Current" | "1-30" | "31-60" | "61-90" | "90+";

interface AgingTotals {
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  days90plus: number;
  total: number;
}

const emptyTotals = (): AgingTotals => ({
  current: 0,
  days1to30: 0,
  days31to60: 0,
  days61to90: 0,
  days90plus: 0,
  total: 0,
});

const BUCKET_FIELD: Record<AgeBucket, keyof AgingTotals> = {
  Current: "current",
  "1-30": "days1to30",
  "31-60": "days31to60",
  "61-90": "days61to90",
  "90+": "days90plus",
};

/**
 * Shared AR/AP aging: bucket rows by days past due and group by party.
 */
function bucketAging<T extends Record<string, unknown>>(
  rows: Array<{
    partyId: string;
    partyName: string;
    item: T;
    dueDate: Date;
    balanceDue: number;
  }>,
  asOfDate: Date,
) {
  const groups = new Map<
    string,
    {
      partyId: string;
      partyName: string;
      items: Array<T & { daysOverdue: number; ageBucket: AgeBucket }>;
      totals: AgingTotals;
    }
  >();
  const grandTotals = emptyTotals();

  for (const row of rows) {
    const daysOverdue = Math.floor(
      (asOfDate.getTime() - new Date(row.dueDate).getTime()) / DAY_MS,
    );
    const ageBucket: AgeBucket =
      daysOverdue <= 0
        ? "Current"
        : daysOverdue <= 30
          ? "1-30"
          : daysOverdue <= 60
            ? "31-60"
            : daysOverdue <= 90
              ? "61-90"
              : "90+";

    if (!groups.has(row.partyId)) {
      groups.set(row.partyId, {
        partyId: row.partyId,
        partyName: row.partyName,
        items: [],
        totals: emptyTotals(),
      });
    }
    const group = groups.get(row.partyId)!;
    group.items.push({ ...row.item, daysOverdue, ageBucket });

    const field = BUCKET_FIELD[ageBucket];
    group.totals[field] = round2(group.totals[field] + row.balanceDue);
    group.totals.total = round2(group.totals.total + row.balanceDue);
    grandTotals[field] = round2(grandTotals[field] + row.balanceDue);
    grandTotals.total = round2(grandTotals.total + row.balanceDue);
  }

  return {
    groups: Array.from(groups.values()),
    grandTotals,
    count: rows.length,
  };
}
