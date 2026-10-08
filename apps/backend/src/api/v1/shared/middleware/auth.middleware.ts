import { fromNodeHeaders } from "better-auth/node";
import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";

import logger from "../../config/logger.js";
import { authServer } from "../../modules/auth/betterAuth.js";
import {
  hasPermission,
  resolvePermissions,
} from "../auth/permission-resolver.js";
import { Action, OrgRole, Resource } from "../auth/permissions.js";
import { AuthenticationError } from "../error-types/authentcation.error.js";
import { AuthorizationError } from "../error-types/authorization.error.js";
import { getCompanyId, getUserId } from "../helpers/utils.js";

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const session = await authServer.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      throw new AuthenticationError("Authentication required");
    }

    // Debug log to see what's in the session
    logger.debug("Auth session details", {
      userId: session.user?.id,
      email: session.user?.email,
      companyId: session.user?.companyId,
      role: session.user?.role,
      activeOrganizationId: session.session?.activeOrganizationId,
      sessionKeys: Object.keys(session.session || {}),
      userKeys: Object.keys(session.user || {}),
    });

    req.authSession = session;
    req.authUser = session.user;

    next();
  } catch (error) {
    next(error);
  }
};

// ─── Global app-level admin guard ────────────────────────────────────────────

const GLOBAL_ADMIN_ROLES = ["admin", "super_admin"];

/**
 * True when the user holds a global app-level admin role
 * (admin or super_admin on the BetterAuth `user.role` field).
 */
export const isGlobalAdmin = (req: Request): boolean => {
  const role = (req.authUser as any)?.role as string | undefined;
  const roles = role ? role.split(",").map((r: string) => r.trim()) : [];
  return roles.some((r) => GLOBAL_ADMIN_ROLES.includes(r));
};

/**
 * Requires the authenticated user to have a global app-level admin role.
 *
 * This is DIFFERENT from the per-company org role "admin".
 * Use `requirePermission` for resource-level access control.
 */
export const requireAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (!isGlobalAdmin(req)) {
    return next(new AuthorizationError("Admin access required"));
  }

  next();
};

// ─── Organization membership ─────────────────────────────────────────────────

type OrgMembership = { role: string } | null;

const idVariants = (value: string): unknown[] =>
  mongoose.Types.ObjectId.isValid(value)
    ? [value, new mongoose.Types.ObjectId(value)]
    : [value];

/**
 * Load (and cache on the request) the user's better-auth membership in the
 * active organization. Returns null when the user is not a member.
 */
export const getOrgMembership = async (
  req: Request,
): Promise<OrgMembership> => {
  const cached = (req as any).orgMembership as OrgMembership | undefined;
  if (cached !== undefined) return cached;

  const userId = getUserId(req);
  const organizationId = getCompanyId(req);
  let membership: OrgMembership = null;

  if (userId && organizationId && mongoose.connection.db) {
    const member = await mongoose.connection.db.collection("member").findOne(
      {
        userId: { $in: idVariants(userId) },
        organizationId: { $in: idVariants(organizationId) },
      },
      { projection: { role: 1 } },
    );
    membership = member ? { role: String(member.role ?? "") } : null;
  }

  (req as any).orgMembership = membership;
  return membership;
};

/**
 * Requires the user to be a member of the active organization.
 * Global admins are allowed through.
 */
export const requireOrgMember = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (isGlobalAdmin(req)) return next();

    if (!getCompanyId(req)) {
      return next(new AuthorizationError("No active organization selected"));
    }

    const membership = await getOrgMembership(req);
    if (!membership) {
      return next(
        new AuthorizationError("You are not a member of this organization"),
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

// ─── Per-resource permission guard ───────────────────────────────────────────

/**
 * Middleware factory that enforces a specific resource + action permission.
 *
 * Resolution order:
 *   1. Global admins (admin / super_admin app role) always pass.
 *   2. The user must be a member of the active org (better-auth `member`).
 *   3. Load the member's MemberPermission document for the active org
 *      (falling back to their actual membership role, never "owner").
 *   4. Resolve effective permissions (role base → +grants → −revocations).
 *   5. Check if the effective set includes the required action.
 *
 * @example
 *   router.post("/", requirePermission(Resource.invoice, Action.create), controller.create);
 */
export const requirePermission = (resource: Resource, action: Action) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (isGlobalAdmin(req)) {
        return next();
      }

      const userId = getUserId(req);
      const organizationId = getCompanyId(req);

      if (!userId || !organizationId) {
        return next(
          new AuthorizationError("Cannot determine user or organization"),
        );
      }

      const membership = await getOrgMembership(req);
      if (!membership) {
        return next(
          new AuthorizationError("You are not a member of this organization"),
        );
      }

      // Fallback role for members that predate RBAC records: use the role
      // recorded on their better-auth membership. Unknown roles (e.g. the
      // generic "member") get the least-privileged role.
      const validOrgRoles = Object.values(OrgRole) as string[];
      const fallbackRole: OrgRole = validOrgRoles.includes(membership.role)
        ? (membership.role as OrgRole)
        : OrgRole.viewer;

      const effective = await resolvePermissions(
        userId,
        organizationId,
        fallbackRole,
      );

      if (!hasPermission(effective, resource, action)) {
        return next(
          new AuthorizationError(
            `You do not have permission to ${action} ${resource}`,
          ),
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
