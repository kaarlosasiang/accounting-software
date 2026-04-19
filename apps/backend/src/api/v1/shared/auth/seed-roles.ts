import logger from "../../config/logger.js";
import Role from "../../models/Role.js";

import { DEFAULT_ROLE_PERMISSIONS, OrgRole, Resource } from "./permissions.js";

const SYSTEM_ROLE_DESCRIPTIONS: Record<OrgRole, string> = {
  [OrgRole.owner]: "Full control over all company resources and settings.",
  [OrgRole.admin]:
    "Full access to all company resources. Can manage users and roles.",
  [OrgRole.accountant]:
    "Full financial access: accounts, journal entries, invoices, bills, payments, customers, suppliers, inventory. Read-only reports and ledger.",
  [OrgRole.staff]:
    "Transactional access: invoices, bills, payments, customers, suppliers, inventory. Read-only reports and ledger.",
  [OrgRole.viewer]: "Read-only access across all resources.",
};

/**
 * Upsert the 5 system roles into the `roles` collection.
 * Safe to call on every startup.
 * - First run: creates the role with all fields.
 * - Subsequent runs: always updates `permissions` and `description` so that
 *   new resources added to DEFAULT_ROLE_PERMISSIONS are reflected immediately
 *   without requiring a manual DB migration.
 */
export async function seedRoles(): Promise<void> {
  try {
    const systemRoles = Object.values(OrgRole);
    let seeded = 0;
    let updated = 0;

    for (const roleName of systemRoles) {
      const permissionMap = DEFAULT_ROLE_PERMISSIONS[roleName];

      // Convert the resource→action[] map into the array form the schema expects
      const permissions = (Object.keys(permissionMap) as Resource[])
        .filter((resource) => permissionMap[resource].length > 0)
        .map((resource) => ({
          resource,
          actions: permissionMap[resource],
        }));

      const result = await Role.updateOne(
        // Match on name + null companyId (system scope)
        { name: roleName, companyId: null },
        {
          // Immutable identity fields — only written on first insert
          $setOnInsert: {
            name: roleName,
            companyId: null,
            isSystem: true,
          },
          // Always sync permissions and description so new resources are picked up
          $set: {
            description: SYSTEM_ROLE_DESCRIPTIONS[roleName],
            permissions,
          },
        },
        { upsert: true },
      );

      if (result.upsertedCount > 0) seeded++;
      else if (result.modifiedCount > 0) updated++;
    }

    if (seeded > 0 || updated > 0) {
      logger.info(
        `System roles: ${seeded} created, ${updated} updated (permissions synced)`,
      );
    } else {
      logger.info("System roles already up to date — no changes");
    }
  } catch (error) {
    logger.logError(error as Error, { operation: "seedRoles" });
    throw error;
  }
}
