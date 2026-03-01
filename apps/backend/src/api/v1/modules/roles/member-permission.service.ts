import { Types } from "mongoose";
import MemberPermission from "../../models/MemberPermission.js";
import Role from "../../models/Role.js";
import {
  resolvePermissions,
  EffectivePermissions,
} from "../../shared/auth/permission-resolver.js";
import { Action, Resource } from "../../shared/auth/permissions.js";
import logger from "../../config/logger.js";

export const memberPermissionService = {
  /**
   * Get a member's permission record (role + overrides).
   * Returns null if no record exists (member has never been assigned a role).
   */
  async getMemberPermissions(userId: string, organizationId: string) {
    return MemberPermission.findOne({ userId, organizationId }).populate(
      "roleId",
    );
  },

  /**
   * Assign a role to a member and optionally set per-user grants/revocations.
   * Creates the record if it doesn't exist (upsert).
   */
  async assignRole(
    userId: string,
    organizationId: string,
    data: {
      roleId: string;
      grants?: { resource: string; actions: string[] }[];
      revocations?: { resource: string; actions: string[] }[];
    },
  ) {
    const role = await Role.findById(new Types.ObjectId(data.roleId));
    if (!role) throw new Error("Role not found");

    const record = await MemberPermission.findOneAndUpdate(
      { userId, organizationId },
      {
        $set: {
          roleId: new Types.ObjectId(data.roleId),
          grants: data.grants ?? [],
          revocations: data.revocations ?? [],
        },
      },
      { upsert: true, new: true },
    );

    logger.info("Member role assigned", {
      userId,
      organizationId,
      roleId: data.roleId,
    });

    return record.populate("roleId");
  },

  /**
   * Update only the per-user grants and/or revocations without changing the role.
   */
  async updateOverrides(
    userId: string,
    organizationId: string,
    data: {
      grants?: { resource: string; actions: string[] }[];
      revocations?: { resource: string; actions: string[] }[];
    },
  ) {
    const record = await MemberPermission.findOne({ userId, organizationId });
    if (!record)
      throw new Error("Member has no permission record. Assign a role first.");

    if (data.grants !== undefined) record.grants = data.grants as any;
    if (data.revocations !== undefined)
      record.revocations = data.revocations as any;

    await record.save();

    logger.info("Member permission overrides updated", {
      userId,
      organizationId,
    });

    return record.populate("roleId");
  },

  /**
   * Resolve and return the fully merged effective permission set.
   * Converts Sets to arrays for serialization.
   */
  async getEffectivePermissions(
    userId: string,
    organizationId: string,
  ): Promise<Record<string, string[]>> {
    const effective: EffectivePermissions = await resolvePermissions(
      userId,
      organizationId,
    );

    const result: Record<string, string[]> = {};
    for (const [resource, actionSet] of Object.entries(effective)) {
      result[resource] = Array.from(actionSet as Set<Action>);
    }
    return result;
  },

  /**
   * Provision a MemberPermission record after accepting an invitation.
   * Uses $setOnInsert — a no-op if a record already exists, so it's safe
   * to call multiple times (e.g. repeated page visits).
   */
  async provisionRole(
    userId: string,
    organizationId: string,
    roleName: string,
  ) {
    // Normalize: trim and lowercase to handle BetterAuth role strings robustly
    const normalized = roleName.trim().toLowerCase();

    // 1. Try exact system-role match (companyId: null = global/system scope)
    // 2. Fall back to "staff" — safe default for invited members
    const FALLBACK = "staff";
    const role =
      (await Role.findOne({ name: normalized, companyId: null })) ??
      (await Role.findOne({ name: FALLBACK, companyId: null }));

    if (!role) {
      throw new Error(
        `Neither system role "${normalized}" nor fallback "${FALLBACK}" found. ` +
          `Run seedRoles() to create system roles.`,
      );
    }

    if (role.name !== normalized) {
      logger.warn(
        `provisionRole: no system role "${normalized}", fell back to "${role.name}"`,
        { userId, organizationId },
      );
    }

    const record = await MemberPermission.findOneAndUpdate(
      { userId, organizationId },
      {
        $setOnInsert: {
          userId,
          organizationId,
          roleId: role._id,
          grants: [],
          revocations: [],
        },
      },
      { upsert: true, new: true },
    );

    logger.info("Provisioned MemberPermission on invitation accept", {
      userId,
      organizationId,
      roleName,
    });

    return record.populate("roleId");
  },
};
