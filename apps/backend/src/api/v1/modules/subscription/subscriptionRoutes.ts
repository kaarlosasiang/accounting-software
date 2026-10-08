import express from "express";

import { AuthorizationError } from "../../shared/error-types/authorization.error.js";
import {
  isGlobalAdmin,
  requireAuth,
} from "../../shared/middleware/auth.middleware.js";

import subscriptionController from "./subscriptionController.js";

const subscriptionRoutes = express.Router();

// All subscription endpoints require a session.
subscriptionRoutes.use(requireAuth);

/**
 * A user may only read or change their own subscription. The target user id
 * (from the body or URL) must match the session user unless the caller is a
 * global platform admin.
 */
const requireSelfOrAdmin: express.RequestHandler = (req, _res, next) => {
  const sessionUserId = (req.authUser as any)?.id as string | undefined;
  const targetUserId =
    (req.params.userId as string | undefined) ??
    (req.body?.userId as string | undefined);

  if (!sessionUserId) {
    return next(new AuthorizationError("Cannot determine user"));
  }

  if (!targetUserId) {
    // Default to the session user when no explicit target is given.
    if (req.body && typeof req.body === "object") {
      req.body.userId = sessionUserId;
    }
    return next();
  }

  if (targetUserId !== sessionUserId && !isGlobalAdmin(req)) {
    return next(
      new AuthorizationError("You can only manage your own subscription"),
    );
  }

  next();
};

/**
 * Subscription Routes (mock endpoints)
 */
subscriptionRoutes.post(
  "/activate",
  requireSelfOrAdmin,
  subscriptionController.activateSubscription,
);
subscriptionRoutes.get(
  "/:userId",
  requireSelfOrAdmin,
  subscriptionController.getSubscription,
);
subscriptionRoutes.delete(
  "/:userId",
  requireSelfOrAdmin,
  subscriptionController.cancelSubscription,
);

export default subscriptionRoutes;
