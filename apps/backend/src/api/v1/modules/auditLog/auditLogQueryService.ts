import mongoose from "mongoose";

import { AuditLog } from "../../models/AuditLog.js";
import { AuditAction } from "../../shared/interface/IAuditLog.js";

export interface AuditLogFilters {
  module?: string;
  action?: AuditAction;
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

async function getLogs(companyId: string, filters: AuditLogFilters = {}) {
  const {
    module,
    action,
    userId,
    startDate,
    endDate,
    page = 1,
    limit = 50,
  } = filters;

  const query: Record<string, unknown> = {
    companyId: new mongoose.Types.ObjectId(companyId),
  };

  if (module) query.module = module;
  if (action) query.action = action;
  if (userId) query.userId = userId;

  if (startDate || endDate) {
    const dateRange: Record<string, Date> = {};
    if (startDate) dateRange.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateRange.$lte = end;
    }
    query.timestamp = dateRange;
  }

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    AuditLog.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
    AuditLog.countDocuments(query),
  ]);

  return { logs, total, page, limit };
}

async function getLogById(companyId: string, logId: string) {
  return AuditLog.findOne({
    _id: new mongoose.Types.ObjectId(logId),
    companyId: new mongoose.Types.ObjectId(companyId),
  }).lean();
}

async function getRecordHistory(companyId: string, recordId: string) {
  return AuditLog.find({
    companyId: new mongoose.Types.ObjectId(companyId),
    recordId: new mongoose.Types.ObjectId(recordId),
  })
    .sort({ timestamp: -1 })
    .lean();
}

export const auditLogQueryService = { getLogs, getLogById, getRecordHistory };
