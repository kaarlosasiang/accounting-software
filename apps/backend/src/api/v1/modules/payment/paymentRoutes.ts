import { Router } from "express";
import {
  recordPaymentReceived,
  getPaymentsReceived,
  getCustomerPayments,
  getPaymentById,
  suggestPaymentAllocations,
} from "./paymentController.js";

/**
 * Payment Routes
 * Handles all payment-related endpoints
 */
export const paymentRoutes = Router();

/**
 * POST /api/v1/payments/received
 * Record a new payment received from a customer
 */
paymentRoutes.post("/received", recordPaymentReceived);

/**
 * GET /api/v1/payments/received
 * Get all payments received for a company
 */
paymentRoutes.get("/received", getPaymentsReceived);

/**
 * POST /api/v1/payments/suggest-allocations
 * Get suggested payment allocations for a customer
 */
paymentRoutes.post("/suggest-allocations", suggestPaymentAllocations);

/**
 * GET /api/v1/payments/customer/:customerId
 * Get all payments for a specific customer
 */
paymentRoutes.get("/customer/:customerId", getCustomerPayments);

/**
 * GET /api/v1/payments/:paymentId
 * Get a specific payment by ID
 */
paymentRoutes.get("/:paymentId", getPaymentById);

export default paymentRoutes;
