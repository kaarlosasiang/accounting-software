import mongoose from "mongoose";
import { JournalEntry } from "../../models/JournalEntry.js";
import { Ledger } from "../../models/Ledger.js";
import Account from "../../models/Account.js";
import {
  JournalEntryType,
  JournalEntryStatus,
  IJournalEntryLine,
} from "../../shared/interface/IJournalEntry.js";
import logger from "../../config/logger.js";

interface CreateJournalEntryInput {
  companyId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  entryDate: Date;
  referenceNumber?: string;
  description?: string;
  lines: IJournalEntryLine[];
}

interface UpdateJournalEntryInput {
  entryDate?: Date;
  referenceNumber?: string;
  description?: string;
  lines?: IJournalEntryLine[];
}

/**
 * Journal Entry Service
 * Handles business logic for manual journal entries
 * (Automatic entries are handled by services/journalEntryService.ts)
 */
export const journalEntryService = {
  /**
   * Get all journal entries for a company
   */
  async getAllJournalEntries(
    companyId: string,
    options?: {
      status?: JournalEntryStatus;
      type?: JournalEntryType;
      limit?: number;
      skip?: number;
    },
  ) {
    try {
      const query: any = { companyId: new mongoose.Types.ObjectId(companyId) };

      if (options?.status) {
        query.status = options.status;
      }

      if (options?.type) {
        query.entryType = options.type;
      }

      const entries = await JournalEntry.find(query)
        .sort({ entryDate: -1, createdAt: -1 })
        .limit(options?.limit || 100)
        .skip(options?.skip || 0)
        .populate("createdBy", "firstName lastName email")
        .populate("postedBy", "firstName lastName email")
        .populate("voidedBy", "firstName lastName email")
        .lean();

      return entries;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-all-journal-entries",
        companyId,
      });
      throw error;
    }
  },

  /**
   * Get journal entry by ID
   */
  async getJournalEntryById(companyId: string, entryId: string) {
    try {
      const entry = await JournalEntry.findOne({
        _id: new mongoose.Types.ObjectId(entryId),
        companyId: new mongoose.Types.ObjectId(companyId),
      })
        .populate("createdBy", "firstName lastName email")
        .populate("postedBy", "firstName lastName email")
        .populate("voidedBy", "firstName lastName email")
        .lean();

      if (!entry) {
        throw new Error("Journal entry not found");
      }

      return entry;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-journal-entry-by-id",
        entryId,
      });
      throw error;
    }
  },

  /**
   * Get journal entries by date range
   */
  async getByDateRange(companyId: string, startDate: Date, endDate: Date) {
    try {
      const entries = await JournalEntry.find({
        companyId: new mongoose.Types.ObjectId(companyId),
        entryDate: { $gte: startDate, $lte: endDate },
      })
        .sort({ entryDate: -1 })
        .populate("createdBy", "firstName lastName email")
        .lean();

      return entries;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-journal-entries-by-date-range",
        companyId,
      });
      throw error;
    }
  },

  /**
   * Get journal entries by type
   */
  async getByType(companyId: string, type: JournalEntryType) {
    try {
      const entries = await JournalEntry.find({
        companyId: new mongoose.Types.ObjectId(companyId),
        entryType: type,
      })
        .sort({ entryDate: -1 })
        .populate("createdBy", "firstName lastName email")
        .lean();

      return entries;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-journal-entries-by-type",
        companyId,
        type,
      });
      throw error;
    }
  },

  /**
   * Get journal entries by status
   */
  async getByStatus(companyId: string, status: JournalEntryStatus) {
    try {
      const entries = await JournalEntry.find({
        companyId: new mongoose.Types.ObjectId(companyId),
        status,
      })
        .sort({ entryDate: -1 })
        .populate("createdBy", "firstName lastName email")
        .lean();

      return entries;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-journal-entries-by-status",
        companyId,
        status,
      });
      throw error;
    }
  },

  /**
   * Create a new manual journal entry
   */
  async createJournalEntry(data: CreateJournalEntryInput) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const {
        companyId,
        userId,
        entryDate,
        referenceNumber,
        description,
        lines,
      } = data;

      // Validate that debits equal credits
      const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0);
      const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0);

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new Error(
          `Journal entry is not balanced. Debits: ${totalDebit}, Credits: ${totalCredit}`,
        );
      }

      // Validate all accounts exist and belong to the company
      for (const line of lines) {
        const account = await Account.findOne({
          _id: line.accountId,
          companyId,
        }).session(session);

        if (!account) {
          throw new Error(`Account not found: ${line.accountId}`);
        }

        // Verify account code and name match
        if (account.accountCode !== line.accountCode) {
          throw new Error(
            `Account code mismatch for account ${line.accountId}`,
          );
        }
      }

      // Create the journal entry
      const journalEntry = new JournalEntry({
        companyId,
        entryDate,
        referenceNumber,
        description,
        entryType: JournalEntryType.MANUAL,
        status: JournalEntryStatus.DRAFT,
        lines,
        totalDebit,
        totalCredit,
        createdBy: userId,
      });

      await journalEntry.save({ session });

      await session.commitTransaction();

      logger.info("Manual journal entry created", {
        entryId: journalEntry._id,
        companyId,
      });

      return journalEntry;
    } catch (error) {
      await session.abortTransaction();
      logger.logError(error as Error, {
        operation: "create-journal-entry",
        companyId: data.companyId,
      });
      throw error;
    } finally {
      session.endSession();
    }
  },

  /**
   * Update a journal entry (draft only)
   */
  async updateJournalEntry(
    companyId: string,
    entryId: string,
    userId: string,
    updates: UpdateJournalEntryInput,
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const entry = await JournalEntry.findOne({
        _id: new mongoose.Types.ObjectId(entryId),
        companyId: new mongoose.Types.ObjectId(companyId),
      }).session(session);

      if (!entry) {
        throw new Error("Journal entry not found");
      }

      if (entry.status !== JournalEntryStatus.DRAFT) {
        throw new Error("Only draft entries can be updated");
      }

      // Update fields
      if (updates.entryDate) entry.entryDate = updates.entryDate;
      if (updates.referenceNumber !== undefined)
        entry.referenceNumber = updates.referenceNumber;
      if (updates.description !== undefined)
        entry.description = updates.description;

      // Update lines if provided
      if (updates.lines) {
        // Validate balance
        const totalDebit = updates.lines.reduce(
          (sum, line) => sum + line.debit,
          0,
        );
        const totalCredit = updates.lines.reduce(
          (sum, line) => sum + line.credit,
          0,
        );

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
          throw new Error(
            `Journal entry is not balanced. Debits: ${totalDebit}, Credits: ${totalCredit}`,
          );
        }

        // Validate accounts
        for (const line of updates.lines) {
          const account = await Account.findOne({
            _id: line.accountId,
            companyId: new mongoose.Types.ObjectId(companyId),
          }).session(session);

          if (!account) {
            throw new Error(`Account not found: ${line.accountId}`);
          }
        }

        entry.lines = updates.lines;
        entry.totalDebit = totalDebit;
        entry.totalCredit = totalCredit;
      }

      await entry.save({ session });

      await session.commitTransaction();

      logger.info("Journal entry updated", { entryId, companyId });

      return entry;
    } catch (error) {
      await session.abortTransaction();
      logger.logError(error as Error, {
        operation: "update-journal-entry",
        entryId,
      });
      throw error;
    } finally {
      session.endSession();
    }
  },

  /**
   * Delete a journal entry (draft only)
   */
  async deleteJournalEntry(companyId: string, entryId: string) {
    try {
      const entry = await JournalEntry.findOne({
        _id: new mongoose.Types.ObjectId(entryId),
        companyId: new mongoose.Types.ObjectId(companyId),
      });

      if (!entry) {
        throw new Error("Journal entry not found");
      }

      if (entry.status !== JournalEntryStatus.DRAFT) {
        throw new Error("Only draft entries can be deleted");
      }

      await entry.deleteOne();

      logger.info("Journal entry deleted", { entryId, companyId });

      return { success: true, message: "Journal entry deleted successfully" };
    } catch (error) {
      logger.logError(error as Error, {
        operation: "delete-journal-entry",
        entryId,
      });
      throw error;
    }
  },

  /**
   * Post a journal entry (create ledger entries)
   */
  async postJournalEntry(companyId: string, entryId: string, userId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const entry = await JournalEntry.findOne({
        _id: new mongoose.Types.ObjectId(entryId),
        companyId: new mongoose.Types.ObjectId(companyId),
      }).session(session);

      if (!entry) {
        throw new Error("Journal entry not found");
      }

      if (entry.status !== JournalEntryStatus.DRAFT) {
        throw new Error("Only draft entries can be posted");
      }

      // Change status to posted
      entry.status = JournalEntryStatus.POSTED;
      entry.postedBy = new mongoose.Types.ObjectId(userId);
      await entry.save({ session });

      // Create ledger entries for each line
      const ledgerEntries = [];
      for (const line of entry.lines) {
        const account = await Account.findById(line.accountId).session(session);
        if (!account) {
          throw new Error(`Account not found: ${line.accountId}`);
        }

        // Calculate running balance (simplified - should get previous balance)
        const previousBalance = await this.getAccountBalance(
          companyId,
          line.accountId.toString(),
          entry.entryDate,
        );

        let runningBalance = previousBalance;

        // Update balance based on account type
        if (["Asset", "Expense"].includes(account.accountType)) {
          // Normal debit balance accounts
          runningBalance += line.debit - line.credit;
        } else {
          // Normal credit balance accounts (Liability, Equity, Revenue)
          runningBalance += line.credit - line.debit;
        }

        const ledgerEntry = new Ledger({
          companyId: entry.companyId,
          accountId: line.accountId,
          accountName: line.accountName,
          journalEntryId: entry._id,
          entryNumber: entry.entryNumber,
          transactionDate: entry.entryDate,
          description: line.description || entry.description || "",
          debit: line.debit.toString(),
          credit: line.credit.toString(),
          runningBalance,
        });

        ledgerEntries.push(ledgerEntry);
      }

      await Ledger.insertMany(ledgerEntries, { session });

      await session.commitTransaction();

      logger.info("Journal entry posted", { entryId, companyId });

      return entry;
    } catch (error) {
      await session.abortTransaction();
      logger.logError(error as Error, {
        operation: "post-journal-entry",
        entryId,
      });
      throw error;
    } finally {
      session.endSession();
    }
  },

  /**
   * Void a journal entry (reverse it)
   */
  async voidJournalEntry(companyId: string, entryId: string, userId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const entry = await JournalEntry.findOne({
        _id: new mongoose.Types.ObjectId(entryId),
        companyId: new mongoose.Types.ObjectId(companyId),
      }).session(session);

      if (!entry) {
        throw new Error("Journal entry not found");
      }

      if (entry.status !== JournalEntryStatus.POSTED) {
        throw new Error("Only posted entries can be voided");
      }

      // Update status to void
      entry.status = JournalEntryStatus.VOID;
      entry.voidedAt = new Date();
      entry.voidedBy = new mongoose.Types.ObjectId(userId);
      await entry.save({ session });

      // Create reversing ledger entries
      const reversalEntries = [];
      for (const line of entry.lines) {
        const account = await Account.findById(line.accountId).session(session);
        if (!account) continue;

        const previousBalance = await this.getAccountBalance(
          companyId,
          line.accountId.toString(),
          new Date(),
        );

        let runningBalance = previousBalance;

        // Reverse the original entry
        if (["Asset", "Expense"].includes(account.accountType)) {
          runningBalance += line.credit - line.debit; // Opposite of posting
        } else {
          runningBalance += line.debit - line.credit; // Opposite of posting
        }

        const reversalEntry = new Ledger({
          companyId: entry.companyId,
          accountId: line.accountId,
          accountName: line.accountName,
          journalEntryId: entry._id,
          entryNumber: `${entry.entryNumber}-VOID`,
          transactionDate: new Date(),
          description: `VOID: ${line.description || entry.description || ""}`,
          debit: line.credit.toString(), // Swap debit and credit
          credit: line.debit.toString(),
          runningBalance,
        });

        reversalEntries.push(reversalEntry);
      }

      await Ledger.insertMany(reversalEntries, { session });

      await session.commitTransaction();

      logger.info("Journal entry voided", { entryId, companyId });

      return entry;
    } catch (error) {
      await session.abortTransaction();
      logger.logError(error as Error, {
        operation: "void-journal-entry",
        entryId,
      });
      throw error;
    } finally {
      session.endSession();
    }
  },

  /**
   * Helper: Get account balance up to a date
   */
  async getAccountBalance(
    companyId: string,
    accountId: string,
    upToDate: Date,
  ): Promise<number> {
    try {
      const ledgerEntries = await Ledger.find({
        companyId: new mongoose.Types.ObjectId(companyId),
        accountId: new mongoose.Types.ObjectId(accountId),
        transactionDate: { $lte: upToDate }, // $lte so same-date prior entries are included
      })
        .sort({ transactionDate: -1, createdAt: -1 })
        .limit(1);

      return ledgerEntries.length > 0 ? ledgerEntries[0].runningBalance : 0;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-account-balance",
        accountId,
      });
      return 0;
    }
  },
};
