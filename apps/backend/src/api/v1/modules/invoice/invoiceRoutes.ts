import express from "express";
import { invoiceController } from "./invoiceController.js";
import { requireAuth } from "../../shared/middleware/auth.middleware.js";

const invoiceRoutes = express.Router();

// Apply auth middleware to all routes
invoiceRoutes.use(requireAuth);

/**
 * Invoice Routes
 */

// Search invoices (must be before /:id routes)
invoiceRoutes.get("/search", invoiceController.searchInvoices);

// Get overdue invoices (must be before /:id routes)
invoiceRoutes.get("/overdue", invoiceController.getOverdueInvoices);

// Get invoices by customer (must be before /:id routes)
invoiceRoutes.get(
  "/customer/:customerId",
  invoiceController.getInvoicesByCustomer,
);

// Get invoices by status (must be before /:id routes)
invoiceRoutes.get("/status/:status", invoiceController.getInvoicesByStatus);

// CRUD operations
invoiceRoutes.get("/", invoiceController.getAllInvoices);
invoiceRoutes.get("/:id", invoiceController.getInvoiceById);
invoiceRoutes.post("/", invoiceController.createInvoice);
invoiceRoutes.put("/:id", invoiceController.updateInvoice);
invoiceRoutes.delete("/:id", invoiceController.deleteInvoice);

// Void invoice
invoiceRoutes.post("/:id/void", invoiceController.voidInvoice);

// Send invoice
invoiceRoutes.post("/:id/send", invoiceController.sendInvoice);

export { invoiceRoutes };
