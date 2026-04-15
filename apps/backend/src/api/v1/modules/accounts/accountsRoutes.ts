import express, { Router } from "express";
import accountsController from "./accountsController.js";
import {
  requireAuth,
  requirePermission,
} from "../../shared/middleware/auth.middleware.js";
import { Action, Resource } from "../../shared/auth/permissions.js";

const accountsRoutes: Router = express.Router();

// Apply auth middleware to all routes
accountsRoutes.use(requireAuth);

// Get all accounts for the company
accountsRoutes.get(
  "/",
  requirePermission(Resource.accounts, Action.read),
  accountsController.getAllAccounts,
);

// Get chart of accounts
accountsRoutes.get(
  "/chart/view",
  requirePermission(Resource.accounts, Action.read),
  accountsController.getChartOfAccounts,
);

// Reconcile all account balances
accountsRoutes.post(
  "/reconcile-all",
  requirePermission(Resource.accounts, Action.update),
  accountsController.reconcileAllAccountBalances,
);

// Search accounts
accountsRoutes.get(
  "/search",
  requirePermission(Resource.accounts, Action.read),
  accountsController.searchAccounts,
);

// Get accounts by type
accountsRoutes.get(
  "/type/:accountType",
  requirePermission(Resource.accounts, Action.read),
  accountsController.getAccountsByType,
);

// Create a new account
accountsRoutes.post(
  "/",
  requirePermission(Resource.accounts, Action.create),
  accountsController.createAccount,
);

// Get single account
accountsRoutes.get(
  "/:id",
  requirePermission(Resource.accounts, Action.read),
  accountsController.getAccountById,
);

// Get account balance
accountsRoutes.get(
  "/:id/balance",
  requirePermission(Resource.accounts, Action.read),
  accountsController.getAccountBalance,
);

// Update account
accountsRoutes.put(
  "/:id",
  requirePermission(Resource.accounts, Action.update),
  accountsController.updateAccount,
);

// Archive account (soft delete)
accountsRoutes.put(
  "/:id/archive",
  requirePermission(Resource.accounts, Action.update),
  accountsController.archiveAccount,
);

// Restore account
accountsRoutes.put(
  "/:id/restore",
  requirePermission(Resource.accounts, Action.update),
  accountsController.restoreAccount,
);

// Reconcile single account balance
accountsRoutes.post(
  "/:id/reconcile",
  requirePermission(Resource.accounts, Action.update),
  accountsController.reconcileAccountBalance,
);

// Delete account
accountsRoutes.delete("/:id", accountsController.deleteAccount);

export default accountsRoutes;
