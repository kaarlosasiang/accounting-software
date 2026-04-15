import express from "express";
import { billController } from "./billController.js";
import {
  requireAuth,
  requirePermission,
} from "../../shared/middleware/auth.middleware.js";
import { Action, Resource } from "../../shared/auth/permissions.js";

const billRoutes = express.Router();

// Apply auth middleware to all routes
billRoutes.use(requireAuth);

/**
 * Bill Routes
 */

// Search bills (must be before /:id routes)
billRoutes.get(
  "/search",
  requirePermission(Resource.bill, Action.read),
  billController.searchBills,
);

// Get overdue bills (must be before /:id routes)
billRoutes.get(
  "/overdue",
  requirePermission(Resource.bill, Action.read),
  billController.getOverdueBills,
);

// Get bills by supplier (must be before /:id routes)
billRoutes.get(
  "/supplier/:supplierId",
  requirePermission(Resource.bill, Action.read),
  billController.getBillsBySupplier,
);

// Get bills by status (must be before /:id routes)
billRoutes.get(
  "/status/:status",
  requirePermission(Resource.bill, Action.read),
  billController.getBillsByStatus,
);

// CRUD operations
billRoutes.get(
  "/",
  requirePermission(Resource.bill, Action.read),
  billController.getAllBills,
);
billRoutes.get(
  "/:id",
  requirePermission(Resource.bill, Action.read),
  billController.getBillById,
);
billRoutes.post(
  "/",
  requirePermission(Resource.bill, Action.create),
  billController.createBill,
);
billRoutes.put(
  "/:id",
  requirePermission(Resource.bill, Action.update),
  billController.updateBill,
);
billRoutes.delete(
  "/:id",
  requirePermission(Resource.bill, Action.delete),
  billController.deleteBill,
);

// Void bill
billRoutes.post(
  "/:id/void",
  requirePermission(Resource.bill, Action.update),
  billController.voidBill,
);

// Approve bill
billRoutes.post(
  "/:id/approve",
  requirePermission(Resource.bill, Action.update),
  billController.approveBill,
);

// Payment operations
billRoutes.post(
  "/:id/payments",
  requirePermission(Resource.bill, Action.update),
  billController.recordPayment,
);
billRoutes.get(
  "/:id/payments",
  requirePermission(Resource.bill, Action.read),
  billController.getBillPayments,
);

export { billRoutes };
