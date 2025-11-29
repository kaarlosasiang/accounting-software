import { Document, Types } from "mongoose";

/**
 * Audit Action Type
 */
export enum AuditAction {
  CREATE = "Create",
  UPDATE = "Update",
  DELETE = "Delete",
  VIEW = "View",
  LOGIN = "Login",
  LOGOUT = "Logout",
  EXPORT = "Export",
}

/**
 * Audit Log Document Interface
 */
export interface IAuditLog {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  userId: Types.ObjectId;
  userName: string; // Denormalized
  action: AuditAction;
  module: string; // e.g., 'Invoice', 'JournalEntry', 'Customer'
  recordId: Types.ObjectId; // ID of the affected record
  recordType: string; // Type of record affected
  changes: Record<string, any>; // Before/after values for updates
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

/**
 * Audit Log Document (Mongoose)
 */
export interface IAuditLogDocument extends Omit<IAuditLog, "_id">, Document {}
