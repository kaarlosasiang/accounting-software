import { Request } from "express";

import logger from "../../config/logger.js";

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Helper to resolve the active company ID for the request user.
 * Checks multiple sources for company/organization ID.
 */
export const getCompanyId = (req: Request): string | undefined => {
  const authUser = req.authUser as Record<string, unknown> | undefined;
  const authSession = req.authSession as Record<string, any> | undefined;

  // Try multiple sources for company ID (in order of preference)
  const companyId =
    // 1. Active organization from session (preferred - from better-auth organization plugin)
    (authSession?.session?.activeOrganizationId as string | undefined) ||
    // 2. Direct access to active organization object
    (authSession?.activeOrganization?.id as string | undefined) ||
    // 3. Legacy: organizationId on user (if set)
    (authUser?.organizationId as string | undefined) ||
    // 4. Legacy: companyId on user (backwards compatibility)
    (authUser?.companyId as string | undefined);

  // Log for debugging
  if (!companyId) {
    logger.logError(new Error("No company ID found in request"), {
      operation: "get-company-id",
      sessionActiveOrgId: authSession?.session?.activeOrganizationId,
      activeOrgId: authSession?.activeOrganization?.id,
      userOrgId: authUser?.organizationId,
      userCompanyId: authUser?.companyId,
      hasAuthSession: !!authSession,
      hasAuthUser: !!authUser,
    });
  }

  return companyId;
};

/**
 * Helper to resolve the user ID from the request.
 */
export const getUserId = (req: Request): string | undefined => {
  const authUser = req.authUser as Record<string, unknown> | undefined;

  // Get user ID from authUser
  const userId = authUser?.id as string | undefined;

  if (!userId) {
    logger.logError(new Error("No user ID found in request"), {
      operation: "get-user-id",
      hasAuthUser: !!authUser,
    });
  }

  return userId;
};

/**
 * Parse a query date string.
 * For date-only inputs (YYYY-MM-DD), normalize to the local start/end of day
 * so reports include the full selected calendar day instead of midnight only.
 */
export const parseQueryDate = (
  value: string | undefined,
  boundary: "start" | "end" = "start",
): Date | undefined => {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  if (!DATE_ONLY_PATTERN.test(value)) {
    return parsed;
  }

  if (boundary === "start") {
    parsed.setHours(0, 0, 0, 0);
  } else {
    parsed.setHours(23, 59, 59, 999);
  }

  return parsed;
};
