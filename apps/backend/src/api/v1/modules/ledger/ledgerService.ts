import mongoose from "mongoose";
import { Ledger } from "../../models/Ledger.js";
import Account from "../../models/Account.js";
import logger from "../../config/logger.js";

/**
 * Ledger Service
 * Handles business logic for ledger/general ledger operations
 */
export const ledgerService = {
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
   * Get general ledger (grouped by account)
   */
  async getGeneralLedger(companyId: string, startDate?: Date, endDate?: Date) {
    try {
      const query: any = { companyId: new mongoose.Types.ObjectId(companyId) };

      if (startDate && endDate) {
        query.transactionDate = { $gte: startDate, $lte: endDate };
      }

      // Get all accounts for the company
      const accounts = await Account.find({
        companyId: new mongoose.Types.ObjectId(companyId),
      })
        .sort({ accountCode: 1 })
        .lean();

      // Get ledger entries grouped by account
      const generalLedger = [];

      for (const account of accounts) {
        const entries = await Ledger.find({
          ...query,
          accountId: account._id,
        })
          .sort({ transactionDate: 1, createdAt: 1 })
          .lean();

        if (entries.length > 0) {
          const totalDebit = entries.reduce(
            (sum, entry) => sum + parseFloat(entry.debit),
            0,
          );
          const totalCredit = entries.reduce(
            (sum, entry) => sum + parseFloat(entry.credit),
            0,
          );

          generalLedger.push({
            account: {
              _id: account._id,
              accountCode: account.accountCode,
              accountName: account.accountName,
              accountType: account.accountType,
            },
            entries,
            summary: {
              totalDebit,
              totalCredit,
              balance: entries[entries.length - 1]?.runningBalance || 0,
              entryCount: entries.length,
            },
          });
        }
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
   * Get ledger entries by account
   */
  async getByAccount(
    companyId: string,
    accountId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    try {
      const query: any = {
        companyId: new mongoose.Types.ObjectId(companyId),
        accountId: new mongoose.Types.ObjectId(accountId),
      };

      if (startDate && endDate) {
        query.transactionDate = { $gte: startDate, $lte: endDate };
      }

      const entries = await Ledger.find(query)
        .sort({ transactionDate: 1, createdAt: 1 })
        .lean();

      // Get account details
      const account = await Account.findOne({
        _id: new mongoose.Types.ObjectId(accountId),
        companyId: new mongoose.Types.ObjectId(companyId),
      }).lean();

      if (!account) {
        throw new Error("Account not found");
      }

      const totalDebit = entries.reduce(
        (sum, entry) => sum + parseFloat(entry.debit),
        0,
      );
      const totalCredit = entries.reduce(
        (sum, entry) => sum + parseFloat(entry.credit),
        0,
      );

      return {
        account: {
          _id: account._id,
          accountCode: account.accountCode,
          accountName: account.accountName,
          accountType: account.accountType,
          subType: account.subType,
        },
        entries,
        summary: {
          totalDebit,
          totalCredit,
          currentBalance: entries[entries.length - 1]?.runningBalance || 0,
          entryCount: entries.length,
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
      const entries = await Ledger.find({
        companyId: new mongoose.Types.ObjectId(companyId),
        journalEntryId: new mongoose.Types.ObjectId(journalEntryId),
      })
        .sort({ accountId: 1 })
        .lean();

      return entries;
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
      const query: any = {
        companyId: new mongoose.Types.ObjectId(companyId),
        accountId: new mongoose.Types.ObjectId(accountId),
      };

      if (asOfDate) {
        query.transactionDate = { $lte: asOfDate };
      }

      const latestEntry = await Ledger.findOne(query)
        .sort({ transactionDate: -1, createdAt: -1 })
        .lean();

      const account = await Account.findOne({
        _id: new mongoose.Types.ObjectId(accountId),
        companyId: new mongoose.Types.ObjectId(companyId),
      }).lean();

      return {
        accountId,
        accountCode: account?.accountCode,
        accountName: account?.accountName,
        accountType: account?.accountType,
        balance: latestEntry?.runningBalance || 0,
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
   * Get trial balance (all accounts with their balances)
   */
  async getTrialBalance(companyId: string, asOfDate?: Date) {
    try {
      // Get all accounts
      const accounts = await Account.find({
        companyId: new mongoose.Types.ObjectId(companyId),
      })
        .sort({ accountCode: 1 })
        .lean();

      const trialBalance = [];
      let totalDebits = 0;
      let totalCredits = 0;

      for (const account of accounts) {
        const query: any = {
          companyId: new mongoose.Types.ObjectId(companyId),
          accountId: account._id,
        };

        if (asOfDate) {
          query.transactionDate = { $lte: asOfDate };
        }

        const latestEntry = await Ledger.findOne(query)
          .sort({ transactionDate: -1, createdAt: -1 })
          .lean();

        const balance = latestEntry?.runningBalance || 0;

        // Determine if account has debit or credit balance
        const isDebitBalance = ["Asset", "Expense"].includes(
          account.accountType,
        );

        const debitBalance = isDebitBalance && balance > 0 ? balance : 0;
        const creditBalance = !isDebitBalance && balance > 0 ? balance : 0;

        // Handle negative balances (contra accounts)
        const finalDebit =
          balance >= 0 && isDebitBalance
            ? balance
            : balance < 0 && !isDebitBalance
              ? Math.abs(balance)
              : 0;
        const finalCredit =
          balance >= 0 && !isDebitBalance
            ? balance
            : balance < 0 && isDebitBalance
              ? Math.abs(balance)
              : 0;

        totalDebits += finalDebit;
        totalCredits += finalCredit;

        if (balance !== 0) {
          trialBalance.push({
            accountCode: account.accountCode,
            accountName: account.accountName,
            accountType: account.accountType,
            debit: finalDebit,
            credit: finalCredit,
          });
        }
      }

      return {
        asOfDate: asOfDate || new Date(),
        accounts: trialBalance,
        totals: {
          debits: totalDebits,
          credits: totalCredits,
          difference: Math.abs(totalDebits - totalCredits),
          balanced: Math.abs(totalDebits - totalCredits) < 0.01,
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
