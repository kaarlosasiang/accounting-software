import { Application } from "express";

import authRoutes from "./auth.routes";
import companyRoutes from "./company.routes";
import subscriptionRoutes from "./subscription.routes";
import userRoutes from "./user.routes";

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

  // Company routes
  app.use(`${API_PREFIX}/companies`, companyRoutes);

  // Add more routes here as needed
  // app.use(`${API_PREFIX}/clients`, clientRoutes);
  // app.use(`${API_PREFIX}/invoices`, invoiceRoutes);
  // app.use(`${API_PREFIX}/transactions`, transactionRoutes);
};
