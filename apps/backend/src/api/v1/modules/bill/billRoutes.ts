import express from "express";
import { billController } from "./billController.js";
import { requireAuth } from "../../shared/middleware/auth.middleware.js";

const billRoutes = express.Router();

// Apply auth middleware to all routes
billRoutes.use(requireAuth);

/**
 * Bill Routes
 */

// Search bills (must be before /:id routes)
billRoutes.get("/search", billController.searchBills);

// Get overdue bills (must be before /:id routes)
billRoutes.get("/overdue", billController.getOverdueBills);

// Get bills by supplier (must be before /:id routes)
billRoutes.get("/supplier/:supplierId", billController.getBillsBySupplier);

// Get bills by status (must be before /:id routes)
billRoutes.get("/status/:status", billController.getBillsByStatus);

// CRUD operations
billRoutes.get("/", billController.getAllBills);
billRoutes.get("/:id", billController.getBillById);
billRoutes.post("/", billController.createBill);
billRoutes.put("/:id", billController.updateBill);
billRoutes.delete("/:id", billController.deleteBill);

// Void bill
billRoutes.post("/:id/void", billController.voidBill);

// Approve bill
billRoutes.post("/:id/approve", billController.approveBill);

// Payment operations
billRoutes.post("/:id/payments", billController.recordPayment);
billRoutes.get("/:id/payments", billController.getBillPayments);

export { billRoutes };
