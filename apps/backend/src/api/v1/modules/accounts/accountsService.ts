import { Types } from "mongoose";

import logger from "../../config/logger.js";
import Account from "../../models/Account.js";
import { Ledger } from "../../models/Ledger.js";
import { JournalEntryService } from "../../services/journalEntryService.js";
import { escapeRegex } from "../../shared/helpers/escapeRegex.js";
import { round2 } from "../../shared/helpers/money.js";
import { JournalEntryType } from "../../shared/interface/IJournalEntry.js";
import { ledgerService } from "../ledger/ledgerService.js";

/**
 * Accounts Service
 * Handles all account-related business logic
 */
/**
 * Ensure a parent account exists in the same company.
 */
async function assertParentInCompany(
  companyId: string | Types.ObjectId,
  parentAccount: string | Types.ObjectId,
) {
  const parent = await Account.exists({ _id: parentAccount, companyId });
  if (!parent) {
    throw new Error("Parent account not found in this company");
  }
}

/**
 * Post an account's starting balance against Opening Balance Equity
 * (created on demand).
 */
async function postOpeningBalance(
  companyId: string | Types.ObjectId,
  account: { _id: Types.ObjectId; accountType: string; accountName: string },
  amount: number,
  userId: string,
) {
  let equity = await Account.findOne({
    companyId,
    accountType: "Equity",
    accountName: /^opening balance equity$/i,
  });
  if (!equity) {
    const code = ["3900", "3950", "3999"];
    for (const accountCode of code) {
      if (await Account.exists({ companyId, accountCode })) continue;
      equity = await Account.create({
        companyId,
        accountCode,
        accountName: "Opening Balance Equity",
        accountType: "Equity",
        subType: "Owner's Equity",
        normalBalance: "Credit",
        balance: 0,
        isActive: true,
      });
      break;
    }
  }
  if (!equity) {
    throw new Error(
      "Could not create an Opening Balance Equity account. Please create one and post the opening balance as a journal entry.",
    );
  }

  const value = round2(Math.abs(amount));
  const debitNormal =
    account.accountType === "Asset" || account.accountType === "Expense";
  // A positive amount increases the account in its normal direction.
  const debitAccount = debitNormal ? amount > 0 : amount < 0;

  await JournalEntryService.postEntry({
    companyId,
    userId,
    entryDate: new Date(),
    entryType: JournalEntryType.MANUAL,
    description: `Opening balance - ${account.accountName}`,
    referenceNumber: "OPENING-BALANCE",
    lines: [
      {
        accountId: account._id,
        debit: debitAccount ? value : 0,
        credit: debitAccount ? 0 : value,
        description: "Opening balance",
      },
      {
        accountId: equity._id,
        debit: debitAccount ? 0 : value,
        credit: debitAccount ? value : 0,
        description: `Opening balance - ${account.accountName}`,
      },
    ],
  });
}

const accountsService = {
  /**
   * Get all accounts for a company
   */
  getAllAccounts: async (companyId: string | Types.ObjectId) => {
    try {
      const accounts = await Account.find({ companyId }).sort({
        accountCode: 1,
      });

      // Live balances from the ledger in ONE aggregate. The response carries
      // the live value; nothing is written on a read.
      const balances = await ledgerService.getBalancesByAccount(
        companyId.toString(),
        accounts,
      );
      for (const account of accounts) {
        account.balance = balances.get(account._id.toString()) ?? 0;
      }

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
    userId?: string,
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

      if (accountData.parentAccount) {
        await assertParentInCompany(companyId, accountData.parentAccount);
      }

      const { balance: openingBalance, ...fields } = accountData;
      const account = new Account({
        ...fields,
        companyId,
        balance: 0,
      });

      await account.save();
      logger.info("Account created successfully", {
        accountId: account._id,
        accountCode: account.accountCode,
        companyId: companyId.toString(),
      });

      // A starting balance must go through the ledger, otherwise it is not
      // part of any report and the books no longer balance.
      if (openingBalance && round2(openingBalance) !== 0) {
        if (!userId) {
          throw new Error("A user is required to post an opening balance");
        }
        await postOpeningBalance(companyId, account, openingBalance, userId);
        account.balance = round2(openingBalance);
      }

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
      const allowed = [
        "accountName",
        "accountType",
        "normalBalance",
        "subType",
        "description",
        "parentAccount",
      ] as const;
      const changes: Record<string, unknown> = {};
      for (const key of allowed) {
        if ((updateData as any)[key] !== undefined) {
          changes[key] = (updateData as any)[key];
        }
      }

      const current = await Account.findOne({ _id: accountId, companyId });
      if (!current) {
        throw new Error("Account not found");
      }

      const typeChanging =
        (changes.accountType !== undefined &&
          changes.accountType !== current.accountType) ||
        (changes.normalBalance !== undefined &&
          changes.normalBalance !== current.normalBalance);
      if (typeChanging) {
        const hasActivity = await Ledger.exists({
          companyId: current.companyId,
          accountId: current._id,
        });
        if (hasActivity) {
          throw new Error(
            "Cannot change the type or normal balance of an account that has transactions. Create a new account and reclassify with a journal entry instead.",
          );
        }
      }

      if (changes.parentAccount) {
        if (String(changes.parentAccount) === String(current._id)) {
          throw new Error("An account cannot be its own parent");
        }
        await assertParentInCompany(companyId, changes.parentAccount as any);
      }

      const account = await Account.findOneAndUpdate(
        { _id: accountId, companyId },
        { $set: changes },
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

      const { balance } = await ledgerService.getAccountBalance(
        companyId.toString(),
        account._id.toString(),
      );

      return {
        accountId: account._id,
        accountCode: account.accountCode,
        accountName: account.accountName,
        balance,
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
      const regex = new RegExp(escapeRegex(searchTerm), "i");
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

      const { balance: actualBalance } = await ledgerService.getAccountBalance(
        companyId.toString(),
        account._id.toString(),
      );
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

      const { balance } = await ledgerService.getAccountBalance(
        companyId.toString(),
        account._id.toString(),
        asOfDate,
      );

      return {
        accountId: account._id,
        accountCode: account.accountCode,
        accountName: account.accountName,
        accountType: account.accountType,
        normalBalance: account.normalBalance,
        balance,
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
