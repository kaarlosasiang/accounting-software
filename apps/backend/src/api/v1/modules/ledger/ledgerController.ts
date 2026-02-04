import { Request, Response } from "express";
import { ledgerService } from "./ledgerService.js";
import { getCompanyId } from "../../shared/helpers/utils.js";
import logger from "../../config/logger.js";

/**
 * Ledger Controller
 * Handles HTTP requests for ledger operations
 */
export const ledgerController = {
  /**
   * Get all ledger entries
   * GET /api/v1/ledger
   */
  async getAllLedgerEntries(req: Request, res: Response) {
    try {
      const companyId = getCompanyId(req);
      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const { limit, skip } = req.query;

      const options: any = {};
      if (limit) options.limit = parseInt(limit as string);
      if (skip) options.skip = parseInt(skip as string);

      const entries = await ledgerService.getAllLedgerEntries(
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
        operation: "get-all-ledger-entries-controller",
      });
      return res.status(500).json({
        success: false,
        message: "Failed to fetch ledger entries",
        error: (error as Error).message,
      });
    }
  },

  /**
   * Get general ledger (grouped by account)
   * GET /api/v1/ledger/general?startDate=xxx&endDate=xxx
   */
  async getGeneralLedger(req: Request, res: Response) {
    try {
      const companyId = getCompanyId(req);
      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const { startDate, endDate } = req.query;

      const generalLedger = await ledgerService.getGeneralLedger(
        companyId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined,
      );

      return res.status(200).json({
        success: true,
        data: generalLedger,
        count: generalLedger.length,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-general-ledger-controller",
      });
      return res.status(500).json({
        success: false,
        message: "Failed to fetch general ledger",
        error: (error as Error).message,
      });
    }
  },

  /**
   * Get ledger entries by account
   * GET /api/v1/ledger/account/:accountId?startDate=xxx&endDate=xxx
   */
  async getByAccount(req: Request, res: Response) {
    try {
      const { accountId } = req.params;
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const { startDate, endDate } = req.query;

      const data = await ledgerService.getByAccount(
        companyId,
        accountId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined,
      );

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-ledger-by-account-controller",
        accountId: req.params.accountId,
      });
      return res.status(500).json({
        success: false,
        message: "Failed to fetch ledger entries by account",
        error: (error as Error).message,
      });
    }
  },

  /**
   * Get ledger entries by journal entry
   * GET /api/v1/ledger/journal-entry/:journalEntryId
   */
  async getByJournalEntry(req: Request, res: Response) {
    try {
      const { journalEntryId } = req.params;
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const entries = await ledgerService.getByJournalEntry(
        companyId,
        journalEntryId,
      );

      return res.status(200).json({
        success: true,
        data: entries,
        count: entries.length,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-ledger-by-journal-entry-controller",
        journalEntryId: req.params.journalEntryId,
      });
      return res.status(500).json({
        success: false,
        message: "Failed to fetch ledger entries by journal entry",
        error: (error as Error).message,
      });
    }
  },

  /**
   * Get ledger entries by date range
   * GET /api/v1/ledger/date-range?startDate=xxx&endDate=xxx
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

      const entries = await ledgerService.getByDateRange(
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
        operation: "get-ledger-by-date-range-controller",
      });
      return res.status(500).json({
        success: false,
        message: "Failed to fetch ledger entries by date range",
        error: (error as Error).message,
      });
    }
  },

  /**
   * Get account balance
   * GET /api/v1/ledger/account/:accountId/balance?asOfDate=xxx
   */
  async getAccountBalance(req: Request, res: Response) {
    try {
      const { accountId } = req.params;
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const { asOfDate } = req.query;

      const balance = await ledgerService.getAccountBalance(
        companyId,
        accountId,
        asOfDate ? new Date(asOfDate as string) : undefined,
      );

      return res.status(200).json({
        success: true,
        data: balance,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-account-balance-controller",
        accountId: req.params.accountId,
      });
      return res.status(500).json({
        success: false,
        message: "Failed to fetch account balance",
        error: (error as Error).message,
      });
    }
  },

  /**
   * Get trial balance
   * GET /api/v1/ledger/trial-balance?asOfDate=xxx
   */
  async getTrialBalance(req: Request, res: Response) {
    try {
      const companyId = getCompanyId(req);
      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const { asOfDate } = req.query;

      const trialBalance = await ledgerService.getTrialBalance(
        companyId,
        asOfDate ? new Date(asOfDate as string) : undefined,
      );

      return res.status(200).json({
        success: true,
        data: trialBalance,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-trial-balance-controller",
      });
      return res.status(500).json({
        success: false,
        message: "Failed to fetch trial balance",
        error: (error as Error).message,
      });
    }
  },
};
