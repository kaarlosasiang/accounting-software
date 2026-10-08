import mongoose from "mongoose";

import logger from "../../config/logger.js";
import Account from "../../models/Account.js";
import { Invoice } from "../../models/Invoice.js";
import { Ledger } from "../../models/Ledger.js";
import { round2, toMoney } from "../../shared/helpers/money.js";

const hasMalformedInvoiceDescription = (description?: string | null) =>
  typeof description === "string" &&
  (description.includes("new ObjectId(") ||
    description.includes("[object Object]") ||
    description.includes("customerName"));

const getInvoiceCustomerDescription = async (
  companyId: mongoose.Types.ObjectId,
  journalEntryId: mongoose.Types.ObjectId,
) => {
  const invoice = await Invoice.findOne({
    companyId,
    journalEntryId,
  })
    .populate("customerId", "customerName displayName")
    .lean();

  if (!invoice) {
    return null;
  }

  const customer = invoice.customerId as
    | { customerName?: string; displayName?: string }
    | null
    | undefined;
  const customerName = customer?.customerName || customer?.displayName;

  if (!customerName) {
    return null;
  }

  return `Invoice ${invoice.invoiceNumber} - ${customerName}`;
};

type AccountLike = { _id: mongoose.Types.ObjectId; accountType: string };

const isDebitNormal = (accountType: string) =>
  accountType === "Asset" || accountType === "Expense";

/**
 * Signed balance of an account in its normal direction:
 * Asset/Expense = debit − credit; Liability/Equity/Revenue = credit − debit.
 * Contra accounts therefore come out negative and net correctly in totals.
 */
export const normalBalance = (
  accountType: string,
  debit: number,
  credit: number,
) => round2(isDebitNormal(accountType) ? debit - credit : credit - debit);

export interface AccountTotals {
  debit: number;
  credit: number;
}

/**
 * Ledger Service
 * Handles business logic for ledger/general ledger operations
 */
export const ledgerService = {
  /**
   * Debit/credit totals per account in ONE aggregate (replaces the previous
   * one-query-per-account loops).
   *
   * @param from            inclusive lower bound on transactionDate
   * @param to              inclusive upper bound on transactionDate
   * @param excludeClosing  drop period-closing entries (for the P&L)
   */
  async getTotalsByAccount(
    companyId: string,
    options: { from?: Date; to?: Date; excludeClosing?: boolean } = {},
  ): Promise<Map<string, AccountTotals>> {
    const match: Record<string, unknown> = {
      companyId: new mongoose.Types.ObjectId(companyId),
    };
    if (options.from || options.to) {
      match.transactionDate = {
        ...(options.from ? { $gte: options.from } : {}),
        ...(options.to ? { $lte: options.to } : {}),
      };
    }
    if (options.excludeClosing) {
      match.isClosingEntry = { $ne: true };
    }

    const rows = await Ledger.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$accountId",
          debit: { $sum: { $toDouble: "$debit" } },
          credit: { $sum: { $toDouble: "$credit" } },
        },
      },
    ]);

    return new Map(
      rows.map((row) => [
        row._id.toString(),
        { debit: round2(row.debit), credit: round2(row.credit) },
      ]),
    );
  },

  /**
   * Normal-direction balance per account (see `normalBalance`).
   */
  async getBalancesByAccount(
    companyId: string,
    accounts: AccountLike[],
    options: { from?: Date; to?: Date; excludeClosing?: boolean } = {},
  ): Promise<Map<string, number>> {
    const totals = await this.getTotalsByAccount(companyId, options);
    return new Map(
      accounts.map((account) => {
        const t = totals.get(account._id.toString());
        return [
          account._id.toString(),
          t ? normalBalance(account.accountType, t.debit, t.credit) : 0,
        ];
      }),
    );
  },

  /**
   * Get all ledger entries for a company
   */
  async getAllLedgerEntries(
    companyId: string,
    options?: {
      limit?: number;
      skip?: number;
    },
  ) {
    try {
      const entries = await Ledger.find({
        companyId: new mongoose.Types.ObjectId(companyId),
      })
        .sort({ transactionDate: -1, createdAt: -1 })
        .limit(options?.limit || 100)
        .skip(options?.skip || 0)
        .lean();

      return entries;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-all-ledger-entries",
        companyId,
      });
      throw error;
    }
  },

  /**
   * Get general ledger (grouped by account).
   * Running balances are recomputed on read, starting from the account's
   * balance before `startDate`, so they stay correct for back-dated entries.
   */
  async getGeneralLedger(companyId: string, startDate?: Date, endDate?: Date) {
    try {
      const companyObjectId = new mongoose.Types.ObjectId(companyId);
      const query: any = { companyId: companyObjectId };
      if (startDate || endDate) {
        query.transactionDate = {
          ...(startDate ? { $gte: startDate } : {}),
          ...(endDate ? { $lte: endDate } : {}),
        };
      }

      const [accounts, entries, openingTotals] = await Promise.all([
        Account.find({ companyId: companyObjectId })
          .sort({ accountCode: 1 })
          .lean(),
        Ledger.find(query)
          .sort({ transactionDate: 1, createdAt: 1, _id: 1 })
          .lean(),
        startDate
          ? this.getTotalsByAccount(companyId, {
              to: new Date(startDate.getTime() - 1),
            })
          : Promise.resolve(new Map<string, AccountTotals>()),
      ]);

      const entriesByAccount = new Map<string, typeof entries>();
      for (const entry of entries) {
        const key = entry.accountId.toString();
        if (!entriesByAccount.has(key)) entriesByAccount.set(key, []);
        entriesByAccount.get(key)!.push(entry);
      }

      const generalLedger = [];
      for (const account of accounts) {
        const accountEntries = entriesByAccount.get(account._id.toString());
        if (!accountEntries?.length) continue;

        const opening = openingTotals.get(account._id.toString());
        let running = opening
          ? normalBalance(account.accountType, opening.debit, opening.credit)
          : 0;
        const openingBalance = running;

        let totalDebit = 0;
        let totalCredit = 0;
        const withBalances = accountEntries.map((entry) => {
          const debit = toMoney(entry.debit);
          const credit = toMoney(entry.credit);
          totalDebit += debit;
          totalCredit += credit;
          running = round2(
            running + normalBalance(account.accountType, debit, credit),
          );
          return { ...entry, debit, credit, runningBalance: running };
        });

        generalLedger.push({
          account: {
            _id: account._id,
            accountCode: account.accountCode,
            accountName: account.accountName,
            accountType: account.accountType,
          },
          entries: withBalances,
          summary: {
            openingBalance,
            totalDebit: round2(totalDebit),
            totalCredit: round2(totalCredit),
            balance: running,
            entryCount: withBalances.length,
          },
        });
      }

      return generalLedger;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-general-ledger",
        companyId,
      });
      throw error;
    }
  },

  /**
   * Get ledger entries by account, with running balances computed on read.
   */
  async getByAccount(
    companyId: string,
    accountId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    try {
      const companyObjectId = new mongoose.Types.ObjectId(companyId);
      const accountObjectId = new mongoose.Types.ObjectId(accountId);

      const account = await Account.findOne({
        _id: accountObjectId,
        companyId: companyObjectId,
      }).lean();

      if (!account) {
        throw new Error("Account not found");
      }

      const query: any = {
        companyId: companyObjectId,
        accountId: accountObjectId,
      };
      if (startDate || endDate) {
        query.transactionDate = {
          ...(startDate ? { $gte: startDate } : {}),
          ...(endDate ? { $lte: endDate } : {}),
        };
      }

      const [entries, opening] = await Promise.all([
        Ledger.find(query)
          .sort({ transactionDate: 1, createdAt: 1, _id: 1 })
          .lean(),
        startDate
          ? this.getAccountBalance(
              companyId,
              accountId,
              new Date(startDate.getTime() - 1),
            )
          : Promise.resolve({ balance: 0 }),
      ]);

      let running = opening.balance;
      let totalDebit = 0;
      let totalCredit = 0;
      const withBalances = entries.map((entry) => {
        const debit = toMoney(entry.debit);
        const credit = toMoney(entry.credit);
        totalDebit += debit;
        totalCredit += credit;
        running = round2(
          running + normalBalance(account.accountType, debit, credit),
        );
        return { ...entry, debit, credit, runningBalance: running };
      });

      return {
        account: {
          _id: account._id,
          accountCode: account.accountCode,
          accountName: account.accountName,
          accountType: account.accountType,
          subType: account.subType,
        },
        entries: withBalances,
        summary: {
          openingBalance: opening.balance,
          totalDebit: round2(totalDebit),
          totalCredit: round2(totalCredit),
          currentBalance: running,
          entryCount: withBalances.length,
        },
      };
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-ledger-by-account",
        accountId,
      });
      throw error;
    }
  },

  /**
   * Get ledger entries by journal entry
   */
  async getByJournalEntry(companyId: string, journalEntryId: string) {
    try {
      const companyObjectId = new mongoose.Types.ObjectId(companyId);
      const journalEntryObjectId = new mongoose.Types.ObjectId(journalEntryId);

      const entries = await Ledger.find({
        companyId: companyObjectId,
        journalEntryId: journalEntryObjectId,
      })
        .sort({ accountId: 1 })
        .lean();

      if (
        !entries.some((entry) =>
          hasMalformedInvoiceDescription(entry.description),
        )
      ) {
        return entries;
      }

      const correctedDescription = await getInvoiceCustomerDescription(
        companyObjectId,
        journalEntryObjectId,
      );

      if (!correctedDescription) {
        return entries;
      }

      return entries.map((entry) => ({
        ...entry,
        description: hasMalformedInvoiceDescription(entry.description)
          ? correctedDescription
          : entry.description,
      }));
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-ledger-by-journal-entry",
        journalEntryId,
      });
      throw error;
    }
  },

  /**
   * Get ledger entries by date range
   */
  async getByDateRange(companyId: string, startDate: Date, endDate: Date) {
    try {
      const entries = await Ledger.find({
        companyId: new mongoose.Types.ObjectId(companyId),
        transactionDate: { $gte: startDate, $lte: endDate },
      })
        .sort({ transactionDate: 1, createdAt: 1 })
        .lean();

      return entries;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-ledger-by-date-range",
        companyId,
      });
      throw error;
    }
  },

  /**
   * Get account balance
   */
  async getAccountBalance(
    companyId: string,
    accountId: string,
    asOfDate?: Date,
  ) {
    try {
      const account = await Account.findOne({
        _id: new mongoose.Types.ObjectId(accountId),
        companyId: new mongoose.Types.ObjectId(companyId),
      }).lean();

      const matchStage: any = {
        companyId: new mongoose.Types.ObjectId(companyId),
        accountId: new mongoose.Types.ObjectId(accountId),
      };

      if (asOfDate) {
        matchStage.transactionDate = { $lte: asOfDate };
      }

      // Compute balance by summing all debit/credit amounts rather than
      // relying on the denormalized runningBalance field, which can become
      // stale when entries are inserted out of chronological order (e.g.
      // a void reversal followed by a new posting on the same date).
      const result = await Ledger.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalDebit: { $sum: { $toDouble: "$debit" } },
            totalCredit: { $sum: { $toDouble: "$credit" } },
          },
        },
      ]);

      let balance = 0;
      if (result.length > 0 && account) {
        const { totalDebit, totalCredit } = result[0];
        balance = normalBalance(account.accountType, totalDebit, totalCredit);
      }

      return {
        accountId,
        accountCode: account?.accountCode,
        accountName: account?.accountName,
        accountType: account?.accountType,
        balance,
        asOfDate: asOfDate || new Date(),
      };
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-account-balance",
        accountId,
      });
      throw error;
    }
  },

  /**
   * Get trial balance (all accounts with their balances) in one aggregate.
   * Each account appears in the column of its actual balance: a contra or
   * overdrawn account shows on the opposite side of its normal balance.
   */
  async getTrialBalance(companyId: string, asOfDate?: Date) {
    try {
      const companyObjectId = new mongoose.Types.ObjectId(companyId);

      const [accounts, totals] = await Promise.all([
        Account.find({ companyId: companyObjectId })
          .sort({ accountCode: 1 })
          .lean(),
        this.getTotalsByAccount(companyId, { to: asOfDate }),
      ]);

      const trialBalance = [];
      let totalDebits = 0;
      let totalCredits = 0;

      for (const account of accounts) {
        const t = totals.get(account._id.toString());
        if (!t) continue;

        const net = round2(t.debit - t.credit); // positive = debit balance
        if (net === 0) continue;

        const debit = net > 0 ? net : 0;
        const credit = net < 0 ? -net : 0;
        totalDebits += debit;
        totalCredits += credit;

        trialBalance.push({
          accountCode: account.accountCode,
          accountName: account.accountName,
          accountType: account.accountType,
          debit,
          credit,
        });
      }

      totalDebits = round2(totalDebits);
      totalCredits = round2(totalCredits);
      const difference = round2(Math.abs(totalDebits - totalCredits));

      return {
        asOfDate: asOfDate || new Date(),
        accounts: trialBalance,
        totals: {
          debits: totalDebits,
          credits: totalCredits,
          difference,
          balanced: difference < 0.01,
        },
      };
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-trial-balance",
        companyId,
      });
      throw error;
    }
  },
};
