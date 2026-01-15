import { Application } from "express";

import authRoutes from "../modules/auth/authRoutes.js";
import subscriptionRoutes from "../modules/subscription/subscriptionRoutes.js";
import accountsRoutes from "../modules/accounts/accountsRoutes.js";
import inventoryRoutes from "../modules/inventory/inventoryRoutes.js";
import supplierRoutes from "../modules/supplier/supplierRoutes.js";

import userRoutes from "../modules/user/userRoutes.js";

/**
 * Register all API routes
 */
export default (app: Application): void => {
  // API version prefix
  const API_PREFIX = "/api/v1";

  // Auth routes (Better Auth handler - no API key required)
  // Express v5 syntax: use :splat* for catch-all routes
  app.use(`${API_PREFIX}/auth`, authRoutes);

  // User routes (API key middleware applied in app.ts)
  app.use(`${API_PREFIX}/users`, userRoutes);

  // Subscription routes (mock endpoints)
  app.use(`${API_PREFIX}/subscriptions`, subscriptionRoutes);

  // Accounts routes
  app.use(`${API_PREFIX}/accounts`, accountsRoutes);

  // Inventory routes
  app.use(`${API_PREFIX}/inventory`, inventoryRoutes);

  // Supplier routes
  app.use(`${API_PREFIX}/suppliers`, supplierRoutes);

  // Add more routes here as needed
  // app.use(`${API_PREFIX}/clients`, clientRoutes);
  // app.use(`${API_PREFIX}/invoices`, invoiceRoutes);
  // app.use(`${API_PREFIX}/transactions`, transactionRoutes);
};
