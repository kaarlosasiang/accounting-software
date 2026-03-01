import express from "express";

import userController from "./userController.js";
import {
  requireAuth,
  requirePermission,
} from "../../shared/middleware/auth.middleware.js";
import { Action, Resource } from "../../shared/auth/permissions.js";

const userRoutes = express.Router();
userRoutes.use(requireAuth);

userRoutes.post(
  "/update-role",
  requirePermission(Resource.user, Action.update),
  userController.updateUserRole,
);

export default userRoutes;
