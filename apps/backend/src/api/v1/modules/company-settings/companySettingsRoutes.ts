import express, { Router } from "express";
import companySettingsController from "./companySettingsController.js";
import { requireAuth } from "../../shared/middleware/auth.middleware.js";

const companySettingsRoutes: Router = express.Router();

// Apply auth middleware to all routes
companySettingsRoutes.use(requireAuth);

// Get company settings
companySettingsRoutes.get("/", companySettingsController.getCompanySettings);

// Update general settings
companySettingsRoutes.put(
  "/general",
  companySettingsController.updateGeneralSettings,
);

// Banking routes
// Get specific bank account
companySettingsRoutes.get(
  "/banking/accounts/:id",
  companySettingsController.getBankAccount,
);

// Add bank account
companySettingsRoutes.post(
  "/banking/accounts",
  companySettingsController.addBankAccount,
);

// Update bank account
companySettingsRoutes.put(
  "/banking/accounts/:id",
  companySettingsController.updateBankAccount,
);

// Remove bank account
companySettingsRoutes.delete(
  "/banking/accounts/:id",
  companySettingsController.removeBankAccount,
);

export default companySettingsRoutes;
