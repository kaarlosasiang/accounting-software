import Account from "../../models/Account.js";
import { Ledger } from "../../models/Ledger.js";
import logger from "../../config/logger.js";
import { Types } from "mongoose";

/**
 * Accounts Service
 * Handles all account-related business logic
 */
const accountsService = {
  /**
   * Get all accounts for a company
   */
  getAllAccounts: async (companyId: string | Types.ObjectId) => {
    try {
      const accounts = await Account.find({ companyId }).sort({
        accountCode: 1,
      });
      return accounts;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-all-accounts",
        companyId: companyId.toString(),
      });
      throw error;
    }
  },

  /**
   * Get accounts by type
   */
  getAccountsByType: async (
    companyId: string | Types.ObjectId,
    accountType: string,
  ) => {
    try {
      const accounts = await Account.find({
        companyId,
        accountType: accountType.charAt(0).toUpperCase() + accountType.slice(1),
      }).sort({ accountCode: 1 });
      return accounts;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-accounts-by-type",
        companyId: companyId.toString(),
        accountType,
      });
      throw error;
    }
  },

  /**
   * Get a single account by ID
   */
  getAccountById: async (
    companyId: string | Types.ObjectId,
    accountId: string | Types.ObjectId,
  ) => {
    try {
      const account = await Account.findOne({
        _id: accountId,
        companyId,
      });
      if (!account) {
        throw new Error("Account not found");
      }
      return account;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-account-by-id",
        companyId: companyId.toString(),
        accountId: accountId.toString(),
      });
      throw error;
    }
  },

  /**
   * Create a new account
   */
  createAccount: async (
    companyId: string | Types.ObjectId,
    accountData: {
      accountCode: string;
      accountName: string;
      accountType: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";
      normalBalance: "Debit" | "Credit";
      subType?: string;
      description?: string;
      balance?: number;
      parentAccount?: string | Types.ObjectId;
    },
  ) => {
    try {
      // Check if account code already exists for this company
      const existingAccount = await Account.findOne({
        companyId,
        accountCode: accountData.accountCode,
      });

      if (existingAccount) {
        throw new Error(
          `Account with code ${accountData.accountCode} already exists for this company`,
        );
      }

      const account = new Account({
        ...accountData,
        companyId,
        balance: accountData.balance ?? 0,
      });

      await account.save();
      logger.info("Account created successfully", {
        accountId: account._id,
        accountCode: account.accountCode,
        companyId: companyId.toString(),
      });

      return account;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "create-account",
        companyId: companyId.toString(),
      });
      throw error;
    }
  },

  /**
   * Update an account
   */
  updateAccount: async (
    companyId: string | Types.ObjectId,
    accountId: string | Types.ObjectId,
    updateData: Partial<{
      accountName: string;
      accountType: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";
      normalBalance: "Debit" | "Credit";
      subType: string;
      description: string;
      parentAccount: string | Types.ObjectId;
    }>,
  ) => {
    try {
      const account = await Account.findOneAndUpdate(
        { _id: accountId, companyId },
        { $set: updateData },
        { new: true, runValidators: true },
      );

      if (!account) {
        throw new Error("Account not found");
      }

      logger.info("Account updated successfully", {
        accountId: account._id,
        accountCode: account.accountCode,
        companyId: companyId.toString(),
      });

      return account;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "update-account",
        companyId: companyId.toString(),
        accountId: accountId.toString(),
      });
      throw error;
    }
  },

  /**
   * Delete an account (with transaction validation)
   * - If account has no transactions: Hard delete
   * - If account has transactions: Throw error (cannot delete)
   */
  deleteAccount: async (
    companyId: string | Types.ObjectId,
    accountId: string | Types.ObjectId,
  ) => {
    try {
      // First, check if account exists
      const account = await Account.findOne({
        _id: accountId,
        companyId,
      });

      if (!account) {
        throw new Error("Account not found");
      }

      // Check if account has any ledger entries (transactions)
      const ledgerEntryCount = await Ledger.countDocuments({
        accountId,
        companyId,
      });

      if (ledgerEntryCount > 0) {
        throw new Error(
          `Cannot delete account "${account.accountName}" (${account.accountCode}). ` +
            `This account has ${ledgerEntryCount} transaction(s). ` +
            `Please archive the account instead or ensure all transactions are voided first.`,
        );
      }

      // Safe to delete - no transactions found
      await Account.findOneAndDelete({
        _id: accountId,
        companyId,
      });

      logger.info("Account deleted successfully", {
        accountId: account._id,
        accountCode: account.accountCode,
        companyId: companyId.toString(),
      });

      return account;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "delete-account",
        companyId: companyId.toString(),
        accountId: accountId.toString(),
      });
      throw error;
    }
  },

  /**
   * Archive an account (soft delete)
   * Sets isActive = false instead of deleting
   */
  archiveAccount: async (
    companyId: string | Types.ObjectId,
    accountId: string | Types.ObjectId,
  ) => {
    try {
      const account = await Account.findOneAndUpdate(
        { _id: accountId, companyId },
        { $set: { isActive: false } },
        { new: true, runValidators: true },
      );

      if (!account) {
        throw new Error("Account not found");
      }

      logger.info("Account archived successfully", {
        accountId: account._id,
        accountCode: account.accountCode,
        companyId: companyId.toString(),
      });

      return account;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "archive-account",
        companyId: companyId.toString(),
        accountId: accountId.toString(),
      });
      throw error;
    }
  },

  /**
   * Restore an archived account
   * Sets isActive = true
   */
  restoreAccount: async (
    companyId: string | Types.ObjectId,
    accountId: string | Types.ObjectId,
  ) => {
    try {
      const account = await Account.findOneAndUpdate(
        { _id: accountId, companyId },
        { $set: { isActive: true } },
        { new: true, runValidators: true },
      );

      if (!account) {
        throw new Error("Account not found");
      }

      logger.info("Account restored successfully", {
        accountId: account._id,
        accountCode: account.accountCode,
        companyId: companyId.toString(),
      });

      return account;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "restore-account",
        companyId: companyId.toString(),
        accountId: accountId.toString(),
      });
      throw error;
    }
  },

  /**
   * Get account balance
   */
  getAccountBalance: async (
    companyId: string | Types.ObjectId,
    accountId: string | Types.ObjectId,
  ) => {
    try {
      const account = await Account.findOne({
        _id: accountId,
        companyId,
      });

      if (!account) {
        throw new Error("Account not found");
      }

      return {
        accountId: account._id,
        accountCode: account.accountCode,
        accountName: account.accountName,
        balance: account.balance,
        normalBalance: account.normalBalance,
      };
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-account-balance",
        companyId: companyId.toString(),
        accountId: accountId.toString(),
      });
      throw error;
    }
  },

  /**
   * Search accounts by code or name
   */
  searchAccounts: async (
    companyId: string | Types.ObjectId,
    searchTerm: string,
  ) => {
    try {
      const regex = new RegExp(searchTerm, "i");
      const accounts = await Account.find({
        companyId,
        $or: [{ accountCode: regex }, { accountName: regex }],
      }).sort({ accountCode: 1 });

      return accounts;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "search-accounts",
        companyId: companyId.toString(),
        searchTerm,
      });
      throw error;
    }
  },

  /**
   * Get chart of accounts with hierarchical structure
   */
  getChartOfAccounts: async (companyId: string | Types.ObjectId) => {
    try {
      const accounts = await Account.find({ companyId }).sort({
        accountType: 1,
        accountCode: 1,
      });

      // Group accounts by type
      const chartOfAccounts = {
        assets: accounts.filter((a) => a.accountType === "Asset"),
        liabilities: accounts.filter((a) => a.accountType === "Liability"),
        equity: accounts.filter((a) => a.accountType === "Equity"),
        revenue: accounts.filter((a) => a.accountType === "Revenue"),
        expenses: accounts.filter((a) => a.accountType === "Expense"),
      };

      return chartOfAccounts;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-chart-of-accounts",
        companyId: companyId.toString(),
      });
      throw error;
    }
  },

  /**
   * Reconcile account balance with ledger
   * Calculates actual balance from ledger and updates Account.balance field
   */
  reconcileAccountBalance: async (
    companyId: string | Types.ObjectId,
    accountId: string | Types.ObjectId,
  ) => {
    try {
      const account = await Account.findOne({ _id: accountId, companyId });

      if (!account) {
        throw new Error("Account not found");
      }

      // Get latest ledger entry for this account to get running balance
      const latestEntry = await Ledger.findOne({
        accountId,
        companyId,
      })
        .sort({ transactionDate: -1, createdAt: -1 })
        .lean();

      const actualBalance = latestEntry?.runningBalance || 0;
      const storedBalance = account.balance;

      // Update if balances don't match
      if (Math.abs(actualBalance - storedBalance) > 0.01) {
        account.balance = actualBalance;
        await account.save();

        logger.info("Account balance reconciled", {
          accountId: account._id.toString(),
          accountCode: account.accountCode,
          companyId: companyId.toString(),
          previousBalance: storedBalance,
          actualBalance,
          difference: actualBalance - storedBalance,
        });

        return {
          accountId: account._id,
          accountCode: account.accountCode,
          accountName: account.accountName,
          previousBalance: storedBalance,
          actualBalance,
          difference: actualBalance - storedBalance,
          reconciled: true,
        };
      }

      return {
        accountId: account._id,
        accountCode: account.accountCode,
        accountName: account.accountName,
        balance: storedBalance,
        reconciled: false,
        message: "Balance already in sync",
      };
    } catch (error) {
      logger.logError(error as Error, {
        operation: "reconcile-account-balance",
        companyId: companyId.toString(),
        accountId: accountId.toString(),
      });
      throw error;
    }
  },

  /**
   * Reconcile all account balances for a company
   * Useful for periodic maintenance or after data migration
   */
  reconcileAllAccountBalances: async (companyId: string | Types.ObjectId) => {
    try {
      const accounts = await Account.find({ companyId });
      const results = [];
      let reconciledCount = 0;
      let totalDifference = 0;

      for (const account of accounts) {
        const result = await accountsService.reconcileAccountBalance(
          companyId,
          account._id,
        );
        results.push(result);

        if (result.reconciled) {
          reconciledCount++;
          totalDifference += Math.abs(result.difference || 0);
        }
      }

      logger.info("All accounts reconciled", {
        companyId: companyId.toString(),
        totalAccounts: accounts.length,
        reconciledCount,
        totalDifference,
      });

      return {
        totalAccounts: accounts.length,
        reconciledCount,
        inSyncCount: accounts.length - reconciledCount,
        totalDifference,
        results,
      };
    } catch (error) {
      logger.logError(error as Error, {
        operation: "reconcile-all-account-balances",
        companyId: companyId.toString(),
      });
      throw error;
    }
  },

  /**
   * Get account balance from ledger (canonical source)
   * This always calculates from ledger, never uses Account.balance
   */
  getAccountBalanceFromLedger: async (
    companyId: string | Types.ObjectId,
    accountId: string | Types.ObjectId,
    asOfDate?: Date,
  ) => {
    try {
      const account = await Account.findOne({ _id: accountId, companyId });

      if (!account) {
        throw new Error("Account not found");
      }

      const query: any = {
        accountId,
        companyId,
      };

      if (asOfDate) {
        query.transactionDate = { $lte: asOfDate };
      }

      const latestEntry = await Ledger.findOne(query)
        .sort({ transactionDate: -1, createdAt: -1 })
        .lean();

      return {
        accountId: account._id,
        accountCode: account.accountCode,
        accountName: account.accountName,
        accountType: account.accountType,
        normalBalance: account.normalBalance,
        balance: latestEntry?.runningBalance || 0,
        asOfDate: asOfDate || new Date(),
        source: "ledger",
      };
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-account-balance-from-ledger",
        companyId: companyId.toString(),
        accountId: accountId.toString(),
      });
      throw error;
    }
  },
};

export default accountsService;
