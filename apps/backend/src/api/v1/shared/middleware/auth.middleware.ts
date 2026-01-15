import { fromNodeHeaders } from "better-auth/node";
import { NextFunction, Request, Response } from "express";

import { authServer } from "../../modules/auth/betterAuth.js";
import { AuthenticationError } from "../error-types/authentcation.error.js";
import logger from "../../config/logger.js";

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
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
      fullSession: JSON.stringify(session.session),
      fullUser: JSON.stringify(session.user),
    });

    req.authSession = session;
    req.authUser = session.user;

    next();
  } catch (error) {
    next(error);
  }
};
