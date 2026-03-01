import { Document, Types } from "mongoose";
import type { ResourcePermission } from "../auth/permissions.js";

export interface IRole extends Document {
  _id: Types.ObjectId;
  /** Display name, e.g. "Senior Accountant" */
  name: string;
  description?: string;
  /**
   * null  → global / system role (visible to all companies, set by super admin)
   * ObjectId → company-scoped custom role
   */
  companyId: Types.ObjectId | null;
  /**
   * System roles (owner, admin, accountant, staff, viewer) are seeded,
   * immutable, and cannot be deleted via the API.
   */
  isSystem: boolean;
  /** Base permission set for this role */
  permissions: ResourcePermission[];
  createdAt: Date;
  updatedAt: Date;
}
