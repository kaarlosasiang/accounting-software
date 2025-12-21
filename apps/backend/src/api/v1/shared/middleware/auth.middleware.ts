import { NextFunction, Request, Response } from "express";

import { authServer } from "../../modules/auth/betterAuth";
import { AuthenticationError } from "../error-types/authentcation.error";

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { fromNodeHeaders } = await import("better-auth/node");
    const session = await authServer.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      throw new AuthenticationError("Authentication required");
    }

    req.authSession = session;
    req.authUser = session.user;

    next();
  } catch (error) {
    next(error);
  }
};
