import { Router } from "express";
import {
  generateBalanceSheet,
  generateIncomeStatement,
  generateCashFlowStatement,
  generateTrialBalance,
} from "./reportController.js";
import { requireAuth } from "../../shared/middleware/auth.middleware.js";

export const reportRoutes = Router();

// Apply auth middleware to all routes
reportRoutes.use(requireAuth);

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

export default reportRoutes;
