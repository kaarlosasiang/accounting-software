import mongoose from "mongoose";

import logger from "../../config/logger.js";
import { Invoice } from "../../models/Invoice.js";
import { JournalEntry } from "../../models/JournalEntry.js";
import {
  JournalEntryService,
  PostingLineInput,
} from "../../services/journalEntryService.js";
import {
  JournalEntryStatus,
  JournalEntryType,
} from "../../shared/interface/IJournalEntry.js";
import { ledgerService } from "../ledger/ledgerService.js";

interface CreateJournalEntryInput {
  companyId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  entryDate: Date;
  referenceNumber?: string;
  description?: string;
  lines: PostingLineInput[];
}

interface UpdateJournalEntryInput {
  entryDate?: Date;
  referenceNumber?: string;
  description?: string;
  lines?: PostingLineInput[];
}

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
      const companyObjectId = new mongoose.Types.ObjectId(companyId);
      const entryObjectId = new mongoose.Types.ObjectId(entryId);

      const entry = await JournalEntry.findOne({
        _id: entryObjectId,
        companyId: companyObjectId,
      })
        .populate("createdBy", "firstName lastName email")
        .populate("postedBy", "firstName lastName email")
        .populate("voidedBy", "firstName lastName email")
        .lean();

      if (!entry) {
        throw new Error("Journal entry not found");
      }

      if (entry.entryType === JournalEntryType.AUTO_INVOICE) {
        const correctedDescription = await getInvoiceCustomerDescription(
          companyObjectId,
          entryObjectId,
        );

        if (correctedDescription) {
          entry.lines = entry.lines.map((line) => ({
            ...line,
            description: hasMalformedInvoiceDescription(line.description)
              ? correctedDescription
              : line.description,
          }));
        }
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
   * Create a new manual journal entry (saved as a DRAFT).
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

      await JournalEntryService.validatePeriodNotClosed(
        companyId,
        entryDate,
        false,
        session,
      );

      // Resolves accounts from the DB (company-scoped, active), rounds
      // amounts and rejects negative values. Balance is enforced by the model.
      const builtLines = await JournalEntryService.buildLines(
        companyId,
        lines ?? [],
        { session },
      );

      const journalEntry = new JournalEntry({
        companyId,
        entryDate,
        referenceNumber,
        description,
        entryType: JournalEntryType.MANUAL,
        status: JournalEntryStatus.DRAFT,
        lines: builtLines,
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
      if (session.inTransaction()) await session.abortTransaction();
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

      if (updates.entryDate) {
        await JournalEntryService.validatePeriodNotClosed(
          companyId,
          updates.entryDate,
          false,
          session,
        );
        entry.entryDate = updates.entryDate;
      }
      if (updates.referenceNumber !== undefined)
        entry.referenceNumber = updates.referenceNumber;
      if (updates.description !== undefined)
        entry.description = updates.description;

      if (updates.lines) {
        entry.lines = await JournalEntryService.buildLines(
          companyId,
          updates.lines,
          { session },
        );
      }

      await entry.save({ session });

      await session.commitTransaction();

      logger.info("Journal entry updated", { entryId, companyId, userId });

      return entry;
    } catch (error) {
      if (session.inTransaction()) await session.abortTransaction();
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
   * Post a draft journal entry (writes ledger rows via the posting engine)
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

      await JournalEntryService.postDraftEntry(entry, userId, session);

      await session.commitTransaction();

      logger.info("Journal entry posted", { entryId, companyId });

      return entry;
    } catch (error) {
      if (session.inTransaction()) await session.abortTransaction();
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
   * Void a posted manual journal entry by posting a reversing entry.
   * Automatic entries (invoice/bill/payment) must be voided through their
   * source document so the document and the GL stay in sync.
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

      if (entry.entryType !== JournalEntryType.MANUAL) {
        throw new Error(
          "Automatic journal entries cannot be voided directly. Void the related invoice, bill or payment instead.",
        );
      }
      if (entry.isClosingEntry) {
        throw new Error(
          "Closing entries cannot be voided directly. Reopen the accounting period instead.",
        );
      }

      const { originalEntry } = await JournalEntryService.reverseEntry({
        companyId,
        journalEntryId: entryId,
        userId,
        session,
      });

      await session.commitTransaction();

      logger.info("Journal entry voided", { entryId, companyId });

      return originalEntry;
    } catch (error) {
      if (session.inTransaction()) await session.abortTransaction();
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
   * Helper: Get account balance up to a date (normal-direction sign).
   */
  async getAccountBalance(
    companyId: string,
    accountId: string,
    upToDate: Date,
  ): Promise<number> {
    const { balance } = await ledgerService.getAccountBalance(
      companyId,
      accountId,
      upToDate,
    );
    return balance;
  },
};
