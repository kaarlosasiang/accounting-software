import express, { Router } from "express";
import accountsController from "./accountsController.js";
import { requireAuth } from "../../shared/middleware/auth.middleware.js";

const accountsRoutes: Router = express.Router();

// Apply auth middleware to all routes
accountsRoutes.use(requireAuth);

// Get all accounts for the company
accountsRoutes.get("/", accountsController.getAllAccounts);

// Get chart of accounts
accountsRoutes.get("/chart/view", accountsController.getChartOfAccounts);

// Search accounts
accountsRoutes.get("/search", accountsController.searchAccounts);

// Get accounts by type
accountsRoutes.get("/type/:accountType", accountsController.getAccountsByType);

// Create a new account
accountsRoutes.post("/", accountsController.createAccount);

// Get single account
accountsRoutes.get("/:id", accountsController.getAccountById);

// Get account balance
accountsRoutes.get("/:id/balance", accountsController.getAccountBalance);

// Update account
accountsRoutes.put("/:id", accountsController.updateAccount);

// Delete account
accountsRoutes.delete("/:id", accountsController.deleteAccount);

export default accountsRoutes;
