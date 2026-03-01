import { Types } from "mongoose";
import Role from "../../models/Role.js";
import {
  DEFAULT_ROLE_PERMISSIONS,
  OrgRole,
} from "../../shared/auth/permissions.js";
import logger from "../../config/logger.js";

export const roleService = {
  /**
   * List all roles visible to a company:
   * - All system/global roles (companyId = null)
   * - Custom roles belonging to this company
   */
  async listRoles(companyId: string) {
    return Role.find({
      $or: [{ companyId: null }, { companyId: new Types.ObjectId(companyId) }],
    }).sort({ isSystem: -1, name: 1 });
  },

  /**
   * Get a single role by ID (must be visible to the company).
   */
  async getRoleById(roleId: string, companyId: string) {
    const role = await Role.findOne({
      _id: new Types.ObjectId(roleId),
      $or: [{ companyId: null }, { companyId: new Types.ObjectId(companyId) }],
    });

    if (!role) throw new Error("Role not found");
    return role;
  },

  /**
   * Get the DEFAULT_ROLE_PERMISSIONS map — used by the frontend to
   * render the permission matrix editor pre-populated with system defaults.
   */
  getDefaults() {
    return DEFAULT_ROLE_PERMISSIONS;
  },

  /**
   * Create a new company-scoped custom role.
   */
  async createRole(
    companyId: string,
    data: {
      name: string;
      description?: string;
      permissions: { resource: string; actions: string[] }[];
    },
  ) {
    const existing = await Role.findOne({
      companyId: new Types.ObjectId(companyId),
      name: data.name,
    });

    if (existing) throw new Error(`A role named "${data.name}" already exists`);

    const role = await Role.create({
      name: data.name,
      description: data.description,
      permissions: data.permissions as any,
      companyId: new Types.ObjectId(companyId),
      isSystem: false,
    });

    logger.info("Custom role created", { roleId: role._id, companyId });
    return role;
  },

  /**
   * Update a custom role's name, description, or permissions.
   * System roles are immutable.
   */
  async updateRole(
    roleId: string,
    companyId: string,
    data: Partial<{
      name: string;
      description: string;
      permissions: { resource: string; actions: string[] }[];
    }>,
  ) {
    const role = await Role.findOne({
      _id: new Types.ObjectId(roleId),
      companyId: new Types.ObjectId(companyId),
    });

    if (!role) throw new Error("Role not found");
    if (role.isSystem) throw new Error("System roles cannot be modified");

    Object.assign(role, data);
    await role.save();

    logger.info("Role updated", { roleId, companyId });
    return role;
  },

  /**
   * Delete a custom role.
   * System roles cannot be deleted.
   */
  async deleteRole(roleId: string, companyId: string) {
    const role = await Role.findOne({
      _id: new Types.ObjectId(roleId),
      companyId: new Types.ObjectId(companyId),
    });

    if (!role) throw new Error("Role not found");
    if (role.isSystem) throw new Error("System roles cannot be deleted");

    await role.deleteOne();
    logger.info("Role deleted", { roleId, companyId });
  },
};
