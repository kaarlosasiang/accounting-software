import { Document, Types } from "mongoose";

/**
 * Backup Type Enum
 */
export enum BackupType {
  AUTO = "Auto",
  MANUAL = "Manual",
}

/**
 * Backup Status Enum
 */
export enum BackupStatus {
  IN_PROGRESS = "In Progress",
  COMPLETED = "Completed",
  FAILED = "Failed",
}

/**
 * Storage Location Enum
 */
export enum StorageLocation {
  LOCAL = "Local",
  FIREBASE = "Firebase",
  CLOUD = "Cloud",
}

/**
 * Backup Record Interface
 */
export interface IBackupRecord {
  _id: string;
  companyId: Types.ObjectId;
  backupType: BackupType;
  backupDate: Date;
  status: BackupStatus;
  storageLocation: StorageLocation;
  fileSize: number; // in bytes
  filePath: string;
  restorable: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
}

/**
 * Backup Record Document (Mongoose)
 */
export interface IBackupRecordDocument
  extends Omit<IBackupRecord, "_id">,
    Document {}
