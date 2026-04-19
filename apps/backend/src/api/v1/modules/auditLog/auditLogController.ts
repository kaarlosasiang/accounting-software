import { Request, Response } from "express";

import logger from "../../config/logger.js";
import { getCompanyId } from "../../shared/helpers/utils.js";
import { AuditAction } from "../../shared/interface/IAuditLog.js";

import { auditLogQueryService, AuditLogFilters } from "./auditLogQueryService.js";

export const auditLogController = {
  /**
   * GET /api/v1/audit-logs
   * List audit logs with optional filters and pagination
   */
  async getAuditLogs(req: Request, res: Response) {
    try {
      const companyId = getCompanyId(req);
      if (!companyId) {
        return res
          .status(401)
          .json({ success: false, error: "Unauthorized - Company ID not found" });
      }

      const {
        module,
        action,
        userId,
        startDate,
        endDate,
        page,
        limit,
      } = req.query;

      const filters: AuditLogFilters = {
        module: typeof module === "string" ? module : undefined,
        action:
          typeof action === "string"
            ? (action as AuditAction)
            : undefined,
        userId: typeof userId === "string" ? userId : undefined,
        startDate: typeof startDate === "string" ? startDate : undefined,
        endDate: typeof endDate === "string" ? endDate : undefined,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? Math.min(parseInt(limit as string, 10), 200) : 50,
      };

      const result = await auditLogQueryService.getLogs(companyId, filters);

      return res.status(200).json({
        success: true,
        data: result.logs,
        count: result.total,
        page: result.page,
        limit: result.limit,
      });
    } catch (error) {
      logger.logError(error as Error, { operation: "getAuditLogs" });
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  },

  /**
   * GET /api/v1/audit-logs/:id
   * Get a single audit log entry by ID
   */
  async getAuditLogById(req: Request, res: Response) {
    try {
      const companyId = getCompanyId(req);
      if (!companyId) {
        return res
          .status(401)
          .json({ success: false, error: "Unauthorized - Company ID not found" });
      }

      const { id } = req.params;
      const log = await auditLogQueryService.getLogById(companyId, id);

      if (!log) {
        return res.status(404).json({ success: false, error: "Audit log not found" });
      }

      return res.status(200).json({ success: true, data: log });
    } catch (error) {
      logger.logError(error as Error, { operation: "getAuditLogById" });
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  },

  /**
   * GET /api/v1/audit-logs/record/:recordId
   * Get full history for a specific record
   */
  async getRecordHistory(req: Request, res: Response) {
    try {
      const companyId = getCompanyId(req);
      if (!companyId) {
        return res
          .status(401)
          .json({ success: false, error: "Unauthorized - Company ID not found" });
      }

      const { recordId } = req.params;
      const logs = await auditLogQueryService.getRecordHistory(companyId, recordId);

      return res.status(200).json({
        success: true,
        data: logs,
        count: logs.length,
      });
    } catch (error) {
      logger.logError(error as Error, { operation: "getRecordHistory" });
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  },
};
