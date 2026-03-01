import Role from "../../models/Role.js";
import { DEFAULT_ROLE_PERMISSIONS, OrgRole, Resource } from "./permissions.js";
import logger from "../../config/logger.js";

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
 * Safe to call on every startup — skips existing records.
 */
export async function seedRoles(): Promise<void> {
  try {
    const systemRoles = Object.values(OrgRole);
    let seeded = 0;

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
          $setOnInsert: {
            name: roleName,
            description: SYSTEM_ROLE_DESCRIPTIONS[roleName],
            companyId: null,
            isSystem: true,
            permissions,
          },
        },
        { upsert: true },
      );

      if (result.upsertedCount > 0) seeded++;
    }

    if (seeded > 0) {
      logger.info(`Seeded ${seeded} system role(s)`);
    } else {
      logger.info("System roles already seeded — skipping");
    }
  } catch (error) {
    logger.logError(error as Error, { operation: "seedRoles" });
    throw error;
  }
}
