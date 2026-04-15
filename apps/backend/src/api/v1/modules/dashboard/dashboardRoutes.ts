import { Router } from "express";
import { getDashboardOverview } from "./dashboardController.js";
import {
  requireAuth,
  requirePermission,
} from "../../shared/middleware/auth.middleware.js";
import { Action, Resource } from "../../shared/auth/permissions.js";

const dashboardRoutes = Router();

dashboardRoutes.use(requireAuth);
dashboardRoutes.use(requirePermission(Resource.report, Action.read));

/**
 * Dashboard Routes
 */

// GET /api/v1/dashboard/overview — aggregated KPIs + charts
dashboardRoutes.get("/overview", getDashboardOverview);

export default dashboardRoutes;
