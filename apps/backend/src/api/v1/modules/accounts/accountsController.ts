import { Request, Response } from "express";
import { accountSchema } from "@sas/validators";
import accountsService from "./accountsService.js";
import logger from "../../config/logger.js";
import { getCompanyId } from "../../shared/helpers/utils.js";

/**
 * Accounts Controller
 * Handles HTTP requests for account operations
 */

const accountsController = {
  /**
   * GET /api/v1/accounts
   * Get all accounts for the company
   */
  getAllAccounts: async (req: Request, res: Response) => {
    try {
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const accounts = await accountsService.getAllAccounts(companyId);

      return res.status(200).json({
        success: true,
        data: accounts,
        count: accounts.length,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-all-accounts-controller",
      });
      return res.status(500).json({
        success: false,
        message: "Failed to fetch accounts",
        error: (error as Error).message,
      });
    }
  },

  /**
   * GET /api/v1/accounts/type/:accountType
   * Get accounts by type
   */
  getAccountsByType: async (req: Request, res: Response) => {
    try {
      const { accountType } = req.params;
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const accounts = await accountsService.getAccountsByType(
        companyId,
        accountType,
      );

      return res.status(200).json({
        success: true,
        data: accounts,
        count: accounts.length,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-accounts-by-type-controller",
      });
      return res.status(500).json({
        success: false,
        message: "Failed to fetch accounts by type",
        error: (error as Error).message,
      });
    }
  },

  /**
   * GET /api/v1/accounts/:id
   * Get a single account
   */
  getAccountById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const account = await accountsService.getAccountById(companyId, id);

      return res.status(200).json({
        success: true,
        data: account,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-account-by-id-controller",
      });

      if ((error as Error).message === "Account not found") {
        return res.status(404).json({
          success: false,
          message: "Account not found",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to fetch account",
        error: (error as Error).message,
      });
    }
  },

  /**
   * POST /api/v1/accounts
   * Create a new account
   */
  createAccount: async (req: Request, res: Response) => {
    try {
      const companyId = getCompanyId(req);
      const accountData = req.body;

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      // Validate request body
      const validationResult = accountSchema.safeParse(accountData);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationResult.error.issues,
        });
      }

      const account = await accountsService.createAccount(
        companyId,
        validationResult.data,
      );

      return res.status(201).json({
        success: true,
        message: "Account created successfully",
        data: account,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "create-account-controller",
      });

      return res.status(400).json({
        success: false,
        message: "Failed to create account",
        error: (error as Error).message,
      });
    }
  },

  /**
   * PUT /api/v1/accounts/:id
   * Update an account
   */
  updateAccount: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = getCompanyId(req);
      const updateData = req.body;

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      // Validate request body (partial update)
      const validationResult = accountSchema.partial().safeParse(updateData);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationResult.error.issues,
        });
      }

      const account = await accountsService.updateAccount(
        companyId,
        id,
        validationResult.data,
      );

      return res.status(200).json({
        success: true,
        message: "Account updated successfully",
        data: account,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "update-account-controller",
      });

      if ((error as Error).message === "Account not found") {
        return res.status(404).json({
          success: false,
          message: "Account not found",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Failed to update account",
        error: (error as Error).message,
      });
    }
  },

  /**
   * DELETE /api/v1/accounts/:id
   * Delete an account
   */
  deleteAccount: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const account = await accountsService.deleteAccount(companyId, id);

      return res.status(200).json({
        success: true,
        message: "Account deleted successfully",
        data: account,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "delete-account-controller",
      });

      if ((error as Error).message === "Account not found") {
        return res.status(404).json({
          success: false,
          message: "Account not found",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Failed to delete account",
        error: (error as Error).message,
      });
    }
  },

  /**
   * GET /api/v1/accounts/:id/balance
   * Get account balance
   */
  getAccountBalance: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const balance = await accountsService.getAccountBalance(companyId, id);

      return res.status(200).json({
        success: true,
        data: balance,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-account-balance-controller",
      });

      if ((error as Error).message === "Account not found") {
        return res.status(404).json({
          success: false,
          message: "Account not found",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to fetch account balance",
        error: (error as Error).message,
      });
    }
  },

  /**
   * GET /api/v1/accounts/search
   * Search accounts
   */
  searchAccounts: async (req: Request, res: Response) => {
    try {
      const { q } = req.query;
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      if (!q || typeof q !== "string") {
        return res.status(400).json({
          success: false,
          message: "Search term is required",
        });
      }

      const accounts = await accountsService.searchAccounts(companyId, q);

      return res.status(200).json({
        success: true,
        data: accounts,
        count: accounts.length,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "search-accounts-controller",
      });

      return res.status(500).json({
        success: false,
        message: "Failed to search accounts",
        error: (error as Error).message,
      });
    }
  },

  /**
   * GET /api/v1/accounts/chart/view
   * Get chart of accounts
   */
  getChartOfAccounts: async (req: Request, res: Response) => {
    try {
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const chartOfAccounts =
        await accountsService.getChartOfAccounts(companyId);

      return res.status(200).json({
        success: true,
        data: chartOfAccounts,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-chart-of-accounts-controller",
      });

      return res.status(500).json({
        success: false,
        message: "Failed to fetch chart of accounts",
        error: (error as Error).message,
      });
    }
  },

  /**
   * PUT /api/v1/accounts/:id/archive
   * Archive an account (soft delete)
   */
  archiveAccount: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const account = await accountsService.archiveAccount(companyId, id);

      return res.status(200).json({
        success: true,
        message: "Account archived successfully",
        data: account,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "archive-account-controller",
      });

      if ((error as Error).message === "Account not found") {
        return res.status(404).json({
          success: false,
          message: "Account not found",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Failed to archive account",
        error: (error as Error).message,
      });
    }
  },

  /**
   * PUT /api/v1/accounts/:id/restore
   * Restore an archived account
   */
  restoreAccount: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const account = await accountsService.restoreAccount(companyId, id);

      return res.status(200).json({
        success: true,
        message: "Account restored successfully",
        data: account,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "restore-account-controller",
      });

      if ((error as Error).message === "Account not found") {
        return res.status(404).json({
          success: false,
          message: "Account not found",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Failed to restore account",
        error: (error as Error).message,
      });
    }
  },

  /**
   * POST /api/v1/accounts/:id/reconcile
   * Reconcile account balance with ledger
   */
  reconcileAccountBalance: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const result = await accountsService.reconcileAccountBalance(
        companyId,
        id,
      );

      return res.status(200).json({
        success: true,
        message: result.reconciled
          ? "Account balance reconciled successfully"
          : "Account balance already in sync",
        data: result,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "reconcile-account-balance-controller",
      });

      if ((error as Error).message === "Account not found") {
        return res.status(404).json({
          success: false,
          message: "Account not found",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to reconcile account balance",
        error: (error as Error).message,
      });
    }
  },

  /**
   * POST /api/v1/accounts/reconcile-all
   * Reconcile all account balances for the company
   */
  reconcileAllAccountBalances: async (req: Request, res: Response) => {
    try {
      const companyId = getCompanyId(req);

      if (!companyId) {
        return res.status(401).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const result =
        await accountsService.reconcileAllAccountBalances(companyId);

      return res.status(200).json({
        success: true,
        message: `Reconciled ${result.reconciledCount} of ${result.totalAccounts} accounts`,
        data: result,
      });
    } catch (error) {
      logger.logError(error as Error, {
        operation: "reconcile-all-account-balances-controller",
      });

      return res.status(500).json({
        success: false,
        message: "Failed to reconcile account balances",
        error: (error as Error).message,
      });
    }
  },
};

export default accountsController;
