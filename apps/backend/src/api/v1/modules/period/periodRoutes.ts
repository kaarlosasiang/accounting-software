import express, { Router } from "express";
import { periodController } from "./periodController.js";
import {
  requireAuth,
  requirePermission,
} from "../../shared/middleware/auth.middleware.js";
import { Action, Resource } from "../../shared/auth/permissions.js";

const periodRoutes: Router = express.Router();

// Apply auth middleware to all routes
periodRoutes.use(requireAuth);

// Get all accounting periods (with optional filters)
periodRoutes.get(
  "/",
  requirePermission(Resource.period, Action.read),
  periodController.getAllPeriods,
);

// Check if a date is in a closed/locked period
periodRoutes.get(
  "/check-date",
  requirePermission(Resource.period, Action.read),
  periodController.checkDateInClosedPeriod,
);

// Find period for a specific date
periodRoutes.get(
  "/find-by-date",
  requirePermission(Resource.period, Action.read),
  periodController.findPeriodForDate,
);

// Get period by ID
periodRoutes.get(
  "/:periodId",
  requirePermission(Resource.period, Action.read),
  periodController.getPeriodById,
);

// Create new accounting period
periodRoutes.post(
  "/",
  requirePermission(Resource.period, Action.create),
  periodController.createPeriod,
);

// Close a period (creates closing entry)
periodRoutes.post(
  "/:periodId/close",
  requirePermission(Resource.period, Action.update),
  periodController.closePeriod,
);

// Reopen a closed period (reverses closing entry)
periodRoutes.post(
  "/:periodId/reopen",
  requirePermission(Resource.period, Action.update),
  periodController.reopenPeriod,
);

// Lock a period (prevent any modifications)
periodRoutes.post(
  "/:periodId/lock",
  requirePermission(Resource.period, Action.update),
  periodController.lockPeriod,
);

// Update period details
periodRoutes.put(
  "/:periodId",
  requirePermission(Resource.period, Action.update),
  periodController.updatePeriod,
);

// Delete period (only if open and no transactions)
periodRoutes.delete(
  "/:periodId",
  requirePermission(Resource.period, Action.delete),
  periodController.deletePeriod,
);

export default periodRoutes;
