import { NextFunction, Request, Response } from "express";

import logger from "../../config/logger.js";
import { getCompanyId } from "../../shared/helpers/utils.js";

import { dashboardService } from "./dashboardService.js";

/**
 * GET /api/v1/dashboard/overview
 * Returns aggregated KPIs, recent transactions, and monthly trend.
 */
export const getDashboardOverview = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const data = await dashboardService.getOverview(companyId);

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.logError(error as Error, { operation: "getDashboardOverview" });
    next(error);
  }
};

/**
 * GET /api/v1/dashboard/analytics?year=2025
 * Returns monthly trend and per-account revenue/expense breakdowns.
 */
export const getDashboardAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const year = req.query.year
      ? parseInt(req.query.year as string, 10)
      : undefined;

    const data = await dashboardService.getAnalytics(companyId, year);

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.logError(error as Error, { operation: "getDashboardAnalytics" });
    next(error);
  }
};
