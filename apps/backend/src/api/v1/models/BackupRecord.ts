import mongoose, { Schema } from "mongoose";

import {
  BackupStatus,
  BackupType,
  IBackupRecord,
  IBackupRecordDocument,
  StorageLocation,
} from "../shared/interface/IBackupRecord";

/**
 * Backup Record Schema
 */
const BackupRecordSchema = new Schema<IBackupRecord>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company ID is required"],
      index: true,
    },
    backupType: {
      type: String,
      required: [true, "Backup type is required"],
      enum: {
        values: Object.values(BackupType),
        message: "Invalid backup type",
      },
      index: true,
    },
    backupDate: {
      type: Date,
      required: [true, "Backup date is required"],
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: {
        values: Object.values(BackupStatus),
        message: "Invalid status",
      },
      default: BackupStatus.IN_PROGRESS,
      index: true,
    },
    storageLocation: {
      type: String,
      required: [true, "Storage location is required"],
      enum: {
        values: Object.values(StorageLocation),
        message: "Invalid storage location",
      },
    },
    fileSize: {
      type: Number,
      required: [true, "File size is required"],
      min: [0, "File size cannot be negative"],
    },
    filePath: {
      type: String,
      required: [true, "File path is required"],
      trim: true,
    },
    restorable: {
      type: Boolean,
      required: [true, "Restorable flag is required"],
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by user is required"],
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only track creation
    collection: "backupRecords",
  },
);

/**
 * Indexes for performance
 */
BackupRecordSchema.index({ companyId: 1, backupDate: -1 });
BackupRecordSchema.index({ companyId: 1, status: 1 });
BackupRecordSchema.index({ backupType: 1, status: 1 });
BackupRecordSchema.index({ status: 1, backupDate: -1 });

/**
 * Virtual: File size in MB
 */
BackupRecordSchema.virtual("fileSizeMB").get(function () {
  return (this.fileSize / (1024 * 1024)).toFixed(2);
});

/**
 * Virtual: File size in GB
 */
BackupRecordSchema.virtual("fileSizeGB").get(function () {
  return (this.fileSize / (1024 * 1024 * 1024)).toFixed(2);
});

/**
 * Virtual: Human-readable file size
 */
BackupRecordSchema.virtual("fileSizeFormatted").get(function () {
  const bytes = this.fileSize;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
});

/**
 * Virtual: File name from path
 */
BackupRecordSchema.virtual("fileName").get(function () {
  return this.filePath.split("/").pop();
});

/**
 * Virtual: Backup age in days
 */
BackupRecordSchema.virtual("ageInDays").get(function () {
  const now = new Date();
  const diff = now.getTime() - this.backupDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

/**
 * Instance method: Mark backup as completed
 */
BackupRecordSchema.methods.markAsCompleted = function () {
  this.status = BackupStatus.COMPLETED;
  return this.save();
};

/**
 * Instance method: Mark backup as failed
 */
BackupRecordSchema.methods.markAsFailed = function () {
  this.status = BackupStatus.FAILED;
  this.restorable = false;
  return this.save();
};

/**
 * Instance method: Check if backup is old (older than specified days)
 */
BackupRecordSchema.methods.isOld = function (days: number = 30): boolean {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() - days);
  return this.backupDate < expirationDate;
};

/**
 * Instance method: Check if backup is recent (within last 7 days)
 */
BackupRecordSchema.methods.isRecent = function (days: number = 7): boolean {
  const recentDate = new Date();
  recentDate.setDate(recentDate.getDate() - days);
  return this.backupDate >= recentDate;
};

/**
 * Static method: Find backups by company
 */
BackupRecordSchema.statics.findByCompany = function (
  companyId: mongoose.Types.ObjectId,
  limit: number = 50,
) {
  return this.find({ companyId })
    .sort({ backupDate: -1 })
    .limit(limit)
    .populate("createdBy", "firstName lastName email");
};

/**
 * Static method: Find completed backups
 */
BackupRecordSchema.statics.findCompleted = function (
  companyId: mongoose.Types.ObjectId,
  limit: number = 50,
) {
  return this.find({ companyId, status: BackupStatus.COMPLETED })
    .sort({ backupDate: -1 })
    .limit(limit)
    .populate("createdBy", "firstName lastName email");
};

/**
 * Static method: Find restorable backups
 */
BackupRecordSchema.statics.findRestorable = function (
  companyId: mongoose.Types.ObjectId,
) {
  return this.find({
    companyId,
    status: BackupStatus.COMPLETED,
    restorable: true,
  })
    .sort({ backupDate: -1 })
    .populate("createdBy", "firstName lastName email");
};

/**
 * Static method: Find failed backups
 */
BackupRecordSchema.statics.findFailed = function (
  companyId: mongoose.Types.ObjectId,
  limit: number = 50,
) {
  return this.find({ companyId, status: BackupStatus.FAILED })
    .sort({ backupDate: -1 })
    .limit(limit)
    .populate("createdBy", "firstName lastName email");
};

/**
 * Static method: Get latest backup
 */
BackupRecordSchema.statics.getLatestBackup = function (
  companyId: mongoose.Types.ObjectId,
) {
  return this.findOne({
    companyId,
    status: BackupStatus.COMPLETED,
  })
    .sort({ backupDate: -1 })
    .populate("createdBy", "firstName lastName email");
};

/**
 * Static method: Get backup statistics
 */
BackupRecordSchema.statics.getBackupStatistics = function (
  companyId: mongoose.Types.ObjectId,
) {
  return this.aggregate([
    { $match: { companyId } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalSize: { $sum: "$fileSize" },
        avgSize: { $avg: "$fileSize" },
        lastBackup: { $max: "$backupDate" },
      },
    },
  ]);
};

/**
 * Static method: Get total storage used
 */
BackupRecordSchema.statics.getTotalStorageUsed = function (
  companyId: mongoose.Types.ObjectId,
) {
  return this.aggregate([
    {
      $match: {
        companyId,
        status: BackupStatus.COMPLETED,
      },
    },
    {
      $group: {
        _id: "$storageLocation",
        totalSize: { $sum: "$fileSize" },
        count: { $sum: 1 },
      },
    },
  ]);
};

/**
 * Static method: Clean up old backups
 */
BackupRecordSchema.statics.cleanupOldBackups = async function (
  companyId: mongoose.Types.ObjectId,
  daysToKeep: number = 30,
) {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() - daysToKeep);

  const oldBackups = await this.find({
    companyId,
    backupDate: { $lt: expirationDate },
    status: BackupStatus.COMPLETED,
  });

  // In real implementation, you would also delete the physical files
  // from the storage location before deleting the database records

  return this.deleteMany({
    companyId,
    backupDate: { $lt: expirationDate },
    status: BackupStatus.COMPLETED,
  });
};

/**
 * Static method: Get backup history summary
 */
BackupRecordSchema.statics.getBackupHistory = function (
  companyId: mongoose.Types.ObjectId,
  days: number = 30,
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        companyId,
        backupDate: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$backupDate" },
        },
        total: { $sum: 1 },
        completed: {
          $sum: {
            $cond: [{ $eq: ["$status", BackupStatus.COMPLETED] }, 1, 0],
          },
        },
        failed: {
          $sum: { $cond: [{ $eq: ["$status", BackupStatus.FAILED] }, 1, 0] },
        },
        totalSize: { $sum: "$fileSize" },
      },
    },
    { $sort: { _id: -1 } },
  ]);
};

/**
 * Export the model
 */
export const BackupRecord =
  (mongoose.models.BackupRecord as mongoose.Model<IBackupRecordDocument>) ||
  mongoose.model<IBackupRecordDocument>(
    "BackupRecord",
    BackupRecordSchema as any,
  );
