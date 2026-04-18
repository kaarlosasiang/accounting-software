import express from "express";

import { Action, Resource } from "../../shared/auth/permissions.js";
import {
  requireAuth,
  requirePermission,
} from "../../shared/middleware/auth.middleware.js";

import userController from "./userController.js";

const userRoutes = express.Router();
userRoutes.use(requireAuth);

userRoutes.post(
  "/update-role",
  requirePermission(Resource.user, Action.update),
  userController.updateUserRole,
);

userRoutes.post(
  "/",
  requirePermission(Resource.user, Action.create),
  userController.createPersonnel,
);

export default userRoutes;
