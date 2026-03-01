import { Router } from "express";
import {
  generateBalanceSheet,
  generateIncomeStatement,
  generateCashFlowStatement,
  generateTrialBalance,
  generateARAgingReport,
  generateAPAgingReport,
} from "./reportController.js";
import {
  requireAuth,
  requirePermission,
} from "../../shared/middleware/auth.middleware.js";
import { Action, Resource } from "../../shared/auth/permissions.js";

export const reportRoutes = Router();

// Apply auth + read permission middleware to all report routes
reportRoutes.use(requireAuth);
reportRoutes.use(requirePermission(Resource.report, Action.read));

/**
 * Financial Reports Routes
 * Endpoints for generating financial statements
 */

// Balance Sheet - Assets, Liabilities, Equity at a specific date
reportRoutes.get("/balance-sheet", generateBalanceSheet);

// Income Statement (Profit & Loss) - Revenue and Expenses for a period
reportRoutes.get("/income-statement", generateIncomeStatement);

// Cash Flow Statement - Operating, Investing, Financing activities
reportRoutes.get("/cash-flow", generateCashFlowStatement);

// Trial Balance - All account balances for verification
reportRoutes.get("/trial-balance", generateTrialBalance);

// Accounts Receivable Aging - Outstanding customer invoices by age
reportRoutes.get("/ar-aging", generateARAgingReport);

// Accounts Payable Aging - Outstanding supplier bills by age
reportRoutes.get("/ap-aging", generateAPAgingReport);

export default reportRoutes;
