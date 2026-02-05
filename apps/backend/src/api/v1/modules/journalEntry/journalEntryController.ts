import { Request, Response } from "express";
import { journalEntryService } from "./journalEntryService.js";
import { getCompanyId, getUserId } from "../../shared/helpers/utils.js";
import logger from "../../config/logger.js";
import { Types } from "mongoose";
import {
  JournalEntryType,
  JournalEntryStatus,
} from "../../shared/interface/IJournalEntry.js";

/**
 * Journal Entry Controller
 * Handles HTTP requests for journal entry operations
 */
export const journalEntryController = {
  /**
   * Get all journal entries
   * GET /api/v1/journal-entries
   */
  async getAllJournalEntries(req: Request, res: Response) {
    try {
      const companyId = getCompanyId(req);
      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const { status, type, limit, skip } = req.query;

      const options: any = {};
      if (status) options.status = status as JournalEntryStatus;
      if (type) options.type = parseInt(type as string) as JournalEntryType;
      if (limit) options.limit = parseInt(limit as string);
      if (skip) options.skip = parseInt(skip as string);

      const entries = await journalEntryService.getAllJournalEntries(
        companyId,
        options,
      );

      return res.status(200).json({
        success: true,
        data: entries,
        count: entries.length,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-all-journal-entries-controller",
      });
      return res.status(500).json({
        success: false,
        message: "Failed to fetch journal entries",
        error: (error as Error).message,
      });
    }
  },

  /**
   * Get journal entry by ID
   * GET /api/v1/journal-entries/:id
   */
  async getJournalEntryById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const entry = await journalEntryService.getJournalEntryById(
        companyId,
        id,
      );

      return res.status(200).json({
        success: true,
        data: entry,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-journal-entry-by-id-controller",
        entryId: req.params.id,
      });
      return res.status(404).json({
        success: false,
        message: "Journal entry not found",
        error: (error as Error).message,
      });
    }
  },

  /**
   * Get journal entries by date range
   * GET /api/v1/journal-entries/date-range?startDate=xxx&endDate=xxx
   */
  async getByDateRange(req: Request, res: Response) {
    try {
      const companyId = getCompanyId(req);
      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "startDate and endDate are required",
        });
      }

      const entries = await journalEntryService.getByDateRange(
        companyId,
        new Date(startDate as string),
        new Date(endDate as string),
      );

      return res.status(200).json({
        success: true,
        data: entries,
        count: entries.length,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-journal-entries-by-date-range-controller",
      });
      return res.status(500).json({
        success: false,
        message: "Failed to fetch journal entries by date range",
        error: (error as Error).message,
      });
    }
  },

  /**
   * Get journal entries by type
   * GET /api/v1/journal-entries/type/:type
   */
  async getByType(req: Request, res: Response) {
    try {
      const { type } = req.params;
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const entries = await journalEntryService.getByType(
        companyId,
        parseInt(type) as JournalEntryType,
      );

      return res.status(200).json({
        success: true,
        data: entries,
        count: entries.length,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-journal-entries-by-type-controller",
        type: req.params.type,
      });
      return res.status(500).json({
        success: false,
        message: "Failed to fetch journal entries by type",
        error: (error as Error).message,
      });
    }
  },

  /**
   * Get journal entries by status
   * GET /api/v1/journal-entries/status/:status
   */
  async getByStatus(req: Request, res: Response) {
    try {
      const { status } = req.params;
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const entries = await journalEntryService.getByStatus(
        companyId,
        status as JournalEntryStatus,
      );

      return res.status(200).json({
        success: true,
        data: entries,
        count: entries.length,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-journal-entries-by-status-controller",
        status: req.params.status,
      });
      return res.status(500).json({
        success: false,
        message: "Failed to fetch journal entries by status",
        error: (error as Error).message,
      });
    }
  },

  /**
   * Create new manual journal entry
   * POST /api/v1/journal-entries
   */
  async createJournalEntry(req: Request, res: Response) {
    try {
      const companyId = getCompanyId(req);
      const userId = getUserId(req);

      if (!companyId || !userId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID and User ID are required",
        });
      }

      const { entryDate, referenceNumber, description, lines } = req.body;

      if (!entryDate || !lines || lines.length === 0) {
        return res.status(400).json({
          success: false,
          message: "entryDate and lines are required",
        });
      }

      const entry = await journalEntryService.createJournalEntry({
        companyId: new Types.ObjectId(companyId),
        userId: new Types.ObjectId(userId),
        entryDate: new Date(entryDate),
        referenceNumber,
        description,
        lines,
      });

      return res.status(201).json({
        success: true,
        message: "Journal entry created successfully",
        data: entry,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "create-journal-entry-controller",
      });
      return res.status(500).json({
        success: false,
        message: "Failed to create journal entry",
        error: (error as Error).message,
      });
    }
  },

  /**
   * Update journal entry (draft only)
   * PUT /api/v1/journal-entries/:id
   */
  async updateJournalEntry(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const companyId = getCompanyId(req);
      const userId = getUserId(req);

      if (!companyId || !userId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID and User ID are required",
        });
      }

      const { entryDate, referenceNumber, description, lines } = req.body;

      const entry = await journalEntryService.updateJournalEntry(
        companyId,
        id,
        userId,
        {
          entryDate: entryDate ? new Date(entryDate) : undefined,
          referenceNumber,
          description,
          lines,
        },
      );

      return res.status(200).json({
        success: true,
        message: "Journal entry updated successfully",
        data: entry,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "update-journal-entry-controller",
        entryId: req.params.id,
      });
      return res.status(500).json({
        success: false,
        message: "Failed to update journal entry",
        error: (error as Error).message,
      });
    }
  },

  /**
   * Delete journal entry (draft only)
   * DELETE /api/v1/journal-entries/:id
   */
  async deleteJournalEntry(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const result = await journalEntryService.deleteJournalEntry(
        companyId,
        id,
      );

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "delete-journal-entry-controller",
        entryId: req.params.id,
      });
      return res.status(500).json({
        success: false,
        message: "Failed to delete journal entry",
        error: (error as Error).message,
      });
    }
  },

  /**
   * Post journal entry (create ledger entries)
   * POST /api/v1/journal-entries/:id/post
   */
  async postJournalEntry(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const companyId = getCompanyId(req);
      const userId = getUserId(req);

      if (!companyId || !userId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID and User ID are required",
        });
      }

      const entry = await journalEntryService.postJournalEntry(
        companyId,
        id,
        userId,
      );

      return res.status(200).json({
        success: true,
        message: "Journal entry posted successfully",
        data: entry,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "post-journal-entry-controller",
        entryId: req.params.id,
      });
      return res.status(500).json({
        success: false,
        message: "Failed to post journal entry",
        error: (error as Error).message,
      });
    }
  },

  /**
   * Void journal entry (reverse it)
   * POST /api/v1/journal-entries/:id/void
   */
  async voidJournalEntry(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const companyId = getCompanyId(req);
      const userId = getUserId(req);

      if (!companyId || !userId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID and User ID are required",
        });
      }

      const entry = await journalEntryService.voidJournalEntry(
        companyId,
        id,
        userId,
      );

      return res.status(200).json({
        success: true,
        message: "Journal entry voided successfully",
        data: entry,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "void-journal-entry-controller",
        entryId: req.params.id,
      });
      return res.status(500).json({
        success: false,
        message: "Failed to void journal entry",
        error: (error as Error).message,
      });
    }
  },
};
