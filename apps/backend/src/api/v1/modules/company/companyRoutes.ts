import express, { Router } from "express";

import { Action, Resource } from "../../shared/auth/permissions.js";
import {
  requireAuth,
  requirePermission,
} from "../../shared/middleware/auth.middleware.js";

import companyController from "./companyController.js";

const companyRoutes: Router = express.Router();

companyRoutes.use(requireAuth);

// DELETE /api/v1/company — owner-only org deletion with full data cascade
companyRoutes.delete(
  "/",
  requirePermission(Resource.companySetting, Action.delete),
  companyController.deleteOrganization,
);

export default companyRoutes;
