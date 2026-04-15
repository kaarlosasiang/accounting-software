import Role from "../../models/Role.js";
import MemberPermission from "../../models/MemberPermission.js";
import { Action, OrgRole, Resource } from "./permissions.js";
import { IRole } from "../interface/IRole.js";
import logger from "../../config/logger.js";

/**
 * Effective permissions for a member in a company.
 * Keyed by Resource, values are the resolved set of allowed Actions.
 */
export type EffectivePermissions = Partial<Record<Resource, Set<Action>>>;

/**
 * Resolve the effective permissions for a member in a company via the
 * three-step merge:
 *
 *   1. Role base permissions
 *   2. + grants  (per-user additions)
 *   3. − revocations  (per-user removals)
 *
 * Returns owner-level permissions and auto-creates a MemberPermission record
 * when none exists (handles users who existed before RBAC was introduced).
 * Pass `fallbackOrgRole` to control which system role is assigned; defaults to "owner".
 */
export async function resolvePermissions(
  userId: string,
  organizationId: string,
  fallbackOrgRole: OrgRole = OrgRole.owner,
): Promise<EffectivePermissions> {
  try {
    let memberPerm = await MemberPermission.findOne({
      userId,
      organizationId,
    }).populate("roleId");

    if (!memberPerm) {
      // No record — auto-assign the fallback system role so existing users
      // (org creators / early accounts) are not locked out.
      const systemRole = await Role.findOne({
        name: fallbackOrgRole,
        companyId: null,
      });

      if (!systemRole) {
        logger.warn(
          `System role "${fallbackOrgRole}" not found — seed may not have run yet`,
          { userId, organizationId },
        );
        return {};
      }

      memberPerm = await MemberPermission.findOneAndUpdate(
        { userId, organizationId },
        {
          $setOnInsert: {
            userId,
            organizationId,
            roleId: systemRole._id,
            grants: [],
            revocations: [],
          },
        },
        { upsert: true, new: true },
      ).populate("roleId");

      logger.info(
        `Auto-assigned "${fallbackOrgRole}" role to user ${userId} in org ${organizationId}`,
      );

      if (!memberPerm) return {};
    }

    const role = memberPerm.roleId as unknown as IRole;
    const effective: EffectivePermissions = {};

    // ── Step 1: Base role permissions ────────────────────────────────────────
    for (const rp of role.permissions) {
      const resource = rp.resource as Resource;
      effective[resource] = new Set(rp.actions as Action[]);
    }

    // ── Step 2: Apply grants ──────────────────────────────────────────────────
    for (const grant of memberPerm.grants) {
      const resource = grant.resource as Resource;
      if (!effective[resource]) {
        effective[resource] = new Set();
      }
      for (const action of grant.actions as Action[]) {
        effective[resource]!.add(action);
      }
    }

    // ── Step 3: Apply revocations ─────────────────────────────────────────────
    for (const revocation of memberPerm.revocations) {
      const resource = revocation.resource as Resource;
      if (effective[resource]) {
        for (const action of revocation.actions as Action[]) {
          effective[resource]!.delete(action);
        }
      }
    }

    return effective;
  } catch (error) {
    logger.logError(error as Error, {
      operation: "resolvePermissions",
      userId,
      organizationId,
    });
    throw error;
  }
}

/**
 * Check if a resolved effective permission set allows a specific action.
 */
export function hasPermission(
  effective: EffectivePermissions,
  resource: Resource,
  action: Action,
): boolean {
  return effective[resource]?.has(action) ?? false;
}
