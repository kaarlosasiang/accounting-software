import { Request, Response, NextFunction } from "express";
import { reportService } from "./reportService.js";
import logger from "../../config/logger.js";
import { getCompanyId } from "../../shared/helpers/utils.js";

/**
 * Report Controller
 * Handles HTTP requests for financial report generation
 */

/**
 * Generate Balance Sheet
 * GET /api/v1/reports/balance-sheet
 * Query params: asOfDate (optional, defaults to today)
 */
export const generateBalanceSheet = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const companyId = getCompanyId(req);
    const asOfDate = req.query.asOfDate
      ? new Date(req.query.asOfDate as string)
      : new Date();

    if (!companyId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const balanceSheet = await reportService.generateBalanceSheet(
      companyId,
      asOfDate,
    );

    res.status(200).json({
      success: true,
      data: balanceSheet,
    });
  } catch (error) {
    logger.logError(error as Error, { operation: "generateBalanceSheet" });
    next(error);
  }
};

/**
 * Generate Income Statement (Profit & Loss)
 * GET /api/v1/reports/income-statement
 * Query params: startDate, endDate (optional)
 */
export const generateIncomeStatement = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const companyId = getCompanyId(req);
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(new Date().getFullYear(), 0, 1); // Jan 1 of current year
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date();

    if (!companyId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const incomeStatement = await reportService.generateIncomeStatement(
      companyId,
      startDate,
      endDate,
    );

    res.status(200).json({
      success: true,
      data: incomeStatement,
    });
  } catch (error) {
    logger.logError(error as Error, { operation: "generateIncomeStatement" });
    next(error);
  }
};

/**
 * Generate Cash Flow Statement
 * GET /api/v1/reports/cash-flow
 * Query params: startDate, endDate (optional)
 */
export const generateCashFlowStatement = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const companyId = getCompanyId(req);
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(new Date().getFullYear(), 0, 1);
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date();

    if (!companyId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const cashFlow = await reportService.generateCashFlowStatement(
      companyId,
      startDate,
      endDate,
    );

    res.status(200).json({
      success: true,
      data: cashFlow,
    });
  } catch (error) {
    logger.logError(error as Error, { operation: "generateCashFlowStatement" });
    next(error);
  }
};

/**
 * Generate Trial Balance
 * GET /api/v1/reports/trial-balance
 * Query params: asOfDate (optional)
 */
export const generateTrialBalance = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const companyId = getCompanyId(req);
    const asOfDate = req.query.asOfDate
      ? new Date(req.query.asOfDate as string)
      : undefined;

    if (!companyId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const trialBalance = await reportService.generateTrialBalance(
      companyId,
      asOfDate,
    );

    res.status(200).json({
      success: true,
      data: trialBalance,
    });
  } catch (error) {
    logger.logError(error as Error, { operation: "generateTrialBalance" });
    next(error);
  }
};

/**
 * Generate Accounts Receivable Aging Report
 * GET /api/v1/reports/ar-aging
 * Query params: asOfDate (optional, defaults to today)
 */
export const generateARAgingReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const companyId = getCompanyId(req);
    const asOfDate = req.query.asOfDate
      ? new Date(req.query.asOfDate as string)
      : new Date();

    if (!companyId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const arAgingReport = await reportService.generateARAgingReport(
      companyId,
      asOfDate,
    );

    res.status(200).json({
      success: true,
      data: arAgingReport,
    });
  } catch (error) {
    logger.logError(error as Error, { operation: "generateARAgingReport" });
    next(error);
  }
};

/**
 * Generate Accounts Payable Aging Report
 * GET /api/v1/reports/ap-aging
 * Query params: asOfDate (optional, defaults to today)
 */
export const generateAPAgingReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const companyId = getCompanyId(req);
    const asOfDate = req.query.asOfDate
      ? new Date(req.query.asOfDate as string)
      : new Date();

    if (!companyId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const apAgingReport = await reportService.generateAPAgingReport(
      companyId,
      asOfDate,
    );

    res.status(200).json({
      success: true,
      data: apAgingReport,
    });
  } catch (error) {
    logger.logError(error as Error, { operation: "generateAPAgingReport" });
    next(error);
  }
};
