import { Router } from "express";
import {
  recordPaymentReceived,
  getPaymentsReceived,
  recordPaymentMade,
  getPaymentsMade,
  getCustomerPayments,
  getPaymentById,
  suggestPaymentAllocations,
  voidPayment,
} from "./paymentController.js";
import {
  requireAuth,
  requirePermission,
} from "../../shared/middleware/auth.middleware.js";
import { Action, Resource } from "../../shared/auth/permissions.js";

/**
 * Payment Routes
 * Handles all payment-related endpoints
 */
export const paymentRoutes = Router();

// Apply auth middleware to all payment routes
paymentRoutes.use(requireAuth);

/**
 * POST /api/v1/payments/received
 * Record a new payment received from a customer
 */
paymentRoutes.post(
  "/received",
  requirePermission(Resource.payment, Action.create),
  recordPaymentReceived,
);

/**
 * GET /api/v1/payments/received
 * Get all payments received for a company
 */
paymentRoutes.get(
  "/received",
  requirePermission(Resource.payment, Action.read),
  getPaymentsReceived,
);

/**
 * POST /api/v1/payments/made
 * Record a new payment made to a supplier
 */
paymentRoutes.post(
  "/made",
  requirePermission(Resource.payment, Action.create),
  recordPaymentMade,
);

/**
 * GET /api/v1/payments/made
 * Get all payments made for a company
 */
paymentRoutes.get(
  "/made",
  requirePermission(Resource.payment, Action.read),
  getPaymentsMade,
);

/**
 * POST /api/v1/payments/suggest-allocations
 * Get suggested payment allocations for a customer
 */
paymentRoutes.post(
  "/suggest-allocations",
  requirePermission(Resource.payment, Action.read),
  suggestPaymentAllocations,
);

/**
 * GET /api/v1/payments/customer/:customerId
 * Get all payments for a specific customer
 */
paymentRoutes.get(
  "/customer/:customerId",
  requirePermission(Resource.payment, Action.read),
  getCustomerPayments,
);

/**
 * GET /api/v1/payments/:paymentId
 * Get a specific payment by ID
 */
paymentRoutes.get(
  "/:paymentId",
  requirePermission(Resource.payment, Action.read),
  getPaymentById,
);

/**
 * POST /api/v1/payments/:paymentId/void
 * Void a payment (reverse the transaction)
 */
paymentRoutes.post(
  "/:paymentId/void",
  requirePermission(Resource.payment, Action.update),
  voidPayment,
);

export default paymentRoutes;
