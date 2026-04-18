import express from "express";

import { Action, Resource } from "../../shared/auth/permissions.js";
import {
  requireAuth,
  requirePermission,
} from "../../shared/middleware/auth.middleware.js";

import { memberPermissionController } from "./memberPermissionController.js";

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

// Self-lookup: any authenticated user can read their own effective permissions.
// Must be declared BEFORE /:userId routes to avoid "me" being matched as a userId.
memberPermissionRoutes.get(
  "/me/permissions/effective",
  memberPermissionController.getMyEffectivePermissions,
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

// Store pre-configured permissions for a pending invitation.
// Called before sending the invite so that when the invitee accepts the
// invitation and hits /provision, their custom role + overrides are applied.
memberPermissionRoutes.post(
  "/pending-permissions",
  requirePermission(Resource.user, Action.create),
  memberPermissionController.storePendingPermissions,
);

export default memberPermissionRoutes;
