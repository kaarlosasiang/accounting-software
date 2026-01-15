import Account from "../../models/Account.js";
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
    accountType: string
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
    accountId: string | Types.ObjectId
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
    }
  ) => {
    try {
      // Check if account code already exists for this company
      const existingAccount = await Account.findOne({
        companyId,
        accountCode: accountData.accountCode,
      });

      if (existingAccount) {
        throw new Error(
          `Account with code ${accountData.accountCode} already exists for this company`
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
    }>
  ) => {
    try {
      const account = await Account.findOneAndUpdate(
        { _id: accountId, companyId },
        { $set: updateData },
        { new: true, runValidators: true }
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
   * Delete an account
   */
  deleteAccount: async (
    companyId: string | Types.ObjectId,
    accountId: string | Types.ObjectId
  ) => {
    try {
      const account = await Account.findOneAndDelete({
        _id: accountId,
        companyId,
      });

      if (!account) {
        throw new Error("Account not found");
      }

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
   * Get account balance
   */
  getAccountBalance: async (
    companyId: string | Types.ObjectId,
    accountId: string | Types.ObjectId
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
    searchTerm: string
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
};

export default accountsService;
