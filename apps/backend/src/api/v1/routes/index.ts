import { Application } from "express";

import authRoutes from "../modules/auth/authRoutes.js";
import subscriptionRoutes from "../modules/subscription/subscriptionRoutes.js";
import accountsRoutes from "../modules/accounts/accountsRoutes.js";
import roleRoutes from "../modules/roles/roleRoutes.js";
import memberPermissionRoutes from "../modules/roles/memberPermissionRoutes.js";
import inventoryRoutes from "../modules/inventory/inventoryRoutes.js";
import supplierRoutes from "../modules/supplier/supplierRoutes.js";
import customerRoutes from "../modules/customer/customerRoutes.js";
import { invoiceRoutes } from "../modules/invoice/invoiceRoutes.js";
import { billRoutes } from "../modules/bill/billRoutes.js";
import { paymentRoutes } from "../modules/payment/paymentRoutes.js";
import journalEntryRoutes from "../modules/journalEntry/journalEntryRoutes.js";
import ledgerRoutes from "../modules/ledger/ledgerRoutes.js";
import { reportRoutes } from "../modules/report/reportRoutes.js";
import periodRoutes from "../modules/period/periodRoutes.js";
import companySettingsRoutes from "../modules/company-settings/companySettingsRoutes.js";

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

  // Customer routes
  app.use(`${API_PREFIX}/customers`, customerRoutes);

  // Invoice routes
  app.use(`${API_PREFIX}/invoices`, invoiceRoutes);

  // Bill routes
  app.use(`${API_PREFIX}/bills`, billRoutes);

  // Payment routes
  app.use(`${API_PREFIX}/payments`, paymentRoutes);

  // Journal Entry routes
  app.use(`${API_PREFIX}/journal-entries`, journalEntryRoutes);

  // Ledger routes
  app.use(`${API_PREFIX}/ledger`, ledgerRoutes);

  // Report routes
  app.use(`${API_PREFIX}/reports`, reportRoutes);

  // Accounting Period routes
  app.use(`${API_PREFIX}/periods`, periodRoutes);

  // Company Settings routes
  app.use(`${API_PREFIX}/company-settings`, companySettingsRoutes);

  // Roles routes
  app.use(`${API_PREFIX}/roles`, roleRoutes);

  // Member permission routes
  app.use(`${API_PREFIX}/members`, memberPermissionRoutes);

  // Add more routes here as needed
  // app.use(`${API_PREFIX}/transactions`, transactionRoutes);
};
