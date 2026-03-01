import express, { Router } from "express";
import customerController from "./customerController.js";
import {
  requireAuth,
  requirePermission,
} from "../../shared/middleware/auth.middleware.js";
import { Action, Resource } from "../../shared/auth/permissions.js";

const customerRoutes: Router = express.Router();

// Apply auth middleware to all routes
customerRoutes.use(requireAuth);

// Create a new customer
customerRoutes.post(
  "/",
  requirePermission(Resource.customer, Action.create),
  customerController.createCustomer,
);

// Get all customers
customerRoutes.get(
  "/",
  requirePermission(Resource.customer, Action.read),
  customerController.getAllCustomers,
);

// Get active customers
customerRoutes.get(
  "/active",
  requirePermission(Resource.customer, Action.read),
  customerController.getActiveCustomers,
);

// Search customers
customerRoutes.get(
  "/search",
  requirePermission(Resource.customer, Action.read),
  customerController.searchCustomers,
);

// Get customer by customer code
customerRoutes.get(
  "/code/:code",
  requirePermission(Resource.customer, Action.read),
  customerController.getCustomerByCode,
);

// Get customer by ID
customerRoutes.get(
  "/:id",
  requirePermission(Resource.customer, Action.read),
  customerController.getCustomerById,
);

// Update a customer
customerRoutes.put(
  "/:id",
  requirePermission(Resource.customer, Action.update),
  customerController.updateCustomer,
);

// Delete a customer
customerRoutes.delete(
  "/:id",
  requirePermission(Resource.customer, Action.delete),
  customerController.deleteCustomer,
);

// Toggle customer active status
customerRoutes.patch(
  "/:id/toggle-status",
  requirePermission(Resource.customer, Action.update),
  customerController.toggleCustomerStatus,
);

// Update customer balance
customerRoutes.patch(
  "/:id/balance",
  requirePermission(Resource.customer, Action.update),
  customerController.updateCustomerBalance,
);

// Check credit availability
customerRoutes.post(
  "/:id/check-credit",
  requirePermission(Resource.customer, Action.read),
  customerController.checkCreditAvailability,
);

export default customerRoutes;
