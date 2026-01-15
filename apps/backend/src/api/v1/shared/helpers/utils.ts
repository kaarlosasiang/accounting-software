import { Request, Response } from "express";
import logger from "../../config/logger.js";

/**
 * Helper to resolve the active organization ID for the request user.
 * Falls back to legacy companyId for backward compatibility.
 */
export const getOrganizationId = (req: Request): string | undefined => {
  const authUser = req.authUser as Record<string, unknown> | undefined;
  const authSession = req.authSession as Record<string, any> | undefined;

  // Try multiple sources for organization ID
  const orgId =
    (authUser?.organizationId as string | undefined) ||
    (authSession?.session?.activeOrganizationId as string | undefined) ||
    (authSession?.activeOrganization?.id as string | undefined) ||
    (authUser?.companyId as string | undefined);

  // Log for debugging
  if (!orgId) {
    logger.logError(new Error("No organization ID found in request"), {
      operation: "get-organization-id",
      authUser: authUser,
      authSession: authSession,
    });
  }

  return orgId;
};
