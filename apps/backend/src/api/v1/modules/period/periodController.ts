import { Request, Response } from "express";
import { periodService } from "./periodService.js";
import { getCompanyId, getUserId } from "../../shared/helpers/utils.js";
import logger from "../../config/logger.js";
import {
  PeriodStatus,
  PeriodType,
} from "../../shared/interface/IAccountingPeriod.js";

/**
 * Accounting Period Controller
 * Handles HTTP requests for period management
 */
export const periodController = {
  /**
   * Get all accounting periods
   * GET /api/v1/periods?fiscalYear=2026&status=Open
   */
  async getAllPeriods(req: Request, res: Response) {
    try {
      const companyId = getCompanyId(req);
      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const { fiscalYear, status } = req.query;

      const options: any = {};
      if (fiscalYear) options.fiscalYear = parseInt(fiscalYear as string);
      if (status) options.status = status as PeriodStatus;

      const periods = await periodService.getAllPeriods(companyId, options);

      return res.status(200).json({
        success: true,
        data: periods,
        count: periods.length,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-all-periods-controller",
      });
      return res.status(500).json({
        success: false,
        message: "Failed to fetch accounting periods",
        error: (error as Error).message,
      });
    }
  },

  /**
   * Get period by ID
   * GET /api/v1/periods/:periodId
   */
  async getPeriodById(req: Request, res: Response) {
    try {
      const { periodId } = req.params;
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const period = await periodService.getPeriodById(companyId, periodId);

      return res.status(200).json({
        success: true,
        data: period,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-period-by-id-controller",
      });
      return res.status(404).json({
        success: false,
        message: "Period not found",
        error: (error as Error).message,
      });
    }
  },

  /**
   * Create new accounting period
   * POST /api/v1/periods
   */
  async createPeriod(req: Request, res: Response) {
    try {
      const companyId = getCompanyId(req);
      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const { periodName, periodType, fiscalYear, startDate, endDate, notes } =
        req.body;

      // Validation
      if (!periodName || !periodType || !fiscalYear || !startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message:
            "Missing required fields: periodName, periodType, fiscalYear, startDate, endDate",
        });
      }

      if (!Object.values(PeriodType).includes(periodType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid period type. Must be one of: ${Object.values(PeriodType).join(", ")}`,
        });
      }

      const period = await periodService.createPeriod(companyId, {
        periodName,
        periodType,
        fiscalYear: parseInt(fiscalYear),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        notes,
      });

      return res.status(201).json({
        success: true,
        message: "Accounting period created successfully",
        data: period,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "create-period-controller",
      });
      return res.status(400).json({
        success: false,
        message: "Failed to create accounting period",
        error: (error as Error).message,
      });
    }
  },

  /**
   * Close a period
   * POST /api/v1/periods/:periodId/close
   */
  async closePeriod(req: Request, res: Response) {
    try {
      const { periodId } = req.params;
      const companyId = getCompanyId(req);
      const userId = getUserId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User authentication required",
        });
      }

      const result = await periodService.closePeriod(
        companyId,
        periodId,
        userId,
      );

      return res.status(200).json({
        success: true,
        message: `Period "${result.period.periodName}" closed successfully`,
        data: {
          period: result.period,
          closingEntry: result.closingEntry,
          summary: result.summary,
        },
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "close-period-controller",
      });
      return res.status(400).json({
        success: false,
        message: "Failed to close period",
        error: (error as Error).message,
      });
    }
  },

  /**
   * Reopen a closed period
   * POST /api/v1/periods/:periodId/reopen
   */
  async reopenPeriod(req: Request, res: Response) {
    try {
      const { periodId } = req.params;
      const companyId = getCompanyId(req);
      const userId = getUserId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User authentication required",
        });
      }

      const period = await periodService.reopenPeriod(
        companyId,
        periodId,
        userId,
      );

      return res.status(200).json({
        success: true,
        message: `Period "${period.periodName}" reopened successfully`,
        data: period,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "reopen-period-controller",
      });
      return res.status(400).json({
        success: false,
        message: "Failed to reopen period",
        error: (error as Error).message,
      });
    }
  },

  /**
   * Lock a period
   * POST /api/v1/periods/:periodId/lock
   */
  async lockPeriod(req: Request, res: Response) {
    try {
      const { periodId } = req.params;
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const period = await periodService.lockPeriod(companyId, periodId);

      return res.status(200).json({
        success: true,
        message: `Period "${period.periodName}" locked successfully`,
        data: period,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "lock-period-controller",
      });
      return res.status(400).json({
        success: false,
        message: "Failed to lock period",
        error: (error as Error).message,
      });
    }
  },

  /**
   * Check if date is in closed/locked period
   * GET /api/v1/periods/check-date?date=2026-01-15
   */
  async checkDateInClosedPeriod(req: Request, res: Response) {
    try {
      const companyId = getCompanyId(req);
      const { date } = req.query;

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      if (!date) {
        return res.status(400).json({
          success: false,
          message: "Date parameter is required",
        });
      }

      const period = await periodService.checkDateInClosedPeriod(
        companyId,
        new Date(date as string),
      );

      return res.status(200).json({
        success: true,
        data: {
          isInClosedPeriod: !!period,
          period: period || null,
        },
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "check-date-in-closed-period-controller",
      });
      return res.status(500).json({
        success: false,
        message: "Failed to check period status",
        error: (error as Error).message,
      });
    }
  },

  /**
   * Update period
   * PUT /api/v1/periods/:periodId
   */
  async updatePeriod(req: Request, res: Response) {
    try {
      const { periodId } = req.params;
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const { periodName, notes } = req.body;

      const period = await periodService.updatePeriod(companyId, periodId, {
        periodName,
        notes,
      });

      return res.status(200).json({
        success: true,
        message: "Period updated successfully",
        data: period,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "update-period-controller",
      });
      return res.status(400).json({
        success: false,
        message: "Failed to update period",
        error: (error as Error).message,
      });
    }
  },

  /**
   * Delete period
   * DELETE /api/v1/periods/:periodId
   */
  async deletePeriod(req: Request, res: Response) {
    try {
      const { periodId } = req.params;
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const period = await periodService.deletePeriod(companyId, periodId);

      return res.status(200).json({
        success: true,
        message: `Period "${period.periodName}" deleted successfully`,
        data: period,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "delete-period-controller",
      });
      return res.status(400).json({
        success: false,
        message: "Failed to delete period",
        error: (error as Error).message,
      });
    }
  },

  /**
   * Find period for a specific date
   * GET /api/v1/periods/find-by-date?date=2026-01-15
   */
  async findPeriodForDate(req: Request, res: Response) {
    try {
      const companyId = getCompanyId(req);
      const { date } = req.query;

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      if (!date) {
        return res.status(400).json({
          success: false,
          message: "Date parameter is required",
        });
      }

      const period = await periodService.findPeriodForDate(
        companyId,
        new Date(date as string),
      );

      return res.status(200).json({
        success: true,
        data: period,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "find-period-for-date-controller",
      });
      return res.status(500).json({
        success: false,
        message: "Failed to find period",
        error: (error as Error).message,
      });
    }
  },
};
