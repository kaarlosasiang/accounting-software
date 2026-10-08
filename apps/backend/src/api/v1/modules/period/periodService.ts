import mongoose from "mongoose";

import logger from "../../config/logger.js";
import Account from "../../models/Account.js";
import { AccountingPeriod } from "../../models/AccountingPeriod.js";
import {
  findSystemAccount,
  SystemAccount,
} from "../../services/accountResolver.js";
import { JournalEntryService } from "../../services/journalEntryService.js";
import { round2 } from "../../shared/helpers/money.js";
import {
  PeriodStatus,
  PeriodType,
} from "../../shared/interface/IAccountingPeriod.js";
import { JournalEntryType } from "../../shared/interface/IJournalEntry.js";
import { ledgerService } from "../ledger/ledgerService.js";

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
   * - Posts a closing journal entry that zeroes every revenue and expense
   *   account (cumulative ledger balance up to the period end, including any
   *   earlier closings) into Retained Earnings
   * - Sets status to Closed and records who closed it and when
   */
  async closePeriod(companyId: string, periodId: string, userId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const companyObjectId = new mongoose.Types.ObjectId(companyId);
      const period = await AccountingPeriod.findOne({
        _id: periodId,
        companyId: companyObjectId,
      }).session(session);

      if (!period) {
        throw new Error("Accounting period not found");
      }

      if (period.status !== PeriodStatus.OPEN) {
        throw new Error(
          `Cannot close period. Current status is "${period.status}". Only "Open" periods can be closed.`,
        );
      }

      // Include inactive accounts: an archived account can still carry a
      // balance that must be closed.
      const plAccounts = await Account.find({
        companyId: companyObjectId,
        accountType: { $in: ["Revenue", "Expense"] },
      })
        .session(session)
        .lean();

      const retainedEarningsAccount = await this.getOrCreateRetainedEarnings(
        companyObjectId,
        session,
      );

      const balances = await ledgerService.getBalancesByAccount(
        companyId,
        plAccounts,
        { to: period.endDate },
      );

      const closingLines: Array<{
        accountId: string;
        debit: number;
        credit: number;
        description: string;
      }> = [];
      let totalRevenue = 0;
      let totalExpenses = 0;

      for (const account of plAccounts) {
        const balance = balances.get(account._id.toString()) ?? 0;
        if (balance === 0) continue;

        const isRevenue = account.accountType === "Revenue";
        if (isRevenue) totalRevenue += balance;
        else totalExpenses += balance;

        // Post the opposite of the account's normal-direction balance.
        // A negative balance (contra account) flips sides.
        const amount = Math.abs(balance);
        const debitSide = isRevenue ? balance > 0 : balance < 0;
        closingLines.push({
          accountId: account._id.toString(),
          debit: debitSide ? amount : 0,
          credit: debitSide ? 0 : amount,
          description: `Close ${account.accountName} to Retained Earnings`,
        });
      }

      totalRevenue = round2(totalRevenue);
      totalExpenses = round2(totalExpenses);
      const netIncome = round2(totalRevenue - totalExpenses);

      if (netIncome !== 0) {
        closingLines.push({
          accountId: retainedEarningsAccount._id.toString(),
          debit: netIncome < 0 ? Math.abs(netIncome) : 0,
          credit: netIncome > 0 ? netIncome : 0,
          description: `Net ${netIncome > 0 ? "Income" : "Loss"} for ${period.periodName}`,
        });
      }

      let closingJournalEntry = null;
      if (closingLines.length > 0) {
        closingJournalEntry = await JournalEntryService.postEntry({
          companyId,
          userId,
          entryDate: period.endDate,
          entryType: JournalEntryType.MANUAL,
          description: `Closing entry for ${period.periodName}`,
          referenceNumber: `CLOSE-${period.periodName.replace(/\s+/g, "-")}`,
          lines: closingLines,
          isClosingEntry: true,
          sourceType: "Period",
          sourceId: period._id,
          allowInactiveAccounts: true,
          session,
        });
      }

      period.status = PeriodStatus.CLOSED;
      period.closedBy = new mongoose.Types.ObjectId(userId);
      period.closedAt = new Date();
      if (closingJournalEntry) {
        period.closingJournalEntryId = closingJournalEntry._id as any;
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
          revenueAccountsClosed: plAccounts.filter(
            (a) =>
              a.accountType === "Revenue" &&
              (balances.get(a._id.toString()) ?? 0) !== 0,
          ).length,
          expenseAccountsClosed: plAccounts.filter(
            (a) =>
              a.accountType === "Expense" &&
              (balances.get(a._id.toString()) ?? 0) !== 0,
          ).length,
        },
      };
    } catch (error) {
      if (session.inTransaction()) await session.abortTransaction();
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
   * Find the Retained Earnings account (by name/subtype — NOT by code: the
   * seeded chart uses 3200 for Common Stock), creating it if missing.
   */
  async getOrCreateRetainedEarnings(
    companyId: mongoose.Types.ObjectId,
    session: mongoose.ClientSession,
  ) {
    const existing = await findSystemAccount(
      companyId,
      SystemAccount.RETAINED_EARNINGS,
      session,
    );
    if (existing) return existing;

    for (const code of ["3300", "3900", "3990"]) {
      const taken = await Account.exists({
        companyId,
        accountCode: code,
      }).session(session);
      if (taken) continue;

      const [created] = await Account.create(
        [
          {
            companyId,
            accountCode: code,
            accountName: "Retained Earnings",
            accountType: "Equity",
            subType: "Retained Earnings",
            normalBalance: "Credit",
            balance: 0,
            isActive: true,
          },
        ],
        { session },
      );
      logger.info("Created Retained Earnings account", {
        accountId: created._id,
        companyId: companyId.toString(),
      });
      return created.toObject();
    }

    throw new Error(
      "Retained Earnings account not found and no free account code to create one. Please add a Retained Earnings equity account.",
    );
  },

  /**
   * Reopen a closed period
   * - Reverses the closing journal entry (dated at the period end, so the
   *   reversal stays inside the period)
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

      if (period.closingJournalEntryId) {
        await JournalEntryService.reverseEntry({
          companyId,
          journalEntryId: period.closingJournalEntryId,
          userId,
          date: period.endDate,
          reason: `Reopened ${period.periodName}`,
          session,
        });
      }

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
      if (session.inTransaction()) await session.abortTransaction();
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
