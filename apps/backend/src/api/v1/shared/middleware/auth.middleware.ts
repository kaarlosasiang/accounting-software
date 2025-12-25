import { fromNodeHeaders } from "better-auth/node";
import { NextFunction, Request, Response } from "express";

import { authServer } from "../../modules/auth/betterAuth.js";
import { AuthenticationError } from "../error-types/authentcation.error.js";

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

    req.authSession = session;
    req.authUser = session.user;

    next();
  } catch (error) {
    next(error);
  }
};
