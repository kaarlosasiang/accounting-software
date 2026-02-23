import mongoose from "mongoose";
import Account from "../../models/Account.js";
import { Ledger } from "../../models/Ledger.js";
import { Invoice } from "../../models/Invoice.js";
import { Bill } from "../../models/Bill.js";
import { ledgerService } from "../ledger/ledgerService.js";
import logger from "../../config/logger.js";

/**
 * Report Service
 * Handles business logic for financial report generation
 */
export const reportService = {
  /**
   * Generate Balance Sheet
   * Shows: Assets = Liabilities + Equity at a specific date
   * Formula verification: Assets = Liabilities + Equity
   */
  async generateBalanceSheet(companyId: string, asOfDate: Date = new Date()) {
    try {
      // 1. Get all accounts for the company
      const accounts = await Account.find({
        companyId: new mongoose.Types.ObjectId(companyId),
      }).lean();

      // 2. For each account, get balance from Ledger
      const accountsWithBalances = await Promise.all(
        accounts.map(async (account) => {
          const balanceData = await ledgerService.getAccountBalance(
            companyId,
            account._id.toString(),
            asOfDate,
          );

          // Apply sign correction for contra accounts.
          // Assets & Expenses expect Debit normal balance; Liabilities, Equity & Revenue expect Credit.
          // If an account's normalBalance differs from the expected direction, negate the balance so
          // contra accounts reduce (rather than inflate) their parent group total.
          const expectedNormalBalance =
            account.accountType === "Asset" || account.accountType === "Expense"
              ? "Debit"
              : "Credit";
          const signedBalance =
            account.normalBalance !== expectedNormalBalance
              ? -balanceData.balance
              : balanceData.balance;

          return {
            ...account,
            balance: signedBalance,
          };
        }),
      );

      // 3. Group by account type
      const assets = accountsWithBalances.filter(
        (a) => a.accountType === "Asset",
      );
      const liabilities = accountsWithBalances.filter(
        (a) => a.accountType === "Liability",
      );
      const equity = accountsWithBalances.filter(
        (a) => a.accountType === "Equity",
      );

      // 4. Further group assets by subtype
      const currentAssets = assets
        .filter((a) => a.subType?.includes("Current"))
        .map((a) => ({
          accountCode: a.accountCode,
          accountName: a.accountName,
          balance: a.balance,
        }));

      const fixedAssets = assets
        .filter((a) => a.subType?.includes("Fixed"))
        .map((a) => ({
          accountCode: a.accountCode,
          accountName: a.accountName,
          balance: a.balance,
        }));

      const otherAssets = assets
        .filter(
          (a) =>
            !a.subType?.includes("Current") && !a.subType?.includes("Fixed"),
        )
        .map((a) => ({
          accountCode: a.accountCode,
          accountName: a.accountName,
          balance: a.balance,
        }));

      // 5. Group liabilities by subtype
      const currentLiabilities = liabilities
        .filter((a) => a.subType?.includes("Current"))
        .map((a) => ({
          accountCode: a.accountCode,
          accountName: a.accountName,
          balance: a.balance,
        }));

      const longTermLiabilities = liabilities
        .filter((a) => a.subType?.includes("Long-term"))
        .map((a) => ({
          accountCode: a.accountCode,
          accountName: a.accountName,
          balance: a.balance,
        }));

      const otherLiabilities = liabilities
        .filter(
          (a) =>
            !a.subType?.includes("Current") &&
            !a.subType?.includes("Long-term"),
        )
        .map((a) => ({
          accountCode: a.accountCode,
          accountName: a.accountName,
          balance: a.balance,
        }));

      // 6. Group equity accounts
      const equityAccounts = equity.map((a) => ({
        accountCode: a.accountCode,
        accountName: a.accountName,
        subType: a.subType,
        balance: a.balance,
      }));

      // 7. Compute current-period net income (not yet closed to retained earnings).
      //    This must be added to equity so the accounting equation holds during an
      //    active period before closing journal entries are posted.
      const startOfYear = new Date(asOfDate.getFullYear(), 0, 1);
      const currentYearIncome = await this.generateIncomeStatement(
        companyId,
        startOfYear,
        asOfDate,
      );
      const currentYearNetIncome = currentYearIncome.summary.netIncome;

      // 8. Calculate totals
      const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
      const totalLiabilities = liabilities.reduce(
        (sum, a) => sum + a.balance,
        0,
      );
      const postedEquity = equity.reduce((sum, a) => sum + a.balance, 0);
      // Add unposted current-year net income so equity reflects the full period
      const totalEquity = postedEquity + currentYearNetIncome;

      // 9. Verify accounting equation
      const balanced =
        Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;

      return {
        asOfDate,
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
          currentYearNetIncome,
          total: totalEquity,
        },
        balanced,
        equation: {
          assets: totalAssets,
          liabilities: totalLiabilities,
          equity: totalEquity,
          difference: totalAssets - (totalLiabilities + totalEquity),
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
   * Generate Income Statement (Profit & Loss)
   * Shows: Revenue - Expenses = Net Income for a period
   */
  async generateIncomeStatement(
    companyId: string,
    startDate: Date,
    endDate: Date,
  ) {
    try {
      // 1. Get Revenue accounts
      const revenueAccounts = await Account.find({
        companyId: new mongoose.Types.ObjectId(companyId),
        accountType: "Revenue",
      }).lean();

      // 2. Get Expense accounts
      const expenseAccounts = await Account.find({
        companyId: new mongoose.Types.ObjectId(companyId),
        accountType: "Expense",
      }).lean();

      // 3. Calculate revenue total from ledger entries
      const revenueWithAmounts = await Promise.all(
        revenueAccounts.map(async (account) => {
          const entries = await Ledger.find({
            companyId: new mongoose.Types.ObjectId(companyId),
            accountId: account._id,
            transactionDate: { $gte: startDate, $lte: endDate },
          }).lean();

          // Revenue has credit normal balance
          const total = entries.reduce((sum, entry) => {
            return sum + (parseFloat(entry.credit) - parseFloat(entry.debit));
          }, 0);

          return {
            accountCode: account.accountCode,
            accountName: account.accountName,
            subType: account.subType,
            amount: total,
          };
        }),
      );

      // 4. Calculate expense total from ledger entries
      const expenseWithAmounts = await Promise.all(
        expenseAccounts.map(async (account) => {
          const entries = await Ledger.find({
            companyId: new mongoose.Types.ObjectId(companyId),
            accountId: account._id,
            transactionDate: { $gte: startDate, $lte: endDate },
          }).lean();

          // Expense has debit normal balance
          const total = entries.reduce((sum, entry) => {
            return sum + (parseFloat(entry.debit) - parseFloat(entry.credit));
          }, 0);

          return {
            accountCode: account.accountCode,
            accountName: account.accountName,
            subType: account.subType,
            amount: total,
          };
        }),
      );

      // 5. Group revenue by subtype
      const operatingRevenue = revenueWithAmounts.filter(
        (r) =>
          r.subType?.includes("Operating") || r.subType?.includes("Service"),
      );
      const otherIncome = revenueWithAmounts.filter(
        (r) => r.subType?.includes("Other") || r.subType?.includes("Interest"),
      );
      // Contra Revenue (Sales Discounts, Returns & Allowances) are debit-normal so their
      // computed amounts will be ≤ 0. Surface them separately for a clean P&L presentation.
      const contraRevenue = revenueWithAmounts.filter((r) =>
        r.subType?.includes("Contra Revenue"),
      );

      // 6. Group expenses by subtype
      const costOfSales = expenseWithAmounts.filter((e) =>
        e.subType?.includes("Cost of Sales"),
      );
      const operatingExpenses = expenseWithAmounts.filter((e) =>
        e.subType?.includes("Operating"),
      );
      const nonOperatingExpenses = expenseWithAmounts.filter(
        (e) =>
          e.subType?.includes("Non-Operating") ||
          e.subType?.includes("Tax Expense"),
      );

      // 7. Calculate totals
      const totalRevenue = revenueWithAmounts.reduce(
        (sum, a) => sum + a.amount,
        0,
      );
      const totalExpenses = expenseWithAmounts.reduce(
        (sum, a) => sum + a.amount,
        0,
      );
      const netIncome = totalRevenue - totalExpenses;

      // 8. Calculate subtotals
      const grossRevenue = operatingRevenue.reduce(
        (sum, r) => sum + r.amount,
        0,
      );
      // totalContraRevenue is ≤ 0; adding it to grossRevenue gives net revenue
      const totalContraRevenue = contraRevenue.reduce(
        (sum, r) => sum + r.amount,
        0,
      );
      const netRevenue = grossRevenue + totalContraRevenue;
      const totalCostOfSales = costOfSales.reduce(
        (sum, e) => sum + e.amount,
        0,
      );
      const grossProfit = netRevenue - totalCostOfSales;

      const totalOperatingExpenses = operatingExpenses.reduce(
        (sum, e) => sum + e.amount,
        0,
      );
      const operatingIncome = grossProfit - totalOperatingExpenses;

      const totalOtherIncome = otherIncome.reduce(
        (sum, r) => sum + r.amount,
        0,
      );
      const totalNonOperatingExpenses = nonOperatingExpenses.reduce(
        (sum, e) => sum + e.amount,
        0,
      );

      return {
        period: { startDate, endDate },
        revenue: {
          operatingRevenue,
          contraRevenue,
          otherIncome,
          total: totalRevenue,
        },
        expenses: {
          costOfSales,
          operatingExpenses,
          nonOperatingExpenses,
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
   * Generate Cash Flow Statement
   * Shows: Operating, Investing, Financing activities
   */
  async generateCashFlowStatement(
    companyId: string,
    startDate: Date,
    endDate: Date,
  ) {
    try {
      // 1. Get Net Income from Income Statement
      const incomeStatement = await this.generateIncomeStatement(
        companyId,
        startDate,
        endDate,
      );
      const netIncome = incomeStatement.summary.netIncome;

      // 2. Operating Activities - Get changes in current assets and liabilities
      const operatingAccountCodes = [
        "1100", // Accounts Receivable
        "1200", // Inventory
        "1300", // Prepaid Expenses
        "2000", // Accounts Payable
        "2100", // Accrued Expenses
      ];

      const operatingActivities = await Promise.all(
        operatingAccountCodes.map(async (code) => {
          const account = await Account.findOne({
            companyId: new mongoose.Types.ObjectId(companyId),
            accountCode: code,
          }).lean();

          if (!account) {
            return null;
          }

          // Get balance at start of period
          const startBalance = await ledgerService.getAccountBalance(
            companyId,
            account._id.toString(),
            startDate,
          );

          // Get balance at end of period
          const endBalance = await ledgerService.getAccountBalance(
            companyId,
            account._id.toString(),
            endDate,
          );

          const change = endBalance.balance - startBalance.balance;

          // For assets: increase = use of cash (negative), decrease = source of cash (positive)
          // For liabilities: increase = source of cash (positive), decrease = use of cash (negative)
          const isAsset = account.accountType === "Asset";
          const cashEffect = isAsset ? -change : change;

          return {
            accountName: account.accountName,
            accountCode: account.accountCode,
            change,
            cashEffect,
          };
        }),
      );

      const validOperatingActivities = operatingActivities.filter(
        (a) => a !== null,
      );

      // 2b. Add back non-cash Depreciation & Amortization (indirect method requirement).
      //     These reduce Net Income but involve no cash outflow, so they must be reversed.
      const depreciationAccounts = await Account.find({
        companyId: new mongoose.Types.ObjectId(companyId),
        accountType: "Expense",
        accountName: { $regex: /depreciation|amortization/i },
      }).lean();

      let totalDepreciation = 0;
      for (const depAccount of depreciationAccounts) {
        const depEntries = await Ledger.find({
          companyId: new mongoose.Types.ObjectId(companyId),
          accountId: depAccount._id,
          transactionDate: { $gte: startDate, $lte: endDate },
        }).lean();
        totalDepreciation += depEntries.reduce(
          (sum, e) => sum + parseFloat(e.debit) - parseFloat(e.credit),
          0,
        );
      }

      // 3. Investing Activities - Get capital expenditures (purchases of fixed assets)
      const investingAccounts = await Account.find({
        companyId: new mongoose.Types.ObjectId(companyId),
        accountType: "Asset",
        subType: { $regex: /Fixed/i },
        normalBalance: "Debit", // Exclude contra fixed-asset accounts (e.g. Accumulated Depreciation)
      }).lean();

      const investingActivities = await Promise.all(
        investingAccounts.map(async (account) => {
          const entries = await Ledger.find({
            companyId: new mongoose.Types.ObjectId(companyId),
            accountId: account._id,
            transactionDate: { $gte: startDate, $lte: endDate },
          }).lean();

          // Debit entries increase fixed assets (purchase = use of cash)
          const purchases = entries.reduce((sum, entry) => {
            return sum + parseFloat(entry.debit);
          }, 0);

          // Credit entries decrease fixed assets (sale = source of cash)
          const sales = entries.reduce((sum, entry) => {
            return sum + parseFloat(entry.credit);
          }, 0);

          const netPurchases = purchases - sales;

          return {
            accountName: account.accountName,
            accountCode: account.accountCode,
            purchases,
            sales,
            netCashEffect: -netPurchases, // Negative because purchases use cash
          };
        }),
      );

      // 4. Financing Activities - Get equity and long-term loan changes
      const financingAccounts = await Account.find({
        companyId: new mongoose.Types.ObjectId(companyId),
        $or: [
          { accountType: "Equity" },
          { accountType: "Liability", subType: { $regex: /Long-term/i } },
        ],
      }).lean();

      const financingActivities = await Promise.all(
        financingAccounts.map(async (account) => {
          const entries = await Ledger.find({
            companyId: new mongoose.Types.ObjectId(companyId),
            accountId: account._id,
            transactionDate: { $gte: startDate, $lte: endDate },
          }).lean();

          // For equity/liabilities: Credit = increase = source of cash
          const increases = entries.reduce((sum, entry) => {
            return sum + parseFloat(entry.credit);
          }, 0);

          // For equity/liabilities: Debit = decrease = use of cash
          const decreases = entries.reduce((sum, entry) => {
            return sum + parseFloat(entry.debit);
          }, 0);

          const netCashEffect = increases - decreases;

          return {
            accountName: account.accountName,
            accountCode: account.accountCode,
            increases,
            decreases,
            netCashEffect,
          };
        }),
      );

      // 5. Calculate net cash flow
      const operatingAdjustments = validOperatingActivities.reduce(
        (sum, a) => sum + a.cashEffect,
        0,
      );
      const operatingCashFlow =
        netIncome + totalDepreciation + operatingAdjustments;

      const investingCashFlow = investingActivities.reduce(
        (sum, a) => sum + a.netCashEffect,
        0,
      );

      const financingCashFlow = financingActivities.reduce(
        (sum, a) => sum + a.netCashEffect,
        0,
      );

      const netCashFlow =
        operatingCashFlow + investingCashFlow + financingCashFlow;

      // 6. Get beginning and ending cash balances
      const cashAccounts = await Account.find({
        companyId: new mongoose.Types.ObjectId(companyId),
        accountCode: { $in: ["1000", "1010", "1020"] }, // Cash on Hand, Cash in Bank, Petty Cash
      }).lean();

      let beginningCash = 0;
      let endingCash = 0;

      // Beginning cash must be the balance at close of the day *before* the period starts.
      // Passing startDate directly includes same-day transactions in the opening balance,
      // causing the beginning + netCashFlow ≠ ending reconciliation to break.
      const beginningDate = new Date(startDate);
      beginningDate.setDate(beginningDate.getDate() - 1);

      for (const cashAccount of cashAccounts) {
        const startBalance = await ledgerService.getAccountBalance(
          companyId,
          cashAccount._id.toString(),
          beginningDate,
        );
        const endBalance = await ledgerService.getAccountBalance(
          companyId,
          cashAccount._id.toString(),
          endDate,
        );

        beginningCash += startBalance.balance;
        endingCash += endBalance.balance;
      }

      return {
        period: { startDate, endDate },
        operatingActivities: {
          netIncome,
          depreciationAmortization: totalDepreciation,
          adjustments: validOperatingActivities,
          total: operatingCashFlow,
        },
        investingActivities: {
          items: investingActivities,
          total: investingCashFlow,
        },
        financingActivities: {
          items: financingActivities,
          total: financingCashFlow,
        },
        summary: {
          netCashFlow,
          beginningCash,
          endingCash,
          calculatedEndingCash: beginningCash + netCashFlow,
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
   * Reuse existing ledgerService method
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
   * Shows outstanding invoices grouped by age (0-30, 31-60, 61-90, 90+ days)
   */
  async generateARAgingReport(companyId: string, asOfDate: Date = new Date()) {
    try {
      // Get all unpaid/partially paid invoices
      const invoices = await Invoice.find({
        companyId: new mongoose.Types.ObjectId(companyId),
        status: { $in: ["Sent", "Partial"] },
        balanceDue: { $gt: 0 },
      })
        .populate("customerId", "customerName displayName email")
        .lean();

      // Calculate age for each invoice
      const today = asOfDate;
      const invoicesWithAge = invoices.map((invoice) => {
        const dueDate = invoice.dueDate;
        const daysOverdue = Math.floor(
          (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        // Determine age bucket
        let ageBucket: "Current" | "1-30" | "31-60" | "61-90" | "90+" =
          "Current";
        if (daysOverdue <= 0) {
          ageBucket = "Current";
        } else if (daysOverdue <= 30) {
          ageBucket = "1-30";
        } else if (daysOverdue <= 60) {
          ageBucket = "31-60";
        } else if (daysOverdue <= 90) {
          ageBucket = "61-90";
        } else {
          ageBucket = "90+";
        }

        return {
          invoiceNumber: invoice.invoiceNumber,
          customerId: invoice.customerId,
          customerName: (invoice.customerId as any)?.displayName || "Unknown",
          issueDate: invoice.invoiceDate,
          dueDate: invoice.dueDate,
          totalAmount: invoice.totalAmount,
          amountPaid: invoice.amountPaid || 0,
          balanceDue: invoice.balanceDue,
          daysOverdue,
          ageBucket,
        };
      });

      // Group by customer
      const customerMap = new Map<
        string,
        {
          customerId: string;
          customerName: string;
          invoices: typeof invoicesWithAge;
          totals: {
            current: number;
            days1to30: number;
            days31to60: number;
            days61to90: number;
            days90plus: number;
            total: number;
          };
        }
      >();

      for (const invoice of invoicesWithAge) {
        const customerId =
          (invoice.customerId as any)?._id?.toString() || "unknown";
        if (!customerMap.has(customerId)) {
          customerMap.set(customerId, {
            customerId,
            customerName: invoice.customerName,
            invoices: [],
            totals: {
              current: 0,
              days1to30: 0,
              days31to60: 0,
              days61to90: 0,
              days90plus: 0,
              total: 0,
            },
          });
        }

        const customer = customerMap.get(customerId)!;
        customer.invoices.push(invoice);

        // Add to bucket totals
        switch (invoice.ageBucket) {
          case "Current":
            customer.totals.current += invoice.balanceDue;
            break;
          case "1-30":
            customer.totals.days1to30 += invoice.balanceDue;
            break;
          case "31-60":
            customer.totals.days31to60 += invoice.balanceDue;
            break;
          case "61-90":
            customer.totals.days61to90 += invoice.balanceDue;
            break;
          case "90+":
            customer.totals.days90plus += invoice.balanceDue;
            break;
        }
        customer.totals.total += invoice.balanceDue;
      }

      // Calculate grand totals
      const grandTotals = {
        current: 0,
        days1to30: 0,
        days31to60: 0,
        days61to90: 0,
        days90plus: 0,
        total: 0,
      };

      for (const customer of customerMap.values()) {
        grandTotals.current += customer.totals.current;
        grandTotals.days1to30 += customer.totals.days1to30;
        grandTotals.days31to60 += customer.totals.days31to60;
        grandTotals.days61to90 += customer.totals.days61to90;
        grandTotals.days90plus += customer.totals.days90plus;
        grandTotals.total += customer.totals.total;
      }

      return {
        asOfDate,
        customers: Array.from(customerMap.values()),
        grandTotals,
        summary: {
          totalInvoices: invoicesWithAge.length,
          totalCustomers: customerMap.size,
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
   * Shows outstanding bills grouped by age (0-30, 31-60, 61-90, 90+ days)
   */
  async generateAPAgingReport(companyId: string, asOfDate: Date = new Date()) {
    try {
      // Get all unpaid/partially paid bills
      const bills = await Bill.find({
        companyId: new mongoose.Types.ObjectId(companyId),
        status: { $in: ["Open", "Partial"] },
        balanceDue: { $gt: 0 },
      })
        .populate("supplierId", "supplierName displayName email")
        .lean();

      // Calculate age for each bill
      const today = asOfDate;
      const billsWithAge = bills.map((bill) => {
        const dueDate = bill.dueDate;
        const daysOverdue = Math.floor(
          (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        // Determine age bucket
        let ageBucket: "Current" | "1-30" | "31-60" | "61-90" | "90+" =
          "Current";
        if (daysOverdue <= 0) {
          ageBucket = "Current";
        } else if (daysOverdue <= 30) {
          ageBucket = "1-30";
        } else if (daysOverdue <= 60) {
          ageBucket = "31-60";
        } else if (daysOverdue <= 90) {
          ageBucket = "61-90";
        } else {
          ageBucket = "90+";
        }

        return {
          billNumber: bill.billNumber,
          supplierId: bill.supplierId,
          supplierName: (bill.supplierId as any)?.displayName || "Unknown",
          billDate: bill.createdAt,
          dueDate: bill.dueDate,
          totalAmount: bill.totalAmount,
          amountPaid: bill.amountPaid || 0,
          balanceDue: bill.balanceDue,
          daysOverdue,
          ageBucket,
        };
      });

      // Group by supplier
      const supplierMap = new Map<
        string,
        {
          supplierId: string;
          supplierName: string;
          bills: typeof billsWithAge;
          totals: {
            current: number;
            days1to30: number;
            days31to60: number;
            days61to90: number;
            days90plus: number;
            total: number;
          };
        }
      >();

      for (const bill of billsWithAge) {
        const supplierId =
          (bill.supplierId as any)?._id?.toString() || "unknown";
        if (!supplierMap.has(supplierId)) {
          supplierMap.set(supplierId, {
            supplierId,
            supplierName: bill.supplierName,
            bills: [],
            totals: {
              current: 0,
              days1to30: 0,
              days31to60: 0,
              days61to90: 0,
              days90plus: 0,
              total: 0,
            },
          });
        }

        const supplier = supplierMap.get(supplierId)!;
        supplier.bills.push(bill);

        // Add to bucket totals
        switch (bill.ageBucket) {
          case "Current":
            supplier.totals.current += bill.balanceDue;
            break;
          case "1-30":
            supplier.totals.days1to30 += bill.balanceDue;
            break;
          case "31-60":
            supplier.totals.days31to60 += bill.balanceDue;
            break;
          case "61-90":
            supplier.totals.days61to90 += bill.balanceDue;
            break;
          case "90+":
            supplier.totals.days90plus += bill.balanceDue;
            break;
        }
        supplier.totals.total += bill.balanceDue;
      }

      // Calculate grand totals
      const grandTotals = {
        current: 0,
        days1to30: 0,
        days31to60: 0,
        days61to90: 0,
        days90plus: 0,
        total: 0,
      };

      for (const supplier of supplierMap.values()) {
        grandTotals.current += supplier.totals.current;
        grandTotals.days1to30 += supplier.totals.days1to30;
        grandTotals.days31to60 += supplier.totals.days31to60;
        grandTotals.days61to90 += supplier.totals.days61to90;
        grandTotals.days90plus += supplier.totals.days90plus;
        grandTotals.total += supplier.totals.total;
      }

      return {
        asOfDate,
        suppliers: Array.from(supplierMap.values()),
        grandTotals,
        summary: {
          totalBills: billsWithAge.length,
          totalSuppliers: supplierMap.size,
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
