import express from "express";
import { invoiceController } from "./invoiceController.js";
import {
  requireAuth,
  requirePermission,
} from "../../shared/middleware/auth.middleware.js";
import { Action, Resource } from "../../shared/auth/permissions.js";

const invoiceRoutes = express.Router();

// Apply auth middleware to all routes
invoiceRoutes.use(requireAuth);

/**
 * Invoice Routes
 */

// Search invoices (must be before /:id routes)
invoiceRoutes.get(
  "/search",
  requirePermission(Resource.invoice, Action.read),
  invoiceController.searchInvoices,
);

// Get overdue invoices (must be before /:id routes)
invoiceRoutes.get(
  "/overdue",
  requirePermission(Resource.invoice, Action.read),
  invoiceController.getOverdueInvoices,
);

// Get invoices by customer (must be before /:id routes)
invoiceRoutes.get(
  "/customer/:customerId",
  requirePermission(Resource.invoice, Action.read),
  invoiceController.getInvoicesByCustomer,
);

// Get invoices by status (must be before /:id routes)
invoiceRoutes.get(
  "/status/:status",
  requirePermission(Resource.invoice, Action.read),
  invoiceController.getInvoicesByStatus,
);

// CRUD operations
invoiceRoutes.get(
  "/",
  requirePermission(Resource.invoice, Action.read),
  invoiceController.getAllInvoices,
);
invoiceRoutes.get(
  "/:id",
  requirePermission(Resource.invoice, Action.read),
  invoiceController.getInvoiceById,
);
invoiceRoutes.post(
  "/",
  requirePermission(Resource.invoice, Action.create),
  invoiceController.createInvoice,
);
invoiceRoutes.put(
  "/:id",
  requirePermission(Resource.invoice, Action.update),
  invoiceController.updateInvoice,
);
invoiceRoutes.delete(
  "/:id",
  requirePermission(Resource.invoice, Action.delete),
  invoiceController.deleteInvoice,
);

// Void invoice
invoiceRoutes.post(
  "/:id/void",
  requirePermission(Resource.invoice, Action.update),
  invoiceController.voidInvoice,
);

// Send invoice
invoiceRoutes.post(
  "/:id/send",
  requirePermission(Resource.invoice, Action.update),
  invoiceController.sendInvoice,
);

// Payment operations
invoiceRoutes.post(
  "/:id/payments",
  requirePermission(Resource.invoice, Action.update),
  invoiceController.recordPayment,
);
invoiceRoutes.get(
  "/:id/payments",
  requirePermission(Resource.invoice, Action.read),
  invoiceController.getInvoicePayments,
);

export { invoiceRoutes };
