import express, { Router } from "express";
import companySettingsController from "./companySettingsController.js";
import {
  requireAuth,
  requirePermission,
} from "../../shared/middleware/auth.middleware.js";
import { Action, Resource } from "../../shared/auth/permissions.js";

const companySettingsRoutes: Router = express.Router();

// Apply auth middleware to all routes
companySettingsRoutes.use(requireAuth);

// Get company settings
companySettingsRoutes.get(
  "/",
  requirePermission(Resource.companySetting, Action.read),
  companySettingsController.getCompanySettings,
);

// Update general settings
companySettingsRoutes.put(
  "/general",
  requirePermission(Resource.companySetting, Action.update),
  companySettingsController.updateGeneralSettings,
);

// Banking routes
// Get specific bank account
companySettingsRoutes.get(
  "/banking/accounts/:id",
  requirePermission(Resource.companySetting, Action.read),
  companySettingsController.getBankAccount,
);

// Add bank account
companySettingsRoutes.post(
  "/banking/accounts",
  requirePermission(Resource.companySetting, Action.create),
  companySettingsController.addBankAccount,
);

// Update bank account
companySettingsRoutes.put(
  "/banking/accounts/:id",
  requirePermission(Resource.companySetting, Action.update),
  companySettingsController.updateBankAccount,
);

// Remove bank account
companySettingsRoutes.delete(
  "/banking/accounts/:id",
  requirePermission(Resource.companySetting, Action.delete),
  companySettingsController.removeBankAccount,
);

export default companySettingsRoutes;
