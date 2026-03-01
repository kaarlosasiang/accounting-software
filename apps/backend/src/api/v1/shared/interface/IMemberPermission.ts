import { Document, Types } from "mongoose";
import type { ResourcePermission } from "../auth/permissions.js";

export interface IMemberPermission extends Document {
  _id: Types.ObjectId;
  /** BetterAuth user ID (string, not ObjectId) */
  userId: string;
  /** BetterAuth organization ID (string, not ObjectId) */
  organizationId: string;
  /** Points to the Role document that defines this member's base permissions */
  roleId: Types.ObjectId;
  /**
   * Permissions added on top of the role's base set.
   * e.g. give a staff member the ability to create journal entries.
   */
  grants: ResourcePermission[];
  /**
   * Permissions removed from the role's base set.
   * e.g. prevent an accountant from deleting invoices.
   */
  revocations: ResourcePermission[];
  createdAt: Date;
  updatedAt: Date;
}
