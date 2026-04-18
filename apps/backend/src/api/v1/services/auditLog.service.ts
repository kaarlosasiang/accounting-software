import mongoose from "mongoose";
import { Request } from "express";

import { AuditLog } from "../models/AuditLog.js";
import { AuditAction } from "../shared/interface/IAuditLog.js";
import logger from "../config/logger.js";

export { AuditAction };

interface LogParams {
  companyId: string;
  userId: string;
  userName: string;
  action: AuditAction;
  module: string;
  recordId: string;
  recordType: string;
  changes: Record<string, any>;
  ipAddress: string;
  userAgent: string;
}

/**
 * Write an audit log entry in a fire-and-forget manner.
 * Errors are swallowed so a logging failure never breaks the main request.
 */
async function log(params: LogParams): Promise<void> {
  try {
    await AuditLog.create({
      companyId: new mongoose.Types.ObjectId(params.companyId),
      userId: params.userId,
      userName: params.userName,
      action: params.action,
      module: params.module,
      recordId: new mongoose.Types.ObjectId(params.recordId),
      recordType: params.recordType,
      changes: params.changes,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.logError(error as Error, {
      operation: "auditLog.log",
      module: params.module,
      action: params.action,
    });
  }
}

/**
 * Extract IP address and User-Agent from an Express request.
 */
function extractRequestInfo(req: Request) {
  return {
    ipAddress:
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
      req.socket?.remoteAddress ??
      "unknown",
    userAgent: req.headers["user-agent"] ?? "unknown",
  };
}

export const auditLogService = { log, extractRequestInfo };
