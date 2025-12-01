import mongoose, { Schema } from "mongoose";

import {
  AuditAction,
  IAuditLog,
  IAuditLogDocument,
} from "../shared/interface/IAuditLog";

/**
 * Audit Log Schema
 */
const AuditLogSchema = new Schema<IAuditLog>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company ID is required"],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    userName: {
      type: String,
      required: [true, "User name is required"],
      trim: true,
    },
    action: {
      type: String,
      required: [true, "Action is required"],
      enum: {
        values: Object.values(AuditAction),
        message: "Invalid action",
      },
      index: true,
    },
    module: {
      type: String,
      required: [true, "Module is required"],
      trim: true,
      index: true,
    },
    recordId: {
      type: Schema.Types.ObjectId,
      required: [true, "Record ID is required"],
      index: true,
    },
    recordType: {
      type: String,
      required: [true, "Record type is required"],
      trim: true,
      index: true,
    },
    changes: {
      type: Schema.Types.Mixed,
      required: [true, "Changes is required"],
      default: {},
    },
    ipAddress: {
      type: String,
      required: [true, "IP address is required"],
      trim: true,
    },
    userAgent: {
      type: String,
      required: [true, "User agent is required"],
      trim: true,
    },
    timestamp: {
      type: Date,
      required: [true, "Timestamp is required"],
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false, // Using custom timestamp field
    collection: "auditLogs",
  },
);

/**
 * Indexes for performance
 */
AuditLogSchema.index({ companyId: 1, timestamp: -1 });
AuditLogSchema.index({ companyId: 1, userId: 1, timestamp: -1 });
AuditLogSchema.index({ companyId: 1, module: 1, timestamp: -1 });
AuditLogSchema.index({ companyId: 1, action: 1, timestamp: -1 });
AuditLogSchema.index({ recordId: 1, recordType: 1 });
AuditLogSchema.index({ timestamp: -1 }); // For cleanup/archival

/**
 * Static method: Create audit log entry
 */
AuditLogSchema.statics.createLog = function (
  logData: Omit<IAuditLog, "_id" | "timestamp">,
) {
  return this.create({
    ...logData,
    timestamp: new Date(),
  });
};

/**
 * Static method: Find logs by user
 */
AuditLogSchema.statics.findByUser = function (
  userId: mongoose.Types.ObjectId,
  limit = 100,
) {
  return this.find({ userId }).sort({ timestamp: -1 }).limit(limit);
};

/**
 * Static method: Find logs by module
 */
AuditLogSchema.statics.findByModule = function (
  companyId: mongoose.Types.ObjectId,
  module: string,
  limit = 100,
) {
  return this.find({ companyId, module }).sort({ timestamp: -1 }).limit(limit);
};

/**
 * Static method: Find logs by action
 */
AuditLogSchema.statics.findByAction = function (
  companyId: mongoose.Types.ObjectId,
  action: AuditAction,
  limit = 100,
) {
  return this.find({ companyId, action }).sort({ timestamp: -1 }).limit(limit);
};

/**
 * Static method: Find logs by record
 */
AuditLogSchema.statics.findByRecord = function (
  recordId: mongoose.Types.ObjectId,
  recordType: string,
) {
  return this.find({ recordId, recordType }).sort({ timestamp: -1 });
};

/**
 * Static method: Find logs by date range
 */
AuditLogSchema.statics.findByDateRange = function (
  companyId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date,
  limit = 1000,
) {
  return this.find({
    companyId,
    timestamp: { $gte: startDate, $lte: endDate },
  })
    .sort({ timestamp: -1 })
    .limit(limit);
};

/**
 * Static method: Get user activity summary
 */
AuditLogSchema.statics.getUserActivitySummary = async function (
  userId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date,
) {
  const result = await this.aggregate([
    {
      $match: {
        userId,
        timestamp: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: "$action",
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  return result;
};

/**
 * Static method: Get module activity summary
 */
AuditLogSchema.statics.getModuleActivitySummary = async function (
  companyId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date,
) {
  const result = await this.aggregate([
    {
      $match: {
        companyId,
        timestamp: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { module: "$module", action: "$action" },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  return result;
};

/**
 * Static method: Find login/logout activities
 */
AuditLogSchema.statics.findAuthActivities = function (
  companyId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date,
) {
  return this.find({
    companyId,
    action: { $in: [AuditAction.LOGIN, AuditAction.LOGOUT] },
    timestamp: { $gte: startDate, $lte: endDate },
  }).sort({ timestamp: -1 });
};

/**
 * Static method: Clean up old logs (for maintenance)
 */
AuditLogSchema.statics.cleanupOldLogs = function (daysToKeep = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  return this.deleteMany({ timestamp: { $lt: cutoffDate } });
};

/**
 * Export the model
 */
export const AuditLog =
  (mongoose.models.AuditLog as mongoose.Model<IAuditLogDocument>) ||
  mongoose.model<IAuditLogDocument>("AuditLog", AuditLogSchema as any);
