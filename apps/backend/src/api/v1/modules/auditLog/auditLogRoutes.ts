import express from "express";

import { Action, Resource } from "../../shared/auth/permissions.js";
import {
  requireAuth,
  requirePermission,
} from "../../shared/middleware/auth.middleware.js";

import { auditLogController } from "./auditLogController.js";

const auditLogRoutes = express.Router();

auditLogRoutes.use(requireAuth);

// Record history must come before /:id to avoid conflict
auditLogRoutes.get(
  "/record/:recordId",
  requirePermission(Resource.auditLog, Action.read),
  auditLogController.getRecordHistory,
);

auditLogRoutes.get(
  "/:id",
  requirePermission(Resource.auditLog, Action.read),
  auditLogController.getAuditLogById,
);

auditLogRoutes.get(
  "/",
  requirePermission(Resource.auditLog, Action.read),
  auditLogController.getAuditLogs,
);

export default auditLogRoutes;
