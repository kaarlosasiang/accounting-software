import express, { Router } from "express";
import { periodController } from "./periodController.js";
import { requireAuth } from "../../shared/middleware/auth.middleware.js";

const periodRoutes: Router = express.Router();

// Apply auth middleware to all routes
periodRoutes.use(requireAuth);

// Get all accounting periods (with optional filters)
periodRoutes.get("/", periodController.getAllPeriods);

// Check if a date is in a closed/locked period
periodRoutes.get("/check-date", periodController.checkDateInClosedPeriod);

// Find period for a specific date
periodRoutes.get("/find-by-date", periodController.findPeriodForDate);

// Get period by ID
periodRoutes.get("/:periodId", periodController.getPeriodById);

// Create new accounting period
periodRoutes.post("/", periodController.createPeriod);

// Close a period (creates closing entry)
periodRoutes.post("/:periodId/close", periodController.closePeriod);

// Reopen a closed period (reverses closing entry)
periodRoutes.post("/:periodId/reopen", periodController.reopenPeriod);

// Lock a period (prevent any modifications)
periodRoutes.post("/:periodId/lock", periodController.lockPeriod);

// Update period details
periodRoutes.put("/:periodId", periodController.updatePeriod);

// Delete period (only if open and no transactions)
periodRoutes.delete("/:periodId", periodController.deletePeriod);

export default periodRoutes;
