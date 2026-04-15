import { Request, Response, NextFunction } from "express";
import { dashboardService } from "./dashboardService.js";
import logger from "../../config/logger.js";
import { getCompanyId } from "../../shared/helpers/utils.js";

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
