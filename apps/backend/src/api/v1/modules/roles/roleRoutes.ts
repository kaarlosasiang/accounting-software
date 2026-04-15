import express from "express";
import { roleController } from "./roleController.js";
import {
  requireAuth,
  requirePermission,
} from "../../shared/middleware/auth.middleware.js";
import { Action, Resource } from "../../shared/auth/permissions.js";

const roleRoutes = express.Router();

roleRoutes.use(requireAuth);

// Get default permission map for all system roles (used by the UI permission matrix)
roleRoutes.get("/defaults", roleController.getDefaults);

// List all roles visible to the active company
roleRoutes.get("/", roleController.listRoles);

// Get a single role
roleRoutes.get("/:id", roleController.getRoleById);

// Create a new custom role
roleRoutes.post(
  "/",
  requirePermission(Resource.role, Action.create),
  roleController.createRole,
);

// Update a custom role
roleRoutes.put(
  "/:id",
  requirePermission(Resource.role, Action.update),
  roleController.updateRole,
);

// Delete a custom role
roleRoutes.delete(
  "/:id",
  requirePermission(Resource.role, Action.delete),
  roleController.deleteRole,
);

export default roleRoutes;
