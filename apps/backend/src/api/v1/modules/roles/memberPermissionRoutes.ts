import express from "express";
import { memberPermissionController } from "./memberPermissionController.js";
import {
  requireAuth,
  requirePermission,
} from "../../shared/middleware/auth.middleware.js";
import { Action, Resource } from "../../shared/auth/permissions.js";

const memberPermissionRoutes = express.Router();

memberPermissionRoutes.use(requireAuth);

// Provision a MemberPermission record after accepting an invitation.
// Auth-only — no requirePermission since the user has no permissions yet.
memberPermissionRoutes.post(
  "/provision",
  memberPermissionController.provisionMember,
);

// Get raw permission record (role + grants + revocations)
memberPermissionRoutes.get(
  "/:userId/permissions",
  requirePermission(Resource.user, Action.read),
  memberPermissionController.getMemberPermissions,
);

// Get fully resolved effective permissions (useful for the permission matrix UI)
memberPermissionRoutes.get(
  "/:userId/permissions/effective",
  requirePermission(Resource.user, Action.read),
  memberPermissionController.getEffectivePermissions,
);

// Assign a role (+ optional grants/revocations) to a member
memberPermissionRoutes.put(
  "/:userId/permissions",
  requirePermission(Resource.user, Action.update),
  memberPermissionController.assignRole,
);

// Update only the per-user grants/revocations (role stays the same)
memberPermissionRoutes.patch(
  "/:userId/permissions/overrides",
  requirePermission(Resource.user, Action.update),
  memberPermissionController.updateOverrides,
);

export default memberPermissionRoutes;
