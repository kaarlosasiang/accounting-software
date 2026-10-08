import express from "express";

import { Action, Resource } from "../../shared/auth/permissions.js";
import {
  requireAdmin,
  requireAuth,
  requirePermission,
} from "../../shared/middleware/auth.middleware.js";

import userController from "./userController.js";

const userRoutes = express.Router();
userRoutes.use(requireAuth);

userRoutes.post(
  "/update-role",
  // Writes the global better-auth role — platform admins only.
  requireAdmin,
  userController.updateUserRole,
);

userRoutes.post(
  "/",
  requirePermission(Resource.user, Action.create),
  userController.createPersonnel,
);

export default userRoutes;
