import { Request, Response } from "express";
import logger from "../../config/logger.js";

/**
 * Helper to resolve the active company ID for the request user.
 * Checks multiple sources for company/organization ID.
 */
export const getCompanyId = (req: Request): string | undefined => {
  const authUser = req.authUser as Record<string, unknown> | undefined;
  const authSession = req.authSession as Record<string, any> | undefined;

  // Try multiple sources for company ID
  const companyId =
    (authUser?.organizationId as string | undefined) ||
    (authSession?.session?.activeOrganizationId as string | undefined) ||
    (authSession?.activeOrganization?.id as string | undefined) ||
    (authUser?.companyId as string | undefined);

  // Log for debugging
  if (!companyId) {
    logger.logError(new Error("No company ID found in request"), {
      operation: "get-company-id",
      authUser: authUser,
      authSession: authSession,
    });
  }

  return companyId;
};
