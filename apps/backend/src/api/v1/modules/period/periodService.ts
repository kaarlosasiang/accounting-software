import mongoose from "mongoose";
import { AccountingPeriod } from "../../models/AccountingPeriod.js";
import {
  PeriodStatus,
  PeriodType,
} from "../../shared/interface/IAccountingPeriod.js";
import { JournalEntryService } from "../../services/journalEntryService.js";
import Account from "../../models/Account.js";
import logger from "../../config/logger.js";

/**
 * Accounting Period Service
 * Handles fiscal period management, closing, and locking
 */
export const periodService = {
  /**
   * Get all periods for a company
   */
  async getAllPeriods(
    companyId: string,
    options?: {
      fiscalYear?: number;
      status?: PeriodStatus;
    },
  ) {
    try {
      const query: any = {
        companyId: new mongoose.Types.ObjectId(companyId),
      };

      if (options?.fiscalYear) {
        query.fiscalYear = options.fiscalYear;
      }

      if (options?.status) {
        query.status = options.status;
      }

      const periods = await AccountingPeriod.find(query)
        .populate("closedBy", "first_name last_name email")
        .populate("closingJournalEntryId", "journalEntryNumber description")
        .sort({ startDate: -1 });

      return periods;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-all-periods",
        companyId,
      });
      throw error;
    }
  },

  /**
   * Get period by ID
   */
  async getPeriodById(companyId: string, periodId: string) {
    try {
      const period = await AccountingPeriod.findOne({
        _id: periodId,
        companyId: new mongoose.Types.ObjectId(companyId),
      })
        .populate("closedBy", "first_name last_name email")
        .populate("closingJournalEntryId", "journalEntryNumber description");

      if (!period) {
        throw new Error("Accounting period not found");
      }

      return period;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-period-by-id",
        companyId,
        periodId,
      });
      throw error;
    }
  },

  /**
   * Create a new accounting period
   */
  async createPeriod(
    companyId: string,
    periodData: {
      periodName: string;
      periodType: PeriodType;
      fiscalYear: number;
      startDate: Date;
      endDate: Date;
      notes?: string;
    },
  ) {
    try {
      // Check for overlapping periods
      const overlappingPeriod = await AccountingPeriod.findOne({
        companyId: new mongoose.Types.ObjectId(companyId),
        $or: [
          {
            startDate: { $lte: periodData.endDate },
            endDate: { $gte: periodData.startDate },
          },
        ],
      });

      if (overlappingPeriod) {
        throw new Error(
          `Period overlaps with existing period "${overlappingPeriod.periodName}" ` +
            `(${overlappingPeriod.startDate.toISOString().split("T")[0]} to ` +
            `${overlappingPeriod.endDate.toISOString().split("T")[0]})`,
        );
      }

      const period = new AccountingPeriod({
        companyId: new mongoose.Types.ObjectId(companyId),
        ...periodData,
        status: PeriodStatus.OPEN,
      });

      await period.save();

      logger.info("Accounting period created", {
        periodId: period._id,
        periodName: period.periodName,
        companyId,
      });

      return period;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "create-period",
        companyId,
      });
      throw error;
    }
  },

  /**
   * Close a period
   * - Creates closing journal entry (Revenue/Expense → Retained Earnings)
   * - Sets status to Closed
   * - Records who closed it and when
   */
  async closePeriod(companyId: string, periodId: string, userId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const period = await AccountingPeriod.findOne({
        _id: periodId,
        companyId: new mongoose.Types.ObjectId(companyId),
      }).session(session);

      if (!period) {
        throw new Error("Accounting period not found");
      }

      if (period.status !== PeriodStatus.OPEN) {
        throw new Error(
          `Cannot close period. Current status is "${period.status}". Only "Open" periods can be closed.`,
        );
      }

      // Get all Revenue and Expense accounts
      const revenueAccounts = await Account.find({
        companyId: new mongoose.Types.ObjectId(companyId),
        accountType: "Revenue",
        isActive: true,
      }).session(session);

      const expenseAccounts = await Account.find({
        companyId: new mongoose.Types.ObjectId(companyId),
        accountType: "Expense",
        isActive: true,
      }).session(session);

      // Find or create Retained Earnings account
      let retainedEarningsAccount = await Account.findOne({
        companyId: new mongoose.Types.ObjectId(companyId),
        accountCode: "3200", // Standard code for Retained Earnings
        accountType: "Equity",
      }).session(session);

      if (!retainedEarningsAccount) {
        // Create Retained Earnings account if it doesn't exist
        retainedEarningsAccount = new Account({
          companyId: new mongoose.Types.ObjectId(companyId),
          accountCode: "3200",
          accountName: "Retained Earnings",
          accountType: "Equity",
          normalBalance: "Credit",
          balance: 0,
          isActive: true,
        });
        await retainedEarningsAccount.save({ session });

        logger.info("Created Retained Earnings account", {
          accountId: retainedEarningsAccount._id,
          companyId,
        });
      }

      // Calculate net income (Revenue - Expenses)
      // Revenue accounts have credit balances, so we use their balance directly
      // Expense accounts have debit balances, so we subtract them
      const totalRevenue = revenueAccounts.reduce(
        (sum, acc) => sum + (acc.balance || 0),
        0,
      );
      const totalExpenses = expenseAccounts.reduce(
        (sum, acc) => sum + (acc.balance || 0),
        0,
      );

      const netIncome = totalRevenue - totalExpenses;

      // Create closing journal entry
      const closingEntries: Array<{
        accountId: string;
        debit: string;
        credit: string;
        description: string;
      }> = [];

      // Close Revenue accounts (debit Revenue, credit Retained Earnings)
      for (const account of revenueAccounts) {
        if (account.balance && account.balance !== 0) {
          closingEntries.push({
            accountId: account._id.toString(),
            debit: account.balance.toFixed(2),
            credit: "0.00",
            description: `Close ${account.accountName} to Retained Earnings`,
          });
        }
      }

      // Close Expense accounts (credit Expense, debit Retained Earnings)
      for (const account of expenseAccounts) {
        if (account.balance && account.balance !== 0) {
          closingEntries.push({
            accountId: account._id.toString(),
            debit: "0.00",
            credit: account.balance.toFixed(2),
            description: `Close ${account.accountName} to Retained Earnings`,
          });
        }
      }

      // Transfer net income to Retained Earnings
      if (netIncome !== 0) {
        closingEntries.push({
          accountId: retainedEarningsAccount._id.toString(),
          debit: netIncome < 0 ? Math.abs(netIncome).toFixed(2) : "0.00",
          credit: netIncome > 0 ? netIncome.toFixed(2) : "0.00",
          description: `Net ${netIncome > 0 ? "Income" : "Loss"} for ${period.periodName}`,
        });
      }

      let closingJournalEntry = null;

      // Only create closing entry if there are transactions to close
      if (closingEntries.length > 0) {
        closingJournalEntry = await JournalEntryService.createJournalEntry(
          companyId,
          userId,
          {
            transactionDate: period.endDate,
            description: `Closing entry for ${period.periodName}`,
            referenceNumber: `CLOSE-${period.periodName.replace(/\s+/g, "-")}`,
            entries: closingEntries,
            notes: `Automated closing entry. Net ${netIncome >= 0 ? "Income" : "Loss"}: ${Math.abs(netIncome).toFixed(2)}`,
            isClosingEntry: true,
          },
          session,
        );
      }

      // Update period status
      period.status = PeriodStatus.CLOSED;
      period.closedBy = new mongoose.Types.ObjectId(userId);
      period.closedAt = new Date();
      if (closingJournalEntry) {
        period.closingJournalEntryId = closingJournalEntry._id;
      }

      await period.save({ session });

      await session.commitTransaction();

      logger.info("Period closed successfully", {
        periodId: period._id,
        periodName: period.periodName,
        netIncome,
        closingEntryId: closingJournalEntry?._id,
        companyId,
      });

      return {
        period,
        closingEntry: closingJournalEntry,
        netIncome,
        summary: {
          totalRevenue,
          totalExpenses,
          netIncome,
          revenueAccountsClosed: revenueAccounts.length,
          expenseAccountsClosed: expenseAccounts.length,
        },
      };
    } catch (error) {
      await session.abortTransaction();
      logger.logError(error as Error, {
        operation: "close-period",
        companyId,
        periodId,
      });
      throw error;
    } finally {
      session.endSession();
    }
  },

  /**
   * Reopen a closed period
   * - Reverses the closing journal entry
   * - Sets status back to Open
   */
  async reopenPeriod(companyId: string, periodId: string, userId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const period = await AccountingPeriod.findOne({
        _id: periodId,
        companyId: new mongoose.Types.ObjectId(companyId),
      }).session(session);

      if (!period) {
        throw new Error("Accounting period not found");
      }

      if (period.status !== PeriodStatus.CLOSED) {
        throw new Error(
          `Cannot reopen period. Current status is "${period.status}". Only "Closed" periods can be reopened.`,
        );
      }

      // Void the closing journal entry if it exists
      if (period.closingJournalEntryId) {
        await JournalEntryService.voidJournalEntry(
          companyId,
          period.closingJournalEntryId.toString(),
          userId,
          session,
        );
      }

      // Update period status
      period.status = PeriodStatus.OPEN;
      period.closedBy = undefined;
      period.closedAt = undefined;
      period.closingJournalEntryId = undefined;

      await period.save({ session });

      await session.commitTransaction();

      logger.info("Period reopened successfully", {
        periodId: period._id,
        periodName: period.periodName,
        companyId,
      });

      return period;
    } catch (error) {
      await session.abortTransaction();
      logger.logError(error as Error, {
        operation: "reopen-period",
        companyId,
        periodId,
      });
      throw error;
    } finally {
      session.endSession();
    }
  },

  /**
   * Lock a period (prevent any modifications)
   * Locked periods cannot be reopened
   */
  async lockPeriod(companyId: string, periodId: string) {
    try {
      const period = await AccountingPeriod.findOne({
        _id: periodId,
        companyId: new mongoose.Types.ObjectId(companyId),
      });

      if (!period) {
        throw new Error("Accounting period not found");
      }

      if (period.status !== PeriodStatus.CLOSED) {
        throw new Error(
          `Cannot lock period. Period must be closed first. Current status: "${period.status}"`,
        );
      }

      period.status = PeriodStatus.LOCKED;
      await period.save();

      logger.info("Period locked successfully", {
        periodId: period._id,
        periodName: period.periodName,
        companyId,
      });

      return period;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "lock-period",
        companyId,
        periodId,
      });
      throw error;
    }
  },

  /**
   * Check if a transaction date is in a closed/locked period
   * Returns the period if date is in a closed/locked period, null otherwise
   */
  async checkDateInClosedPeriod(companyId: string, transactionDate: Date) {
    try {
      const period = await AccountingPeriod.findOne({
        companyId: new mongoose.Types.ObjectId(companyId),
        startDate: { $lte: transactionDate },
        endDate: { $gte: transactionDate },
        status: { $in: [PeriodStatus.CLOSED, PeriodStatus.LOCKED] },
      });

      return period;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "check-date-in-closed-period",
        companyId,
      });
      throw error;
    }
  },

  /**
   * Find period containing a specific date
   */
  async findPeriodForDate(companyId: string, date: Date) {
    try {
      const period = await AccountingPeriod.findOne({
        companyId: new mongoose.Types.ObjectId(companyId),
        startDate: { $lte: date },
        endDate: { $gte: date },
      });

      return period;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "find-period-for-date",
        companyId,
      });
      throw error;
    }
  },

  /**
   * Update period details
   */
  async updatePeriod(
    companyId: string,
    periodId: string,
    updateData: {
      periodName?: string;
      notes?: string;
    },
  ) {
    try {
      const period = await AccountingPeriod.findOne({
        _id: periodId,
        companyId: new mongoose.Types.ObjectId(companyId),
      });

      if (!period) {
        throw new Error("Accounting period not found");
      }

      if (period.status === PeriodStatus.LOCKED) {
        throw new Error("Cannot update a locked period");
      }

      if (updateData.periodName) {
        period.periodName = updateData.periodName;
      }

      if (updateData.notes !== undefined) {
        period.notes = updateData.notes;
      }

      await period.save();

      logger.info("Period updated successfully", {
        periodId: period._id,
        companyId,
      });

      return period;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "update-period",
        companyId,
        periodId,
      });
      throw error;
    }
  },

  /**
   * Delete a period (only if it's open and has no transactions)
   */
  async deletePeriod(companyId: string, periodId: string) {
    try {
      const period = await AccountingPeriod.findOne({
        _id: periodId,
        companyId: new mongoose.Types.ObjectId(companyId),
      });

      if (!period) {
        throw new Error("Accounting period not found");
      }

      if (period.status !== PeriodStatus.OPEN) {
        throw new Error(
          `Cannot delete period with status "${period.status}". Only "Open" periods can be deleted.`,
        );
      }

      await AccountingPeriod.deleteOne({ _id: periodId });

      logger.info("Period deleted successfully", {
        periodId,
        periodName: period.periodName,
        companyId,
      });

      return period;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "delete-period",
        companyId,
        periodId,
      });
      throw error;
    }
  },
};
